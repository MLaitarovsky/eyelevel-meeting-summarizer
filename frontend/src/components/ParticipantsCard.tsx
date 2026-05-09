import type { Confidence, Participant } from "../lib/types";

interface Props {
  participants: Participant[];
}

const BADGE_CLASSES: Record<Confidence, string> = {
  high: "bg-teal-50 text-teal-800 border-teal-200",
  medium: "bg-amber-50 text-amber-800 border-amber-200",
  low: "bg-stone-100 text-stone-600 border-stone-200",
};

export function ParticipantsCard({ participants }: Props) {
  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-6 sm:p-8">
      <h2 className="mb-4 text-lg font-semibold text-stone-900">Participants</h2>
      {participants.length === 0 ? (
        <p className="text-sm text-stone-500">No participants identified.</p>
      ) : (
        <ul className="divide-y divide-stone-100">
          {participants.map((p, i) => (
            <li key={`${p.name}-${i}`} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
              <div className="min-w-0">
                <p className="truncate font-medium text-stone-900">{p.name}</p>
                {p.role && <p className="truncate text-sm text-stone-500">{p.role}</p>}
              </div>
              <span
                className={[
                  "shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize",
                  BADGE_CLASSES[p.confidence],
                ].join(" ")}
              >
                {p.confidence}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
