import { strips } from "@/lib/content";

/** One run of the sectors. Repeated so the loop never shows a seam; only the first run is read out. */
function Run({ hidden, variant }: { hidden?: boolean; variant: "solid" | "outline" }) {
  return (
    <ul className="sector-run" aria-hidden={hidden || undefined}>
      {strips.categories.map((c, i) => (
        <li key={c}>
          {variant === "solid" && (
            <span className="sector-serial" aria-hidden="true">
              S-{String(i + 1).padStart(2, "0")}
            </span>
          )}
          <span className="sector-name">{c}</span>
          <span className="sector-sep" aria-hidden="true">
            {variant === "solid" ? "//" : "+"}
          </span>
        </li>
      ))}
    </ul>
  );
}

/**
 * The sectors as two crossing banners: an amber hazard band and an outlined band
 * running the other way. Both loop without end; reduced motion holds them still.
 */
export default function SectorBanner() {
  return (
    <div className="sector-banner" role="region" aria-label="Sectors served">
      <div className="sector-band is-solid">
        <div className="sector-track">
          <Run variant="solid" />
          <Run variant="solid" hidden />
          <Run variant="solid" hidden />
        </div>
      </div>
      <div className="sector-band is-outline" aria-hidden="true">
        <div className="sector-track is-reverse">
          <Run variant="outline" hidden />
          <Run variant="outline" hidden />
          <Run variant="outline" hidden />
        </div>
      </div>
    </div>
  );
}
