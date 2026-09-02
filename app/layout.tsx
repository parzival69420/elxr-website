import type { Metadata, Viewport } from "next";
import { meta } from "@/lib/content";
import "./globals.css";

export const metadata: Metadata = {
  title: meta.title,
  description: meta.description,
  openGraph: {
    title: meta.title,
    description: meta.ogDescription,
    type: "website",
    siteName: "ELXR Creative",
  },
  twitter: {
    card: "summary_large_image",
    title: meta.title,
    description: meta.ogDescription,
  },
};

export const viewport: Viewport = {
  themeColor: "#0B0710",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
