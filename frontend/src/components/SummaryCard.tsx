import type { Language } from "../lib/types";

interface Props {
  title: string;
  language: Language;
  summary: string;
}

const LANGUAGE_LABELS: Record<Language, string> = {
  he: "Hebrew",
  en: "English",
  mixed: "Mixed",
};

export function SummaryCard({ title, language, summary }: Props) {
  const paragraphs = summary.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);

  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-6 sm:p-8">
      <div className="mb-4 flex items-start justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight text-stone-900">{title}</h1>
        <span className="shrink-0 rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-xs font-medium text-stone-600">
          {LANGUAGE_LABELS[language]}
        </span>
      </div>
      <div className="space-y-3 text-stone-700 leading-relaxed">
        {paragraphs.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
    </section>
  );
}
