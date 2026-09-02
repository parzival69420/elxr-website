import { global } from "@/lib/content";

export default function Nav() {
  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <nav
        className="glass mx-auto mt-4 flex w-[min(64rem,calc(100%-2rem))] items-center justify-between px-5 py-3"
        aria-label="Main"
      >
        {/* [NAV: logo SVG replaces this wordmark when supplied] */}
        <a href="#top" className="text-lg font-black tracking-[0.2em]">
          ELXR
        </a>
        <ul className="hidden items-center gap-7 text-sm font-medium md:flex">
          {global.navLinks.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="text-text/80 transition-colors hover:text-lavender"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
        <a
          href={global.navCta.href}
          className="rounded-full bg-purple px-5 py-2 text-sm font-bold text-text transition-transform hover:scale-105"
        >
          {global.navCta.label}
        </a>
      </nav>
    </header>
  );
}
