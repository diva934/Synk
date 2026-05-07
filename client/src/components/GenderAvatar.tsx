import type { MatchProfile } from "../types";

export default function GenderAvatar({
  gender,
  className = "",
}: {
  gender?: MatchProfile["gender"] | "unknown";
  className?: string;
}) {
  const isFemale = gender === "female";
  const id = isFemale ? "femaleAvatarGlow" : "maleAvatarGlow";
  const outline = isFemale ? "#ff5ee8" : "#37c8ff";
  const glow = isFemale ? "rgba(255,62,214,0.75)" : "rgba(0,168,255,0.75)";

  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <defs>
        <radialGradient id={id} cx="35%" cy="15%" r="82%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="28%" stopColor={isFemale ? "#ff8bf0" : "#72dcff"} />
          <stop offset="65%" stopColor={isFemale ? "#c300b8" : "#0057ff"} />
          <stop offset="100%" stopColor={isFemale ? "#350038" : "#001448"} />
        </radialGradient>
        <filter id={`${id}Shadow`} x="-45%" y="-45%" width="190%" height="190%">
          <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor={glow} />
        </filter>
      </defs>
      <g filter={`url(#${id}Shadow)`}>
        {isFemale ? (
          <>
            <path
              d="M18 29c0-11 6-18 14-18s14 7 14 18c0 5 3 8 4 11-4 4-10 4-18 4s-14 0-18-4c1-3 4-6 4-11Z"
              fill={`url(#${id})`}
              stroke={outline}
              strokeWidth="1.8"
            />
            <path
              d="M12 58c3.3-10 10.4-15.5 20-15.5S48.7 48 52 58"
              fill={`url(#${id})`}
              stroke={outline}
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </>
        ) : (
          <>
            <circle cx="32" cy="22" r="11.5" fill={`url(#${id})`} stroke={outline} strokeWidth="1.8" />
            <path
              d="M10 58c3.7-11.5 11.2-17.5 22-17.5S50.3 46.5 54 58"
              fill={`url(#${id})`}
              stroke={outline}
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </>
        )}
      </g>
    </svg>
  );
}
