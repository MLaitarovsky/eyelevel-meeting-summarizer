import { useState } from "react";

interface Props {
  transcript: string;
}

export function TranscriptCard({ transcript }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-6 sm:p-8">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 rounded"
      >
        <h2 className="text-lg font-semibold text-stone-900">Full Transcript</h2>
        <span className="flex items-center gap-2 text-sm text-stone-500">
          {open ? "Hide" : "Show"}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
            aria-hidden
          >
            <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.06l3.71-3.83a.75.75 0 111.08 1.04l-4.25 4.39a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z" clipRule="evenodd" />
          </svg>
        </span>
      </button>
      {open && (
        <div className="mt-4 max-h-96 overflow-y-auto whitespace-pre-wrap rounded-lg bg-stone-50 p-4 text-sm leading-relaxed text-stone-700">
          {transcript}
        </div>
      )}
    </section>
  );
}
