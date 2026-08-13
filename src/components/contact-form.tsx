"use client";

import { useActionState } from "react";
import {
  submitContactAction,
  type ContactFormState,
} from "@/app/actions/contact";
import { useDictionary } from "@/components/dictionary-provider";

const initialState: ContactFormState = { ok: false };

export function ContactForm() {
  const { dict, locale } = useDictionary();
  const copy = dict.contact;
  const [state, formAction, pending] = useActionState(
    submitContactAction,
    initialState,
  );

  if (state.ok) {
    return (
      <p className="rounded-sm border border-border/70 bg-[color-mix(in_oklab,var(--mist)_40%,white)] px-4 py-5 text-base font-light text-foreground">
        {copy.success}
      </p>
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      <input
        type="text"
        name="company_website"
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
        aria-hidden
      />
      <input type="hidden" name="locale" value={locale} />

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block space-y-2 text-sm">
          <span className="text-[0.68rem] font-medium tracking-[0.14em] uppercase text-muted">
            {copy.name}
          </span>
          <input
            name="name"
            required
            className="w-full border border-border/80 bg-transparent px-3 py-2.5 text-base text-foreground outline-none focus:border-accent"
          />
        </label>
        <label className="block space-y-2 text-sm">
          <span className="text-[0.68rem] font-medium tracking-[0.14em] uppercase text-muted">
            {copy.email}
          </span>
          <input
            type="email"
            name="email"
            required
            className="w-full border border-border/80 bg-transparent px-3 py-2.5 text-base text-foreground outline-none focus:border-accent"
          />
        </label>
      </div>

      <label className="block space-y-2 text-sm">
        <span className="text-[0.68rem] font-medium tracking-[0.14em] uppercase text-muted">
          {copy.subject}
        </span>
        <input
          name="subject"
          required
          className="w-full border border-border/80 bg-transparent px-3 py-2.5 text-base text-foreground outline-none focus:border-accent"
        />
      </label>

      <label className="block space-y-2 text-sm">
        <span className="text-[0.68rem] font-medium tracking-[0.14em] uppercase text-muted">
          {copy.message}
        </span>
        <textarea
          name="message"
          required
          rows={6}
          minLength={10}
          className="w-full resize-y border border-border/80 bg-transparent px-3 py-2.5 text-base text-foreground outline-none focus:border-accent"
        />
      </label>

      {state.error === "not_configured" ? (
        <p className="text-sm text-muted">{copy.notConfigured}</p>
      ) : state.error ? (
        <p className="text-sm text-red-700">{copy.error}</p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="btn-primary disabled:opacity-50"
      >
        {pending ? copy.sending : copy.submit}
      </button>
    </form>
  );
}
