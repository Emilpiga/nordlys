type FaqItem = {
  question: string;
  answer: string;
};

type FaqListProps = {
  items: FaqItem[];
};

export function FaqList({ items }: FaqListProps) {
  return (
    <div className="divide-y divide-border/70 border-y border-border/70">
      {items.map((item) => (
        <details key={item.question} className="group py-5">
          <summary className="flex cursor-pointer list-none items-baseline justify-between gap-4 marker:content-none [&::-webkit-details-marker]:hidden">
            <span className="font-display text-xl font-medium tracking-tight text-foreground sm:text-2xl">
              {item.question}
            </span>
            <span
              aria-hidden
              className="mt-1 shrink-0 text-lg font-light text-muted transition group-open:rotate-45"
            >
              +
            </span>
          </summary>
          <p className="mt-3 max-w-2xl text-base font-light leading-relaxed text-muted">
            {item.answer}
          </p>
        </details>
      ))}
    </div>
  );
}
