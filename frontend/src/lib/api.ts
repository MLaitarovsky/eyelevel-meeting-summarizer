import type { ProcessResult } from "./types";

export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

// XHR (not fetch) so we can hook upload progress and switch the UI from
// "uploading" to "transcribing" the moment the bytes are off the wire.
export function processAudio(
  file: File,
  onUploadDone?: () => void,
): Promise<ProcessResult> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const form = new FormData();
    form.append("file", file);

    xhr.open("POST", "/api/process");
    xhr.responseType = "json";

    xhr.upload.addEventListener("loadend", () => {
      onUploadDone?.();
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(xhr.response as ProcessResult);
        return;
      }
      const detail = xhr.response?.detail;
      const message =
        typeof detail === "string"
          ? detail
          : detail
            ? JSON.stringify(detail)
            : `Upload failed (HTTP ${xhr.status}).`;
      reject(new Error(message));
    });

    xhr.addEventListener("error", () => reject(new Error("Network error.")));
    xhr.addEventListener("abort", () => reject(new Error("Upload was cancelled.")));

    xhr.send(form);
  });
}

export async function downloadDocx(result: ProcessResult, filename: string): Promise<void> {
  const response = await fetch("/api/export", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(result),
  });

  if (!response.ok) {
    let message = `Export failed (HTTP ${response.status}).`;
    try {
      const data = await response.json();
      if (typeof data?.detail === "string") message = data.detail;
    } catch {
      /* response body wasn't JSON; keep the generic message */
    }
    throw new Error(message);
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
