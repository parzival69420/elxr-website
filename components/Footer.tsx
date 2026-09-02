import { global } from "@/lib/content";

export default function Footer() {
  const f = global.footer;
  return (
    <footer className="relative z-10 border-t border-white/5 py-14">
      <div className="mx-auto flex w-[min(72rem,calc(100%-3rem))] flex-col items-center gap-6 text-center">
        <p className="text-2xl font-black tracking-tight text-lavender">{f.tagline}</p>
        <a
          href={`mailto:${f.email}`}
          className="font-medium text-text/80 underline-offset-4 hover:text-lavender hover:underline"
        >
          {f.email}
        </a>
        <p className="text-sm text-text/55">{f.line}</p>
        <div className="flex gap-6 text-sm font-medium">
          <a href={f.instagram.href} className="text-text/70 hover:text-lavender">
            {f.instagram.label}
          </a>
          <a href={f.linkedin.href} className="text-text/70 hover:text-lavender">
            {f.linkedin.label}
          </a>
        </div>
        <p className="text-xs text-text/40">{f.legal}</p>
      </div>
    </footer>
  );
}
