import { useRef, useState } from "react";
import { Upload } from "./components/Upload";
import { Progress, type ProcessingStage } from "./components/Progress";
import { Results } from "./components/Results";
import { processAudio } from "./lib/api";
import type { ProcessResult } from "./lib/types";

type AppState =
  | { kind: "idle" }
  | { kind: "processing"; stage: ProcessingStage }
  | { kind: "results"; result: ProcessResult }
  | { kind: "error"; message: string };

// After upload finishes, Whisper usually dominates wall time. We park on
// "transcribing" for ~6s before switching to "analyzing". Imperfect but useful
// — the user sees forward motion through three labelled stages.
const ANALYZE_STAGE_DELAY_MS = 6000;

export default function App() {
  const [state, setState] = useState<AppState>({ kind: "idle" });
  const analyzingTimer = useRef<number | null>(null);

  function clearAnalyzeTimer() {
    if (analyzingTimer.current !== null) {
      window.clearTimeout(analyzingTimer.current);
      analyzingTimer.current = null;
    }
  }

  async function handleUpload(file: File) {
    clearAnalyzeTimer();
    setState({ kind: "processing", stage: "uploading" });

    try {
      const result = await processAudio(file, () => {
        setState({ kind: "processing", stage: "transcribing" });
        analyzingTimer.current = window.setTimeout(() => {
          setState({ kind: "processing", stage: "analyzing" });
        }, ANALYZE_STAGE_DELAY_MS);
      });
      clearAnalyzeTimer();
      setState({ kind: "results", result });
    } catch (e) {
      clearAnalyzeTimer();
      setState({
        kind: "error",
        message: e instanceof Error ? e.message : "Something went wrong.",
      });
    }
  }

  function reset() {
    clearAnalyzeTimer();
    setState({ kind: "idle" });
  }

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
          <h1 className="text-xl font-semibold tracking-tight">Meeting Summarizer</h1>
          <p className="mt-0.5 text-sm text-stone-500">
            Upload an audio file. Get a transcript, summary, decisions, and action items.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
        {state.kind === "idle" && <Upload onUpload={handleUpload} />}

        {state.kind === "processing" && <Progress stage={state.stage} />}

        {state.kind === "results" && (
          <Results result={state.result} onReset={reset} />
        )}

        {state.kind === "error" && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
            <p className="font-medium text-red-900">Something went wrong.</p>
            <p className="mt-1 text-sm text-red-800">{state.message}</p>
            <button
              type="button"
              onClick={reset}
              className="mt-4 inline-flex rounded-lg bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
            >
              Try again
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
