import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[50vh] w-full max-w-6xl flex-col items-start justify-center px-5 pb-16 pt-28 sm:px-8 sm:pt-32">
      <h1 className="font-display text-4xl tracking-tight">Sidan hittades inte</h1>
      <p className="mt-3 text-muted">Den sidan eller produkten finns inte.</p>
      <Link
        href="/products"
        className="mt-6 text-sm font-medium text-accent underline-offset-4 hover:underline"
      >
        Tillbaka till shoppen
      </Link>
    </div>
  );
}
