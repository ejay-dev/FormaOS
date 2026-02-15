/**
 * Persistent Queue for Security Events
 * 
 * Provides a file-based fallback queue for critical security events
 * when database writes fail or timeout.
 */

import { writeFile, readFile, unlink, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';

// Lazy initialization of queue directory
function getQueueDir(): string {
  const envDir = process.env.SECURITY_QUEUE_DIR;
  
  if (envDir) {
    return envDir;
  }
  
  // Default fallback for all environments
  const defaultDir = '/tmp/formaos-security-queue';
  
  // Log warning in production if using default
  if (process.env.NODE_ENV === 'production') {
    console.warn(
      '[PersistentQueue] SECURITY_QUEUE_DIR not set in production. ' +
      `Using default: ${defaultDir}. ` +
      'For production deployments, set SECURITY_QUEUE_DIR to a persistent location.'
    );
  }
  
  return defaultDir;
}

const MAX_QUEUE_SIZE = 1000; // Maximum events to queue
const MAX_RETRY_ATTEMPTS = 3;

interface QueuedEvent {
  id: string;
  timestamp: number;
  attempts: number;
  payload: any;
  type: 'security_event' | 'user_activity';
}

let queueInitialized = false;
let queueDisabled = false; // Flag to disable queue if initialization fails

async function ensureQueueDir(): Promise<boolean> {
  if (queueInitialized) return true;
  if (queueDisabled) return false;
  
  try {
    const queueDir = getQueueDir();
    if (!existsSync(queueDir)) {
      await mkdir(queueDir, { recursive: true });
    }
    queueInitialized = true;
    return true;
  } catch (error) {
    console.error('[PersistentQueue] Failed to create queue directory:', error);
    console.error('[PersistentQueue] Queue functionality disabled. Security events will be logged but not persisted on failure.');
    queueDisabled = true;
    return false;
  }
}

/**
 * Add event to persistent queue when database write fails
 */
export async function enqueueFailedEvent(
  type: 'security_event' | 'user_activity',
  payload: any,
): Promise<void> {
  try {
    const canQueue = await ensureQueueDir();
    if (!canQueue) {
      // Queue disabled, just log
      console.error('[PersistentQueue] Queue disabled, event not persisted:', { type, payload });
      return;
    }
    
    const event: QueuedEvent = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      attempts: 0,
      payload,
      type,
    };

    const queueDir = getQueueDir();
    const filename = join(queueDir, `${event.id}.json`);
    await writeFile(filename, JSON.stringify(event), 'utf8');
  } catch (error) {
    console.error('[PersistentQueue] Failed to enqueue event:', error);
    // Last resort: log to console
    console.error('[PersistentQueue] Lost event:', { type, payload });
  }
}

/**
 * Process events from persistent queue (should be called periodically)
 */
export async function processQueuedEvents(
  processor: (type: string, payload: any) => Promise<boolean>,
): Promise<{ processed: number; failed: number }> {
  let processed = 0;
  let failed = 0;

  try {
    const canQueue = await ensureQueueDir();
    if (!canQueue) {
      return { processed: 0, failed: 0 };
    }
    
    const queueDir = getQueueDir();
    const fs = await import('fs/promises');
    const files = await fs.readdir(queueDir);
    
    // Limit processing to avoid overwhelming the system
    const filesToProcess = files.filter(f => f.endsWith('.json')).slice(0, 100);
    
    for (const file of filesToProcess) {
      try {
        const filepath = join(queueDir, file);
        const content = await readFile(filepath, 'utf8');
        const event: QueuedEvent = JSON.parse(content);
        
        // Skip if too many attempts
        if (event.attempts >= MAX_RETRY_ATTEMPTS) {
          console.warn('[PersistentQueue] Dropping event after max retries:', event.id);
          await unlink(filepath);
          failed++;
          continue;
        }
        
        // Try to process
        const success = await processor(event.type, event.payload);
        
        if (success) {
          await unlink(filepath);
          processed++;
        } else {
          // Increment attempt counter
          event.attempts++;
          await writeFile(filepath, JSON.stringify(event), 'utf8');
          failed++;
        }
      } catch (error) {
        console.error('[PersistentQueue] Failed to process queued event:', error);
        failed++;
      }
    }
  } catch (error) {
    console.error('[PersistentQueue] Failed to process queue:', error);
  }

  return { processed, failed };
}

/**
 * Get queue statistics
 */
export async function getQueueStats(): Promise<{
  size: number;
  oldestTimestamp?: number;
  disabled?: boolean;
}> {
  try {
    const canQueue = await ensureQueueDir();
    if (!canQueue) {
      return { size: 0, disabled: true };
    }
    
    const queueDir = getQueueDir();
    const fs = await import('fs/promises');
    const files = await fs.readdir(queueDir);
    const jsonFiles = files.filter(f => f.endsWith('.json'));
    
    let oldestTimestamp: number | undefined;
    
    if (jsonFiles.length > 0) {
      // Check first file for oldest timestamp
      try {
        const firstFile = join(queueDir, jsonFiles[0]);
        const content = await readFile(firstFile, 'utf8');
        const event: QueuedEvent = JSON.parse(content);
        oldestTimestamp = event.timestamp;
      } catch {
        // Ignore errors reading individual files
      }
    }
    
    return {
      size: jsonFiles.length,
      oldestTimestamp,
      disabled: false,
    };
  } catch {
    return { size: 0, disabled: true };
  }
}
