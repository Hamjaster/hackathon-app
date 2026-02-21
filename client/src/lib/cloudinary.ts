/**
 * Image upload helper (Cloudinary storage).
 * Uploads images through the server, which runs Sightengine content moderation
 * before storing. Rejected images are blocked with 422.
 */

import { apiUrl, getAuthHeaders } from "./api";

export async function uploadImage(file: File): Promise<string> {
  // Convert file to base64 data URI for server-side upload
  const base64 = await fileToBase64(file);

  const res = await fetch(apiUrl("/api/upload/image"), {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    credentials: "include",
    body: JSON.stringify({ image: base64 }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Image upload failed" }));
    if (res.status === 422) {
      throw new Error(err.message || "Image rejected by content moderation");
    }
    console.error("[Upload] Failed:", err);
    throw new Error(err.message || "Image upload failed");
  }

  const data = await res.json();
  return data.secure_url;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/** True if image upload (and moderation) is available via the server. */
export function isCloudinaryConfigured(): boolean {
  return true;
}
