export type ProcessingStage = "uploading" | "transcribing" | "analyzing";

interface Props {
  stage: ProcessingStage;
}

const ORDER: ProcessingStage[] = ["uploading", "transcribing", "analyzing"];

const LABELS: Record<ProcessingStage, string> = {
  uploading: "Uploading",
  transcribing: "Transcribing",
  analyzing: "Analyzing",
};

export function Progress({ stage }: Props) {
  const activeIndex = ORDER.indexOf(stage);

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-8">
      <ol className="flex items-center justify-between gap-2">
        {ORDER.map((s, i) => {
          const state =
            i < activeIndex ? "done" : i === activeIndex ? "active" : "pending";
          return (
            <li key={s} className="flex flex-1 items-center gap-3">
              <span
                aria-hidden
                className={[
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-medium",
                  state === "active" && "bg-teal-600 text-white animate-pulse",
                  state === "done" && "bg-teal-100 text-teal-800",
                  state === "pending" && "bg-stone-100 text-stone-400",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                {state === "done" ? "✓" : i + 1}
              </span>
              <span
                className={[
                  "text-sm font-medium",
                  state === "active" && "text-stone-900",
                  state === "done" && "text-stone-700",
                  state === "pending" && "text-stone-400",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                {LABELS[s]}
                {state === "active" && "…"}
              </span>
              {i < ORDER.length - 1 && (
                <span
                  aria-hidden
                  className={[
                    "ml-2 hidden h-px flex-1 sm:block",
                    i < activeIndex ? "bg-teal-300" : "bg-stone-200",
                  ].join(" ")}
                />
              )}
            </li>
          );
        })}
      </ol>
      <p className="mt-6 text-center text-sm text-stone-500">
        This usually takes 10–40 seconds. Hang tight.
      </p>
    </div>
  );
}
