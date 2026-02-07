import { inngest } from '../client';
import { storage } from '../../storage';

/**
 * Time-Based Resolution CRON Job
 *
 * Runs every hour to check if any Active rumors meet the resolution criteria:
 * - Verified: score >= 0.75 for 48 hours
 * - Debunked: score <= 0.25 for 48 hours
 * - Inconclusive: age > 7 days AND score between 0.25-0.75
 */
export const resolutionCron = inngest.createFunction(
  {
    id: 'resolution-cron',
    name: 'Time-Based Rumor Resolution',
  },
  { cron: '0 * * * *' }, // Run every hour at minute 0
  async ({ event, step }) => {
    const result = await step.run('check-and-resolve-rumors', async () => {
      console.log('[Resolution CRON] Starting rumor resolution check...');

      const result = await storage.checkAndResolveRumors();

      console.log(`[Resolution CRON] Resolved ${result.resolved} rumors`);
      if (result.rumors.length > 0) {
        console.log(`[Resolution CRON] Resolved rumor IDs:`, result.rumors);
      }

      return result;
    });

    return {
      success: true,
      resolved: result.resolved,
      rumorIds: result.rumors,
      timestamp: new Date().toISOString()
    };
  }
);
