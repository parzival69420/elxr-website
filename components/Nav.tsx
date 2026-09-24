"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
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
  // Neon tubes: a link lights up while hovered or focused, and the section in view stays lit.
  // One glow bar slides to whichever link is lit.
  const [hovered, setHovered] = useState<number | null>(null);
  const [active, setActive] = useState<string | null>(null);
  const reduced = useReducedMotion();
  useEffect(() => {
    const sections = global.navLinks
      .map((link) => document.getElementById(link.href.slice(1)))
      .filter((section): section is HTMLElement => !!section);
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries)
          if (entry.isIntersecting) setActive(`#${entry.target.id}`);
          else setActive((current) => (current === `#${entry.target.id}` ? null : current));
      },
      // A band across the middle of the viewport: the section crossing it is the one in view.
      { rootMargin: "-45% 0px -50% 0px" },
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);
  const activeIndex = global.navLinks.findIndex((link) => link.href === active);
  const lit = hovered ?? (activeIndex >= 0 ? activeIndex : null);
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
        <ul className="nav-links" onMouseLeave={() => setHovered(null)}>
          {global.navLinks.map((link, index) => (
            // Tubes alternate pink and cyan, like the rooftop strips.
            <li key={link.href} data-tube={index % 2 ? "cyan" : "pink"}>
              <a
                href={link.href}
                aria-current={active === link.href ? "location" : undefined}
                onMouseEnter={() => setHovered(index)}
                onFocus={() => setHovered(index)}
                onBlur={() => setHovered(null)}
              >
                {link.label}
              </a>
              {lit === index && (
                <motion.span
                  layoutId="nav-glow"
                  className="nav-glow"
                  aria-hidden="true"
                  transition={
                    reduced ? { duration: 0 } : { type: "spring", stiffness: 520, damping: 40 }
                  }
                />
              )}
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
