import type { Decision } from "../lib/types";

interface Props {
  decisions: Decision[];
}

export function DecisionsCard({ decisions }: Props) {
  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-6 sm:p-8">
      <h2 className="mb-4 text-lg font-semibold text-stone-900">Decisions</h2>
      {decisions.length === 0 ? (
        <p className="text-sm text-stone-500">No decisions recorded.</p>
      ) : (
        <ol className="space-y-4">
          {decisions.map((d, i) => (
            <li key={i} className="flex gap-4">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-stone-100 text-sm font-semibold text-stone-700">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-stone-900">{d.decision}</p>
                {d.context && (
                  <p className="mt-1 text-sm text-stone-500">{d.context}</p>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
