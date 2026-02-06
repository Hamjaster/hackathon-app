/**
 * Inngest Workflow: On Rumor Created
 * 
 * Background processing pipeline for new rumors:
 * 1. AI Analysis (summarization, time-bound detection, censorship)
 * 2. Database Update (store AI results)
 * 3. Logging & Monitoring
 */

import { inngest } from "../client";
import { analyzeRumor } from "../../ai/analyzer";
import { supabase } from "../../supabase";

export const onRumorCreated = inngest.createFunction(
  {
    id: "on-rumor-created",
    name: "Process Rumor with AI Analysis",
    retries: 2, // Retry up to 2 times on failure
  },
  { event: "rumor/created" },
  async ({ event, step }) => {
    const { rumorId, content, createdAt } = event.data;

    console.log(`[Inngest] 🚀 Processing rumor ${rumorId}`);

    // STEP 1: Run AI Analysis
    const analysis = await step.run("ai-analysis", async () => {
      console.log(`[Inngest] 🤖 Running AI analysis for rumor ${rumorId}`);

      const result = await analyzeRumor(content, createdAt);

      console.log(`[Inngest] ✅ AI analysis complete:`, {
        rumorId,
        summary: result.summary?.slice(0, 50) + '...',
        isTimeBound: result.isTimeBound,
        expiryDate: result.expiryDate,
        hasCensorship: !!result.censoredContent,
        hasHarmful: result.hasHarmfulContent,
        confidence: result.analysisMetadata.confidence,
        processingTime: result.analysisMetadata.processingTime + 'ms',
      });

      return result;
    });

    // STEP 2: Update rumor in database with AI results
    await step.run("update-database", async () => {
      console.log(`[Inngest] 💾 Updating database for rumor ${rumorId}`);

      const updateData: any = {
        ai_summary: analysis.summary,
        is_time_bound: analysis.isTimeBound,
        expiry_date: analysis.expiryDate,
        censored_content: analysis.censoredContent,
        has_harmful_content: analysis.hasHarmfulContent,
        ai_confidence: analysis.analysisMetadata.confidence,
        ai_processed_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('rumors')
        .update(updateData)
        .eq('id', rumorId);

      if (error) {
        console.error(`[Inngest] ❌ Database update failed:`, error);
        throw new Error(`Failed to update rumor ${rumorId}: ${error.message}`);
      }

      console.log(`[Inngest] ✅ Database updated successfully for rumor ${rumorId}`);
    });

    // STEP 3: Handle harmful content flagging
    if (analysis.hasHarmfulContent) {
      await step.run("flag-harmful-content", async () => {
        console.warn(`[Inngest] ⚠️ HARMFUL CONTENT DETECTED in rumor ${rumorId}`);

        // Log to audit trail
        await supabase
          .from('audit_log')
          .insert({
            rumor_id: rumorId,
            event_type: 'harmful_content_flagged',
            old_score: null,
            new_score: null,
            metadata: {
              ai_confidence: analysis.analysisMetadata.confidence,
              timestamp: new Date().toISOString(),
            },
          });

        // Optional: You could auto-moderate or notify admins here
        // For now, just flag it
      });
    }

    // STEP 4: Handle time-bound rumors
    if (analysis.isTimeBound && analysis.expiryDate) {
      await step.run("schedule-expiry", async () => {
        console.log(`[Inngest] ⏰ Rumor ${rumorId} is time-bound, expires at ${analysis.expiryDate}`);

        // Log expiry information
        await supabase
          .from('audit_log')
          .insert({
            rumor_id: rumorId,
            event_type: 'time_bound_detected',
            old_score: null,
            new_score: null,
            metadata: {
              expiry_date: analysis.expiryDate,
              timestamp: new Date().toISOString(),
            },
          });

        // You could schedule another Inngest function to run at expiry_date
        // to auto-archive or mark the rumor as expired
      });
    }

    // STEP 5: Return summary for logging
    return {
      rumorId,
      success: true,
      analysis: {
        hasSummary: !!analysis.summary,
        isTimeBound: analysis.isTimeBound,
        wasCensored: !!analysis.censoredContent,
        isFlagged: analysis.hasHarmfulContent,
        confidence: analysis.analysisMetadata.confidence,
      },
      processingTime: analysis.analysisMetadata.processingTime,
    };
  }
);
