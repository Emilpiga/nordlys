"use server";

import { Resend } from "resend";
import { shopifyConfig } from "@/lib/shopify/config";

export type ContactFormState = {
  ok: boolean;
  error?: string;
  fieldErrors?: Partial<Record<"name" | "email" | "subject" | "message", string>>;
};

function clean(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

export async function submitContactAction(
  _prev: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  const honeypot = clean(formData.get("company_website"));
  if (honeypot) {
    return { ok: true };
  }

  const name = clean(formData.get("name"));
  const email = clean(formData.get("email"));
  const subject = clean(formData.get("subject"));
  const message = clean(formData.get("message"));
  const locale = clean(formData.get("locale")) || "sv";

  const fieldErrors: ContactFormState["fieldErrors"] = {};
  if (!name) fieldErrors.name = "required";
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    fieldErrors.email = "invalid";
  }
  if (!subject) fieldErrors.subject = "required";
  if (!message || message.length < 10) fieldErrors.message = "required";

  if (Object.keys(fieldErrors).length) {
    return { ok: false, fieldErrors, error: "validation" };
  }

  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM_EMAIL?.trim();
  const to = shopifyConfig.supportEmail;

  if (!apiKey || !from || !to) {
    return { ok: false, error: "not_configured" };
  }

  try {
    const resend = new Resend(apiKey);
    const brand = shopifyConfig.storeName;
    const result = await resend.emails.send({
      from,
      to,
      replyTo: email,
      subject: `[${brand}] ${subject}`,
      text: [
        `Name: ${name}`,
        `Email: ${email}`,
        `Locale: ${locale}`,
        "",
        message,
      ].join("\n"),
    });

    if (result.error) {
      console.error("Resend error:", result.error);
      return { ok: false, error: "send_failed" };
    }

    return { ok: true };
  } catch (error) {
    console.error("Contact form failed:", error);
    return { ok: false, error: "send_failed" };
  }
}
