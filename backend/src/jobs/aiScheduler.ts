import cron, { ScheduledTask } from 'node-cron';
import prisma from '../config/db';
import { GeminiModelUpdateService } from '../services/aiUpdate.service';

class AiSchedulerService {
  private isRunning: boolean = false;
  private scheduledTask: ScheduledTask | null = null;

  public async initialize(): Promise<void> {
    try {
      const enabledSetting = await prisma.aiSetting.findUnique({ where: { key: 'ai_enabled' } });
      const isEnabled = enabledSetting?.value === 'true';

      const cronSetting = await prisma.aiSetting.findUnique({ where: { key: 'daily_cron_time' } });
      const timezoneSetting = await prisma.aiSetting.findUnique({ where: { key: 'timezone' } });

      const cronTime = cronSetting?.value || '02:30'; // HH:MM
      const timezone = timezoneSetting?.value || 'Asia/Kolkata';

      // Convert HH:MM to cron pattern: "MM HH * * *"
      const [hour, minute] = cronTime.split(':');
      const cronPattern = `${minute || '30'} ${hour || '2'} * * *`;

      console.log(`[Scheduler] Initializing AI Update Job Scheduler: Pattern="${cronPattern}", Timezone="${timezone}", Enabled=${isEnabled}`);

      if (this.scheduledTask) {
        this.scheduledTask.stop();
        this.scheduledTask = null;
      }

      if (!isEnabled) {
        console.log('[Scheduler] AI Updates are currently disabled in settings.');
        return;
      }

      this.scheduledTask = cron.schedule(
        cronPattern,
        async () => {
          if (this.isRunning) {
            console.warn('[Scheduler] Previous AI Update job is still running. Skipping overlapping execution.');
            return;
          }

          console.log('[Scheduler] Daily automated AI update job triggered.');
          this.isRunning = true;
          try {
            await GeminiModelUpdateService.executeUpdateJob({
              isDryRun: false,
              triggeredBy: 'scheduled'
            });
          } catch (e) {
            console.error('[Scheduler] Error in daily AI update job execution:', e);
          } finally {
            this.isRunning = false;
          }
        },
        {
          timezone: timezone as any
        }
      );

      console.log('[Scheduler] AI Update Job scheduled successfully.');
    } catch (error) {
      console.error('[Scheduler] Failed to initialize AI scheduler:', error);
    }
  }

  public async runNow(options: { isDryRun?: boolean; adminUserId?: number }): Promise<any> {
    if (this.isRunning) {
      throw new Error('An AI update job is already running. Please wait for it to finish.');
    }

    this.isRunning = true;
    try {
      const result = await GeminiModelUpdateService.executeUpdateJob({
        isDryRun: options.isDryRun ?? false,
        triggeredBy: options.adminUserId ? `admin:#${options.adminUserId}` : 'manual_trigger'
      });
      return result;
    } finally {
      this.isRunning = false;
    }
  }

  public getStatus(): { isRunning: boolean; isScheduled: boolean } {
    return {
      isRunning: this.isRunning,
      isScheduled: !!this.scheduledTask
    };
  }
}

export const aiScheduler = new AiSchedulerService();
