import { useRef, useState } from "react";
import { MAX_UPLOAD_BYTES } from "../lib/api";

const ACCEPT = "audio/mpeg,audio/wav,audio/x-wav,audio/x-m4a,audio/mp4,audio/webm,.mp3,.wav,.m4a,.mp4,.webm";
const ALLOWED_EXTENSIONS = new Set(["mp3", "wav", "m4a", "mp4", "webm"]);

interface Props {
  onUpload: (file: File) => void;
}

export function Upload({ onUpload }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function validate(file: File): string | null {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!ext || !ALLOWED_EXTENSIONS.has(ext)) {
      return `Unsupported file type. Use mp3, wav, m4a, mp4, or webm.`;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      const mb = (file.size / (1024 * 1024)).toFixed(1);
      return `File is ${mb} MB; the limit is 25 MB.`;
    }
    return null;
  }

  function handle(file: File) {
    const message = validate(file);
    if (message) {
      setError(message);
      return;
    }
    setError(null);
    onUpload(file);
  }

  return (
    <div className="w-full">
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const file = e.dataTransfer.files?.[0];
          if (file) handle(file);
        }}
        className={[
          "rounded-2xl border-2 border-dashed bg-white p-12 text-center transition cursor-pointer",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2",
          dragOver
            ? "border-teal-500 bg-teal-50"
            : "border-stone-300 hover:border-stone-400 hover:bg-stone-50",
        ].join(" ")}
      >
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-teal-50 text-teal-700">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        </div>
        <p className="text-base font-medium text-stone-900">
          Drop an audio file here, or click to browse
        </p>
        <p className="mt-1 text-sm text-stone-500">mp3, wav, m4a, mp4, webm — up to 25 MB</p>

        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handle(file);
            e.target.value = "";
          }}
        />
      </div>

      {error && (
        <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      )}
    </div>
  );
}
