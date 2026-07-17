import cron from 'node-cron';
import { processScheduledReminders } from './utils/reminders.js';

export function startReminderScheduler() {
  if (process.env.REMINDER_CRON_ENABLED !== 'true') {
    console.log('[CRON] Reminder scheduler disabled');
    return;
  }

  const schedule = process.env.REMINDER_CRON_SCHEDULE || '0 8 * * *';
  if (!cron.validate(schedule)) {
    console.error('[CRON] Invalid REMINDER_CRON_SCHEDULE:', schedule);
    return;
  }

  cron.schedule(schedule, async () => {
    try {
      await processScheduledReminders();
    } catch (err) {
      console.error('[CRON] Reminder job failed:', err);
    }
  });

  console.log(`[CRON] Reminder scheduler active (${schedule})`);
}
