/**
 * Cloudinary image upload helper
 * Uploads images through the server, which applies WebPurify content moderation
 * before accepting the image. Rejected images are blocked immediately.
 */

const API_URL = import.meta.env.VITE_API_URL || "";

export async function uploadImage(file: File): Promise<string> {
  // Convert file to base64 data URI for server-side upload
  const base64 = await fileToBase64(file);

  const res = await fetch(`${API_URL}/api/upload/image`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ image: base64 }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Image upload failed" }));
    if (res.status === 422) {
      // Moderation rejection
      throw new Error(err.message || "Image rejected by content moderation");
    }
    console.error("[Cloudinary] Upload failed:", err);
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

export function isCloudinaryConfigured(): boolean {
  // Server-side upload is always available as long as the server is running
  return true;
}
