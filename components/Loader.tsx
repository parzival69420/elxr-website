"use client";

import { useEffect, useState } from "react";
import { CITY_READY_EVENT, cityJourney } from "@/lib/city";

/** Scene readiness controls the loader; the Manhattan map remains visible below it. */
export default function Loader() {
  const [loaded, setLoaded] = useState(false);
  const [gone, setGone] = useState(false);
  useEffect(() => {
    let exit: ReturnType<typeof setTimeout>;
    const finish = () => {
      setLoaded(true);
      exit = setTimeout(() => setGone(true), 650);
    };
    if (cityJourney.ready) finish();
    window.addEventListener(CITY_READY_EVENT, finish, { once: true });
    return () => {
      window.removeEventListener(CITY_READY_EVENT, finish);
      clearTimeout(exit);
    };
  }, []);
  if (gone) return null;
  return (
    <div
      className={`city-loader ${loaded ? "is-loaded" : ""}`}
      role="status"
      aria-live="polite"
    >
      <span className="loader-pulse" />
      <span>{loaded ? "YOU'RE IN NEW YORK." : "MAPPING MANHATTAN"}</span>
      <span className="loader-status">
        {loaded ? "READY" : "LOADING THE CITY"}
      </span>
    </div>
  );
}
