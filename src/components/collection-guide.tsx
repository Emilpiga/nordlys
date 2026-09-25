import { AmbientSection, SectionRule } from "@/components/section";

type CollectionGuideProps = {
  title: string;
  paragraphs: string[];
};

/** Editorial copy under a collection grid — gives the page indexable text. */
export function CollectionGuide({ title, paragraphs }: CollectionGuideProps) {
  return (
    <>
      <SectionRule />
      <AmbientSection className="mx-auto w-full max-w-3xl px-5 py-16 sm:px-8 sm:py-20">
        <h2 className="font-display text-2xl font-medium tracking-tight sm:text-3xl">
          {title}
        </h2>
        <div className="mt-6 space-y-4">
          {paragraphs.map((paragraph) => (
            <p
              key={paragraph}
              className="text-base font-light leading-relaxed text-muted"
            >
              {paragraph}
            </p>
          ))}
        </div>
      </AmbientSection>
    </>
  );
}
