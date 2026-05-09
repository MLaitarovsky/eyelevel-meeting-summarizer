import type { ActionItem, Priority } from "../lib/types";

interface Props {
  items: ActionItem[];
}

const PRIORITY_CLASSES: Record<Priority, string> = {
  high: "bg-red-50 text-red-700 border-red-200",
  medium: "bg-amber-50 text-amber-700 border-amber-200",
  low: "bg-stone-100 text-stone-600 border-stone-200",
};

export function ActionItemsCard({ items }: Props) {
  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-6 sm:p-8">
      <h2 className="mb-4 text-lg font-semibold text-stone-900">Action Items</h2>
      {items.length === 0 ? (
        <p className="text-sm text-stone-500">No action items identified.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((item, i) => (
            <li key={i} className="rounded-xl border border-stone-200 bg-stone-50 p-4">
              <p className="font-medium text-stone-900">{item.task}</p>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-500">
                <span>
                  <span className="text-stone-400">Owner:</span>{" "}
                  <span className="text-stone-700">{item.owner ?? "—"}</span>
                </span>
                <span>
                  <span className="text-stone-400">Deadline:</span>{" "}
                  <span className="text-stone-700">{item.deadline ?? "—"}</span>
                </span>
                {item.priority && (
                  <span
                    className={[
                      "rounded-full border px-2 py-0.5 text-[11px] font-medium capitalize",
                      PRIORITY_CLASSES[item.priority],
                    ].join(" ")}
                  >
                    {item.priority} priority
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
