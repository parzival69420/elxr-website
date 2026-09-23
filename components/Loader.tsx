"use client";

import { useEffect, useState } from "react";
import { CITY_READY_EVENT, cityJourney } from "@/lib/city";
import { loader } from "@/lib/content";

/** Loading is shown by the bare map itself; this only announces progress to assistive tech. */
export default function Loader() {
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    const finish = () => setLoaded(true);
    if (cityJourney.ready) finish();
    window.addEventListener(CITY_READY_EVENT, finish, { once: true });
    return () => window.removeEventListener(CITY_READY_EVENT, finish);
  }, []);
  return (
    <p className="sr-only" role="status" aria-live="polite">
      {loaded ? loader.served : loader.pouring}
    </p>
  );
}
