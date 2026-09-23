"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { cityJourney } from "@/lib/city";
const CityCanvas = dynamic(() => import("@/components/city/CityCanvas"), {
  ssr: false,
});

/** Isolated camera tuning. ?p=0 shows the map; ?p=1 shows the skyline; ?r=0…1 freezes the blueprint reveal. */
export default function CityPreview() {
  const [ready, setReady] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const value = Number(params.get("p") ?? 1);
    const reveal = Number(params.get("r") ?? 1);
    cityJourney.reveal = Number.isFinite(reveal) ? Math.max(0, Math.min(1, reveal)) : 1;
    cityJourney.progress = Number.isFinite(value)
      ? Math.max(0, Math.min(1, value))
      : 1;
    setReady(true);
    const small=window.matchMedia("(max-width: 767px)"),motion=window.matchMedia("(prefers-reduced-motion: reduce)");
    const update=()=>{setMobile(small.matches);setReduced(motion.matches);};update();
    small.addEventListener("change",update);motion.addEventListener("change",update);
    return ()=>{small.removeEventListener("change",update);motion.removeEventListener("change",update);};
  }, []);
  return (
    <main className="city-preview relative h-screen w-screen">
      {ready && <CityCanvas mobile={mobile} reduced={reduced} />}
      <div className="city-preview-title"><a href="/">ELXR <span>↗</span></a><p>NEW YORK, AFTER HOURS</p></div>
    </main>
  );
}
