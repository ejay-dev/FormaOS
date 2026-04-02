const DB_NAME = 'formaos-offline';
const DB_VERSION = 1;
const SUBMISSIONS_STORE = 'pending_submissions';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export interface PendingSubmission {
  id: string;
  formId: string;
  data: Record<string, unknown>;
  metadata: {
    orgId: string;
    userId: string;
    submittedOfflineAt: string;
    formTitle?: string;
  };
  url: string;
  status: 'pending' | 'submitting' | 'failed';
  error?: string;
  attempts: number;
}

/** Queue a form submission for later sync. */
export async function queueFormSubmission(
  formId: string,
  data: Record<string, unknown>,
  metadata: PendingSubmission['metadata'],
): Promise<string> {
  const db = await openDB();
  const id = crypto.randomUUID();
  const record: PendingSubmission = {
    id,
    formId,
    data,
    metadata: { ...metadata, submittedOfflineAt: new Date().toISOString() },
    url: `/api/v1/forms/${formId}/submissions`,
    status: 'pending',
    attempts: 0,
  };
  const tx = db.transaction(SUBMISSIONS_STORE, 'readwrite');
  tx.objectStore(SUBMISSIONS_STORE).put(record);
  await new Promise<void>((res) => {
    tx.oncomplete = () => res();
  });

  // Request background sync
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    const reg = await navigator.serviceWorker.ready;
    await (
      reg as unknown as { sync: { register: (tag: string) => Promise<void> } }
    ).sync.register('form-submission-sync');
  }

  return id;
}

/** List all queued form submissions. */
export async function getPendingSubmissions(): Promise<PendingSubmission[]> {
  const db = await openDB();
  const tx = db.transaction(SUBMISSIONS_STORE, 'readonly');
  return new Promise((resolve, reject) => {
    const req = tx.objectStore(SUBMISSIONS_STORE).getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/** Attempt to submit all pending forms. */
export async function submitPending(): Promise<{
  succeeded: number;
  failed: number;
}> {
  const db = await openDB();
  const pending = await getPendingSubmissions();
  let succeeded = 0;
  let failed = 0;

  for (const sub of pending) {
    try {
      const res = await fetch(sub.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: sub.data,
          offline_submitted_at: sub.metadata.submittedOfflineAt,
        }),
      });
      if (res.ok) {
        const tx = db.transaction(SUBMISSIONS_STORE, 'readwrite');
        tx.objectStore(SUBMISSIONS_STORE).delete(sub.id);
        await new Promise<void>((r) => {
          tx.oncomplete = () => r();
        });
        succeeded++;
      } else {
        const tx = db.transaction(SUBMISSIONS_STORE, 'readwrite');
        tx.objectStore(SUBMISSIONS_STORE).put({
          ...sub,
          status: 'failed',
          attempts: sub.attempts + 1,
          error: `HTTP ${res.status}`,
        });
        await new Promise<void>((r) => {
          tx.oncomplete = () => r();
        });
        failed++;
      }
    } catch (err) {
      const tx = db.transaction(SUBMISSIONS_STORE, 'readwrite');
      tx.objectStore(SUBMISSIONS_STORE).put({
        ...sub,
        status: 'failed',
        attempts: sub.attempts + 1,
        error: String(err),
      });
      await new Promise<void>((r) => {
        tx.oncomplete = () => r();
      });
      failed++;
    }
  }

  return { succeeded, failed };
}

/** Delete a pending submission. */
export async function deletePending(id: string): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(SUBMISSIONS_STORE, 'readwrite');
  tx.objectStore(SUBMISSIONS_STORE).delete(id);
  await new Promise<void>((res) => {
    tx.oncomplete = () => res();
  });
}
