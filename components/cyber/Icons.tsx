/** Thin line icons for spec rows. 20px, currentColor, decorative. */
const base = {
  width: 20,
  height: 20,
  viewBox: "0 0 20 20",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.3,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export const IconCube = () => (
  <svg {...base}>
    <path d="M10 2 17 6v8l-7 4-7-4V6z" />
    <path d="M3 6l7 4 7-4M10 10v8" />
  </svg>
);
export const IconLayers = () => (
  <svg {...base}>
    <path d="M10 3 18 7l-8 4-8-4z" />
    <path d="m2 11 8 4 8-4" />
  </svg>
);
export const IconCode = () => (
  <svg {...base}>
    <rect x="2.5" y="3.5" width="15" height="13" rx="1.5" />
    <path d="m8 8-2 2 2 2M12 8l2 2-2 2" />
  </svg>
);
export const IconInfo = () => (
  <svg {...base}>
    <circle cx="10" cy="10" r="7.5" />
    <path d="M10 9v5M10 6.2v.1" />
  </svg>
);
export const IconPin = () => (
  <svg {...base}>
    <path d="M10 18s6-5.2 6-10a6 6 0 1 0-12 0c0 4.8 6 10 6 10z" />
    <circle cx="10" cy="8" r="2" />
  </svg>
);
export const IconUser = () => (
  <svg {...base}>
    <circle cx="10" cy="6.5" r="3.5" />
    <path d="M3 18c.8-3.6 3.6-5.5 7-5.5s6.2 1.9 7 5.5" />
  </svg>
);
export const IconClock = () => (
  <svg {...base}>
    <circle cx="10" cy="10" r="7.5" />
    <path d="M10 5.5V10l3 2" />
  </svg>
);
export const IconSpark = () => (
  <svg {...base}>
    <path d="M10 2v4M10 14v4M2 10h4M14 10h4M4.3 4.3l2.8 2.8M12.9 12.9l2.8 2.8M4.3 15.7l2.8-2.8M12.9 7.1l2.8-2.8" />
  </svg>
);
export const IconMail = () => (
  <svg {...base}>
    <rect x="2.5" y="4.5" width="15" height="11" rx="1.5" />
    <path d="m3 5.5 7 5.5 7-5.5" />
  </svg>
);
export const IconCalendar = () => (
  <svg {...base}>
    <rect x="2.5" y="4" width="15" height="13" rx="1.5" />
    <path d="M2.5 8h15M6.5 2.5v3M13.5 2.5v3" />
  </svg>
);
export const IconArrow = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
    <path d="M3 11 11 3M5 3h6v6" />
  </svg>
);
