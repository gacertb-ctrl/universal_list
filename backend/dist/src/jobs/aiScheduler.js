"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiScheduler = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const db_1 = __importDefault(require("../config/db"));
const aiUpdate_service_1 = require("../services/aiUpdate.service");
class AiSchedulerService {
    isRunning = false;
    scheduledTask = null;
    async initialize() {
        try {
            const enabledSetting = await db_1.default.aiSetting.findUnique({ where: { key: 'ai_enabled' } });
            const isEnabled = enabledSetting?.value === 'true';
            const cronSetting = await db_1.default.aiSetting.findUnique({ where: { key: 'daily_cron_time' } });
            const timezoneSetting = await db_1.default.aiSetting.findUnique({ where: { key: 'timezone' } });
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
            this.scheduledTask = node_cron_1.default.schedule(cronPattern, async () => {
                if (this.isRunning) {
                    console.warn('[Scheduler] Previous AI Update job is still running. Skipping overlapping execution.');
                    return;
                }
                console.log('[Scheduler] Daily automated AI update job triggered.');
                this.isRunning = true;
                try {
                    await aiUpdate_service_1.GeminiModelUpdateService.executeUpdateJob({
                        isDryRun: false,
                        triggeredBy: 'scheduled'
                    });
                }
                catch (e) {
                    console.error('[Scheduler] Error in daily AI update job execution:', e);
                }
                finally {
                    this.isRunning = false;
                }
            }, {
                timezone: timezone
            });
            console.log('[Scheduler] AI Update Job scheduled successfully.');
        }
        catch (error) {
            console.error('[Scheduler] Failed to initialize AI scheduler:', error);
        }
    }
    async runNow(options) {
        if (this.isRunning) {
            throw new Error('An AI update job is already running. Please wait for it to finish.');
        }
        this.isRunning = true;
        try {
            const result = await aiUpdate_service_1.GeminiModelUpdateService.executeUpdateJob({
                isDryRun: options.isDryRun ?? false,
                triggeredBy: options.adminUserId ? `admin:#${options.adminUserId}` : 'manual_trigger'
            });
            return result;
        }
        finally {
            this.isRunning = false;
        }
    }
    getStatus() {
        return {
            isRunning: this.isRunning,
            isScheduled: !!this.scheduledTask
        };
    }
}
exports.aiScheduler = new AiSchedulerService();
