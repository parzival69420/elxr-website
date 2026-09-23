"use client";

import { useState } from "react";
import { contact } from "@/lib/content";
import CyberSection, { CyberTitle, SpecList } from "./cyber/CyberSection";
import { GlassWire } from "./cyber/Wireframes";
import { IconArrow, IconCalendar, IconMail, IconPin } from "./cyber/Icons";

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

  const field = (name: string, label: string, props: Record<string, unknown> = {}) => (
    <label className="cyber-field">
      <span>{label}</span>
      <input name={name} {...props} />
    </label>
  );

  return (
    <CyberSection
      id="contact"
      label={contact.eyebrow}
      wireframe={<GlassWire />}
      className="cyber-contact"
      labelledBy="contact-title"
    >
      <span id="book" aria-hidden="true" />
      <div className="cyber-contact-grid">
        <div>
          <CyberTitle id="contact-title" size="lg">
            {contact.heading}
          </CyberTitle>
          <p className="cyber-lead">{contact.body}</p>
          <SpecList
            items={[
              {
                icon: <IconMail />,
                label: "Email",
                value: <a href={`mailto:${contact.email}`}>{contact.email}</a>,
              },
              {
                icon: <IconCalendar />,
                label: "Call",
                value: <a href={contact.primaryCta.href}>{contact.primaryCta.label}</a>,
              },
              { icon: <IconPin />, label: "Based", value: contact.line },
            ]}
          />
        </div>
        <form onSubmit={onSubmit} className="cyber-form">
          <div className="cyber-form-row">
            {field("name", contact.form.fields.name, { required: true, autoComplete: "name" })}
            {field("brand", contact.form.fields.brand)}
          </div>
          <label className="cyber-field">
            <span>{contact.form.fields.problem}</span>
            <textarea name="problem" rows={4} required />
          </label>
          {field("email", contact.form.fields.email, { type: "email", required: true, autoComplete: "email" })}
          <div className="cyber-actions">
            <button type="submit" disabled={status === "sending"} className="cyber-btn">
              {contact.form.submit} <IconArrow />
            </button>
            <a href={`mailto:${contact.email}`} className="cyber-link">
              Or email us
            </a>
          </div>
          <p role="status" aria-live="polite" className="cyber-status">
            {status === "success" && <span className="is-ok">{contact.form.success}</span>}
            {status === "error" && <span className="is-error">{contact.form.error}</span>}
          </p>
        </form>
      </div>
    </CyberSection>
  );
}
