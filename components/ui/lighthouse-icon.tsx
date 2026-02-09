export function LighthouseIcon({ size = 32, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Light beam — left */}
      <path
        d="M24 16L6 8"
        stroke="#00B140"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.5"
      />
      <path
        d="M23 18L4 14"
        stroke="#00B140"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.35"
      />
      <path
        d="M22 20L5 20"
        stroke="#00B140"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.2"
      />

      {/* Light beam — right */}
      <path
        d="M40 16L58 8"
        stroke="#00B140"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.5"
      />
      <path
        d="M41 18L60 14"
        stroke="#00B140"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.35"
      />
      <path
        d="M42 20L59 20"
        stroke="#00B140"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.2"
      />

      {/* Lantern room dome */}
      <path
        d="M28 14 Q32 8 36 14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />

      {/* Lantern room / light housing */}
      <rect
        x="26"
        y="14"
        width="12"
        height="8"
        rx="1"
        stroke="currentColor"
        strokeWidth="2"
        fill="#00B140"
        fillOpacity="0.15"
      />

      {/* Light center glow */}
      <circle cx="32" cy="18" r="2.5" fill="#00B140" />

      {/* Gallery / walkway */}
      <path
        d="M24 22L40 22"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* Tower body — tapered */}
      <path
        d="M27 22L25 52L39 52L37 22"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
        fill="none"
      />

      {/* Horizontal stripes on tower */}
      <line x1="26.6" y1="30" x2="37.4" y2="30" stroke="#00B140" strokeWidth="2" opacity="0.4" />
      <line x1="26" y1="38" x2="38" y2="38" stroke="#00B140" strokeWidth="2" opacity="0.4" />
      <line x1="25.4" y1="46" x2="38.6" y2="46" stroke="#00B140" strokeWidth="2" opacity="0.4" />

      {/* Window */}
      <rect x="30" y="33" width="4" height="5" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" />

      {/* Base platform */}
      <path
        d="M21 52L43 52"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      {/* Ground / rocks */}
      <path
        d="M18 56Q24 53 32 55Q40 53 46 56"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
        opacity="0.3"
      />
    </svg>
  );
}
