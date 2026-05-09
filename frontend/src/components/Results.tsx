import { useState } from "react";
import type { ProcessResult } from "../lib/types";
import { downloadDocx } from "../lib/api";
import { SummaryCard } from "./SummaryCard";
import { ParticipantsCard } from "./ParticipantsCard";
import { DecisionsCard } from "./DecisionsCard";
import { ActionItemsCard } from "./ActionItemsCard";
import { OpenQuestionsCard } from "./OpenQuestionsCard";
import { TranscriptCard } from "./TranscriptCard";

interface Props {
  result: ProcessResult;
  onReset: () => void;
}

function asciiFilename(title: string): string {
  const cleaned = title.replace(/[^A-Za-z0-9_-]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 60);
  return `${cleaned || "meeting"}.docx`;
}

export function Results({ result, onReset }: Props) {
  const { analysis, transcript } = result;
  const rtl = analysis.language === "he" || analysis.language === "mixed";
  // "mixed" isn't a valid HTML lang code; for a Hebrew-leaning mixed transcript "he" is the right default.
  const langCode = analysis.language === "mixed" ? "he" : analysis.language;

  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDownload() {
    setDownloading(true);
    setError(null);
    try {
      await downloadDocx(result, asciiFilename(analysis.title));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Download failed.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="sticky top-4 z-10 flex items-center justify-between gap-3 rounded-2xl border border-stone-200 bg-white/80 px-4 py-3 backdrop-blur">
        <button
          type="button"
          onClick={onReset}
          className="text-sm text-stone-500 hover:text-stone-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 rounded"
        >
          ← New meeting
        </button>
        <button
          type="button"
          onClick={handleDownload}
          disabled={downloading}
          className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-teal-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          {downloading ? "Preparing…" : "Download as Word"}
        </button>
      </div>

      {error && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      )}

      <div dir={rtl ? "rtl" : "ltr"} lang={langCode} className="space-y-4">
        <SummaryCard
          title={analysis.title}
          language={analysis.language}
          summary={analysis.summary}
        />
        <ParticipantsCard participants={analysis.participants} />
        <DecisionsCard decisions={analysis.decisions} />
        <ActionItemsCard items={analysis.action_items} />
        <OpenQuestionsCard questions={analysis.open_questions} />
        <TranscriptCard transcript={transcript} />
      </div>
    </div>
  );
}
