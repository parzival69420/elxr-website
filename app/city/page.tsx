"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { cityJourney, type CityCommand, type CityAction } from "@/lib/city";
const CityCanvas = dynamic(() => import("@/components/city/CityCanvas"), {
  ssr: false,
});

/** Isolated camera tuning. ?p=0 shows the map; ?p=1 shows the skyline. */
export default function CityPreview() {
  const [ready, setReady] = useState(false);
  const [exploring, setExploring] = useState(false);
  const [command, setCommand] = useState<CityCommand>({id:0,action:"reset"});
  const [mobile, setMobile] = useState(false);
  const [reduced, setReduced] = useState(false);
  const onExplore = useCallback(()=>setExploring(true),[]);
  const issue = (action:CityAction) => {setExploring(action!=="reset");setCommand(previous=>({id:previous.id+1,action}));};
  useEffect(() => {
    const value = Number(
      new URLSearchParams(window.location.search).get("p") ?? 1,
    );
    cityJourney.reveal = 1;
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
      {ready && <CityCanvas mobile={mobile} reduced={reduced} interactive exploring={exploring} onExplore={onExplore} command={command} />}
      <div className="city-preview-title"><a href="/">ELXR <span>↗</span></a><p>NEW YORK, AFTER HOURS</p></div>
      <div className="city-interaction-tools">
        <p className="city-drag-hint">Drag to orbit.</p>
        <div className="city-tool-row">
          <div className="city-camera-buttons">
            <button aria-label="Rotate city left" onClick={()=>issue("left")}>←</button><button aria-label="Rotate city right" onClick={()=>issue("right")}>→</button>
            <button aria-label="Zoom in" onClick={()=>issue("zoom-in")}>+</button><button aria-label="Zoom out" onClick={()=>issue("zoom-out")}>−</button>
            <button className="city-reset" onClick={()=>issue("reset")}>Reset view</button>
          </div>
        </div>
      </div>
    </main>
  );
}
