/**
 * Sightengine image moderation (nudity-2.1).
 * Used before uploading images to Cloudinary. Safe for Vercel serverless (no fs, buffer-based).
 */

import axios from "axios";
import FormData from "form-data";

const SIGHTENGINE_URL = "https://api.sightengine.com/1.0/check.json";
const MODEL = "nudity-2.1";

/** Thresholds: reject if explicit content above these, or if "none" below this */
const NUDITY_NONE_MIN = 0.6;
const SEXUAL_ACTIVITY_MAX = 0.4;
const SEXUAL_DISPLAY_MAX = 0.4;
const EROTICA_MAX = 0.4;

export interface SightengineNudityResult {
    sexual_activity?: number;
    sexual_display?: number;
    erotica?: number;
    none?: number;
    [key: string]: unknown;
}

export interface SightengineCheckResponse {
    status: string;
    nudity?: SightengineNudityResult;
    [key: string]: unknown;
}

export interface ModerationResult {
    allowed: boolean;
    reason?: string;
}

/**
 * Check image for nudity/explicitness using Sightengine. Uses buffer (no fs) for serverless.
 */
export async function checkImageModeration(imageBuffer: Buffer): Promise<ModerationResult> {
    const apiUser = process.env.SIGHTENGINE_API_USER;
    const apiSecret = process.env.SIGHTENGINE_API_SECRET;

    if (!apiUser || !apiSecret) {
        console.error("[Sightengine] Missing SIGHTENGINE_API_USER or SIGHTENGINE_API_SECRET");
        return { allowed: false, reason: "Image moderation is not configured" };
    }

    const form = new FormData();
    form.append("media", imageBuffer, { filename: "image.jpg" });
    form.append("models", MODEL);
    form.append("api_user", apiUser);
    form.append("api_secret", apiSecret);

    try {
        const { data } = await axios.post<SightengineCheckResponse>(SIGHTENGINE_URL, form, {
            headers: form.getHeaders(),
            maxBodyLength: Infinity,
            maxContentLength: Infinity,
            timeout: 30_000,
        });

        if (data.status !== "success") {
            return { allowed: false, reason: "Moderation check failed" };
        }

        const nudity = data.nudity;
        if (!nudity) {
            return { allowed: true };
        }

        const none = nudity.none ?? 0;
        const sexualActivity = nudity.sexual_activity ?? 0;
        const sexualDisplay = nudity.sexual_display ?? 0;
        const erotica = nudity.erotica ?? 0;

        if (none < NUDITY_NONE_MIN) {
            return { allowed: false, reason: "Image was rejected by content moderation. Please upload an appropriate image." };
        }
        if (sexualActivity > SEXUAL_ACTIVITY_MAX || sexualDisplay > SEXUAL_DISPLAY_MAX || erotica > EROTICA_MAX) {
            return { allowed: false, reason: "Image was rejected by content moderation. Please upload an appropriate image." };
        }

        return { allowed: true };
    } catch (err: unknown) {
        const ax = err as { response?: { data?: unknown }; message?: string };
        console.error("[Sightengine] API error:", ax.response?.data ?? ax.message);
        return { allowed: false, reason: "Image moderation check failed. Please try again." };
    }
}

export function isSightengineConfigured(): boolean {
    return !!(process.env.SIGHTENGINE_API_USER && process.env.SIGHTENGINE_API_SECRET);
}
