"use client";

import { useState } from "react";
import { contact } from "@/lib/content";

export default function Contact() {
  const [status, setStatus] = useState<
    "idle" | "sending" | "success" | "error"
  >("idle");

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("sending");
    try {
      // [NAV: point this at a real endpoint (Formspree / Resend / API route)
      //  when the domain and inbox exist. Until then the form falls back to
      //  a mailto: draft so no enquiry is silently dropped.]
      const data = new FormData(e.currentTarget);
      const body = encodeURIComponent(
        `Name: ${data.get("name")}\nBrand: ${data.get("brand")}\nEmail: ${data.get("email")}\n\nWhat's not growing:\n${data.get("problem")}`,
      );
      window.location.href = `mailto:${contact.email}?subject=${encodeURIComponent("New enquiry — ELXR site")}&body=${body}`;
      setStatus("success");
    } catch {
      setStatus("error");
    }
  };

  return (
    <section id="contact" className="contact-section theme-split relative z-10">
      <span id="book" aria-hidden="true" />
      <span className="ghost-word" aria-hidden="true">
        Thirsty
      </span>
      <span className="theme-ring contact-ring" aria-hidden="true" />
      <div className="contact-layout theme-wrap">
        <div className="contact-intro">
          <h2 className="contact-heading theme-display">{contact.heading}</h2>
          <p className="mt-5 max-w-xl text-lg text-text/75">{contact.body}</p>

          <div className="mt-8 flex flex-wrap items-center gap-5">
            <a href={contact.primaryCta.href} className="btn-primary">
              {contact.primaryCta.label}
            </a>
            <a
              href={`mailto:${contact.email}`}
              className="font-medium text-text underline underline-offset-4 decoration-white/30 hover:underline"
            >
              {contact.email}
            </a>
          </div>

          <p className="mt-10 text-sm text-text/65">{contact.line}</p>
        </div>
        <form
          onSubmit={onSubmit}
          className="contact-form theme-tile grid gap-6 md:grid-cols-2"
        >
          <label className="flex flex-col gap-2 text-sm font-medium">
            {contact.form.fields.name}
            <input
              name="name"
              required
              autoComplete="name"
              className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-base text-text placeholder:text-text/30"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium">
            {contact.form.fields.brand}
            <input
              name="brand"
              className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-base text-text"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium md:col-span-2">
            {contact.form.fields.problem}
            <textarea
              name="problem"
              rows={4}
              required
              className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-base text-text"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium md:col-span-2">
            {contact.form.fields.email}
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-base text-text"
            />
          </label>
          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={status === "sending"}
              className="btn-primary disabled:opacity-50"
            >
              {contact.form.submit}
            </button>
            <p
              role="status"
              aria-live="polite"
              className="mt-4 text-sm font-medium"
            >
              {status === "success" && (
                <span className="text-text">{contact.form.success}</span>
              )}
              {status === "error" && (
                <span className="text-butter">{contact.form.error}</span>
              )}
            </p>
          </div>
        </form>
      </div>
    </section>
  );
}
