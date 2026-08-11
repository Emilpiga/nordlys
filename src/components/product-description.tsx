type ProductDescriptionProps = {
  html: string;
  title?: string;
};

export function ProductDescription({
  html,
  title = "Details",
}: ProductDescriptionProps) {
  if (!html) return null;

  return (
    <section className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
      <div className="mx-auto max-w-2xl">
        <p className="text-[0.68rem] font-medium tracking-[0.2em] uppercase text-blush">
          The formula
        </p>
        <h2 className="mt-3 font-display text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
          {title}
        </h2>
        <div
          className="product-description mt-8 text-base font-light leading-[1.8] text-muted"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </section>
  );
}
