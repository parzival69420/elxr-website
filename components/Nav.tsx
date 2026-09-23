"use client";

import { useEffect, useRef, useState } from "react";
import { global } from "@/lib/content";
import { getLenis } from "@/lib/smoothScroll";

export default function Nav() {
  const [open, setOpen] = useState(false);
  const [pastHero, setPastHero] = useState(false);
  useEffect(() => {
    const update = () => {
      const hero = document.getElementById("top");
      setPastHero(
        !!hero && hero.getBoundingClientRect().bottom < window.innerHeight,
      );
    };
    window.addEventListener("scroll", update, { passive: true });
    update();
    return () => window.removeEventListener("scroll", update);
  }, []);
  const button = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    getLenis()?.stop();
    const first = menu.current?.querySelector<HTMLAnchorElement>("a");
    first?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        button.current?.focus();
      }
      if (event.key !== "Tab") return;
      const links = menu.current?.querySelectorAll<HTMLAnchorElement>("a");
      if (!links?.length) return;
      if (event.shiftKey && document.activeElement === links[0]) {
        event.preventDefault();
        button.current?.focus();
      } else if (
        !event.shiftKey &&
        document.activeElement === links[links.length - 1]
      ) {
        event.preventDefault();
        button.current?.focus();
      } else if (event.shiftKey && document.activeElement === button.current) {
        event.preventDefault();
        links[links.length - 1].focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = oldOverflow;
      getLenis()?.start();
    };
  }, [open]);
  return (
    <header className={`site-header ${pastHero ? "is-past-hero" : ""}`}>
      <nav className="city-nav" aria-label="Main">
        <a
          href="#top"
          className="elxr-wordmark"
          aria-label="ELXR Creative home"
          onClick={() => setOpen(false)}
        >
          ELXR<span>CREATIVE</span>
        </a>
        <ul className="nav-links">
          {global.navLinks.map((link) => (
            <li key={link.href}>
              <a href={link.href}>{link.label}</a>
            </li>
          ))}
        </ul>
        <div className="nav-actions">
          <a
            href={global.navCta.href}
            className="nav-contact"
            onClick={() => setOpen(false)}
          >
            {global.navCta.label}
          </a>
          <button
            ref={button}
            className={`menu-toggle ${open ? "is-open" : ""}`}
            onClick={() => setOpen(!open)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="city-menu"
          >
            <span />
            <span />
          </button>
        </div>
      </nav>
      {open && (
        <div
          ref={menu}
          id="city-menu"
          className="city-menu"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation"
        >
          <p className="city-eyebrow">FIND YOUR FORMULA</p>
          {global.navLinks.map((link, index) => (
            <a key={link.href} href={link.href} onClick={() => setOpen(false)}>
              <small>0{index + 1}</small>
              {link.label}
              <span aria-hidden="true">↗</span>
            </a>
          ))}
          <p className="menu-footer">Brewed in New York. Served everywhere.</p>
        </div>
      )}
    </header>
  );
}
