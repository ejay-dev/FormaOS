/**
 * Persistent Queue for Security Events
 * 
 * Provides a file-based fallback queue for critical security events
 * when database writes fail or timeout.
 */

import { writeFile, readFile, unlink, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';

const QUEUE_DIR = process.env.SECURITY_QUEUE_DIR || (() => {
  // Default to a safer location in production
  if (process.env.NODE_ENV === 'production') {
    // Require explicit configuration in production
    throw new Error('SECURITY_QUEUE_DIR environment variable must be set in production');
  }
  return '/tmp/formaos-security-queue';
})();
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

async function ensureQueueDir(): Promise<void> {
  if (queueInitialized) return;
  
  try {
    if (!existsSync(QUEUE_DIR)) {
      await mkdir(QUEUE_DIR, { recursive: true });
    }
    queueInitialized = true;
  } catch (error) {
    console.error('[PersistentQueue] Failed to create queue directory:', error);
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
    await ensureQueueDir();
    
    const event: QueuedEvent = {
      id: `${Date.now()}-${crypto.randomUUID()}`,
      timestamp: Date.now(),
      attempts: 0,
      payload,
      type,
    };

    const filename = join(QUEUE_DIR, `${event.id}.json`);
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
    await ensureQueueDir();
    
    const fs = await import('fs/promises');
    const files = await fs.readdir(QUEUE_DIR);
    
    // Limit processing to avoid overwhelming the system
    const filesToProcess = files.filter(f => f.endsWith('.json')).slice(0, 100);
    
    for (const file of filesToProcess) {
      try {
        const filepath = join(QUEUE_DIR, file);
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
}> {
  try {
    await ensureQueueDir();
    
    const fs = await import('fs/promises');
    const files = await fs.readdir(QUEUE_DIR);
    const jsonFiles = files.filter(f => f.endsWith('.json'));
    
    let oldestTimestamp: number | undefined;
    
    if (jsonFiles.length > 0) {
      // Check first file for oldest timestamp
      try {
        const firstFile = join(QUEUE_DIR, jsonFiles[0]);
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
    };
  } catch {
    return { size: 0 };
  }
}
