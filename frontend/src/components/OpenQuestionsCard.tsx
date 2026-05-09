interface Props {
  questions: string[];
}

export function OpenQuestionsCard({ questions }: Props) {
  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-6 sm:p-8">
      <h2 className="mb-4 text-lg font-semibold text-stone-900">Open Questions</h2>
      {questions.length === 0 ? (
        <p className="text-sm text-stone-500">None.</p>
      ) : (
        <ul className="space-y-2">
          {questions.map((q, i) => (
            <li key={i} className="flex gap-3 text-stone-700">
              <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-stone-400" />
              <span>{q}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
