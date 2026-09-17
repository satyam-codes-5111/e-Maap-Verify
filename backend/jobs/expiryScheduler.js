import { runExpiryAndDueDateChecks } from '../services/expiryService.js';

let schedulerInterval = null;
let isJobRunning = false;

/**
 * Triggers the expiry check manually on-demand
 */
export async function triggerExpiryCheckNow(triggeredBy = null) {
  if (isJobRunning) {
    return { status: 'in_progress', message: 'Expiry check job is already running' };
  }
  isJobRunning = true;
  try {
    const result = await runExpiryAndDueDateChecks({ triggeredBy });
    return result;
  } catch (error) {
    console.error('[EXPIRY SCHEDULER ERROR] Manual check failed:', error.message);
    throw error;
  } finally {
    isJobRunning = false;
  }
}

/**
 * Starts the automated recurring background scheduler
 */
export function startExpiryScheduler(intervalMs = 24 * 60 * 60 * 1000) {
  if (schedulerInterval) {
    return;
  }

  console.log(`[EXPIRY SCHEDULER] Background worker initialized (interval: ${intervalMs}ms)`);

  schedulerInterval = setInterval(async () => {
    if (isJobRunning) return;
    isJobRunning = true;
    try {
      console.log('[EXPIRY SCHEDULER] Running scheduled daily statutory expiry & due-date check...');
      const result = await runExpiryAndDueDateChecks();
      console.log('[EXPIRY SCHEDULER] Completed:', JSON.stringify(result.certificates));
    } catch (err) {
      console.error('[EXPIRY SCHEDULER ERROR] Background job error:', err.message);
    } finally {
      isJobRunning = false;
    }
  }, intervalMs);

  // Unref so it won't hold open process in CLI tests
  if (schedulerInterval.unref) {
    schedulerInterval.unref();
  }
}

/**
 * Stops the scheduler
 */
export function stopExpiryScheduler() {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    console.log('[EXPIRY SCHEDULER] Stopped background worker.');
  }
}
