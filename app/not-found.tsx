import Link from "next/link";
import { notFound } from "@/lib/content";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 px-6 text-center">
      <svg
        viewBox="0 0 60 100"
        className="h-32 w-auto opacity-60"
        aria-hidden="true"
      >
        <path
          d="M22 4 h16 v14 c0 4 12 10 12 24 v46 a8 8 0 0 1 -8 8 H18 a8 8 0 0 1 -8 -8 V42 c0 -14 12 -20 12 -24 Z"
          fill="none"
          stroke="var(--lavender)"
          strokeWidth="2.5"
          strokeDasharray="6 5"
        />
      </svg>
      <h1 className="text-4xl font-black md:text-6xl">{notFound.heading}</h1>
      <Link
        href="/"
        className="glass px-8 py-4 text-lg font-bold text-lavender transition-colors hover:text-text"
      >
        {notFound.button}
      </Link>
    </main>
  );
}
