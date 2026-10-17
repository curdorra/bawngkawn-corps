type P = { className?: string };

export const ArrowUpRight = ({ className = "arrow" }: P) => (
  <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
    <path d="M4 12 12 4M5.5 4H12v6.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const ArrowLeft = ({ className = "arrow" }: P) => (
  <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
    <path d="M13 8H3M7 4 3 8l4 4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const Chevron = ({ dir = "right" }: { dir?: "left" | "right" }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden style={{ transform: dir === "left" ? "scaleX(-1)" : undefined }}>
    <path d="m9 5 7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const Download = ({ className = "arrow" }: P) => (
  <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
    <path d="M8 2v8.5M4.5 7 8 10.5 11.5 7M3 13.5h10" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const Share = ({ className = "arrow" }: P) => (
  <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
    <path d="M8 10V2M5 5l3-3 3 3M3 8v5.5h10V8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const Close = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
    <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
  </svg>
);

export const Menu = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
    <path d="M4 8h16M4 16h16" strokeLinecap="round" />
  </svg>
);

export const Play = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z" />
  </svg>
);

export const Quote = ({ className }: P) => (
  <svg className={className} viewBox="0 0 26 20" fill="currentColor" aria-hidden>
    <path d="M0 20V11C0 4.5 3 1 9 0l1 2.6C6.7 3.6 5.3 5.6 5.2 9H10v11H0Zm16 0V11c0-6.5 3-10 9-11l1 2.6c-3.3 1-4.7 3-4.8 6.4H26v11H16Z" />
  </svg>
);

export const Facebook = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M13.5 21v-7.5h2.6l.4-3h-3V8.6c0-.9.3-1.5 1.5-1.5h1.6V4.4c-.3 0-1.2-.1-2.3-.1-2.3 0-3.8 1.4-3.8 3.9v2.3H8v3h2.5V21h3Z" />
  </svg>
);

export const YouTube = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4A2.5 2.5 0 0 0 2.4 7.2C2 8.8 2 12 2 12s0 3.2.4 4.8a2.5 2.5 0 0 0 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8c.4-1.6.4-4.8.4-4.8s0-3.2-.4-4.8ZM10 15V9l5.2 3L10 15Z" />
  </svg>
);

export const Instagram = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
    <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
  </svg>
);

export const Pin = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
    <path d="M8 14.5s4.5-4.2 4.5-8a4.5 4.5 0 0 0-9 0c0 3.8 4.5 8 4.5 8Z" strokeLinejoin="round" />
    <circle cx="8" cy="6.5" r="1.6" />
  </svg>
);

const line = { fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round", strokeLinejoin: "round" } as const;

export const Camera = () => (
  <svg viewBox="0 0 24 24" {...line} aria-hidden>
    <path d="M4 8.5h3l1.5-2h7l1.5 2h3v10H4v-10Z" />
    <circle cx="12" cy="13" r="3.2" />
  </svg>
);

export const Book = () => (
  <svg viewBox="0 0 24 24" {...line} aria-hidden>
    <path d="M12 6.5C10.5 5.3 8 4.8 4.5 5v13c3.5-.2 6 .3 7.5 1.5m0-13c1.5-1.2 4-1.7 7.5-1.5v13c-3.5-.2-6 .3-7.5 1.5m0-13v13" />
  </svg>
);

export const Heart = () => (
  <svg viewBox="0 0 24 24" {...line} aria-hidden>
    <path d="M12 19.5S4.5 15 4.5 9.7A3.9 3.9 0 0 1 12 8a3.9 3.9 0 0 1 7.5 1.7C19.5 15 12 19.5 12 19.5Z" />
  </svg>
);

export const Chat = () => (
  <svg viewBox="0 0 24 24" {...line} aria-hidden>
    <path d="M5 5.5h14v10H10l-4 3.5v-3.5H5v-10Z" />
  </svg>
);

export const Search = () => (
  <svg viewBox="0 0 24 24" {...line} aria-hidden>
    <circle cx="11" cy="11" r="6" />
    <path d="m20 20-4.2-4.2" />
  </svg>
);

export const PlayFill = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z" />
  </svg>
);

export const Star = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="m12 3 2.7 5.8 6.3.7-4.7 4.3 1.3 6.2L12 16.8 6.4 20l1.3-6.2L3 9.5l6.3-.7L12 3Z" />
  </svg>
);

export const WhatsApp = ({ className = "arrow" }: P) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M4 20l1.2-4.1A8 8 0 1 1 8.2 18.8L4 20Z" />
    <path d="M9.5 8.5c.3 2.4 2.6 4.8 5 5l1-1.200-1.800-1-.8.800c-.8-.4-1.600-1.200-2-2l.8-.8-1-1.800-1.200 1Z" />
  </svg>
);

export const Copy = ({ className = "arrow" }: P) => (
  <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
    <rect x="5.5" y="5.5" width="8" height="8" rx="1.5" />
    <path d="M10.5 3.5v-.5A1 1 0 0 0 9.5 2h-6.5A1 1 0 0 0 2 3v6.5a1 1 0 0 0 1 1h.5" strokeLinecap="round" />
  </svg>
);
