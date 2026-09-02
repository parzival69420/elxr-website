"use client";

/**
 * Dev/tuning page: the isometric city alone at full viewport (Phase 3
 * approval view). Optional query params:
 *   ?p=0..1   preview a pour/spread progress state
 *   ?pour=1   include the fullscreen pour shader quad
 * Not linked from the site; safe to delete before launch.
 */
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { pourProgress } from "@/lib/pour";

const CityCanvas = dynamic(() => import("@/components/city/CityCanvas"), {
  ssr: false,
});

export default function CityPreview() {
  const [ready, setReady] = useState(false);
  const [withPour, setWithPour] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const p = parseFloat(params.get("p") ?? "1");
    pourProgress.value = Number.isFinite(p) ? p : 1;
    setWithPour(params.get("pour") === "1");
    setReady(true);
  }, []);

  return (
    <main className="relative h-screen w-screen">
      {ready && <CityCanvas mobile={false} withPour={withPour} />}
    </main>
  );
}
