import { useEffect, useRef } from "react";
import GenderAvatar from "./GenderAvatar";
import type { MatchProfile } from "../types";

interface Props {
  stream: MediaStream | null;
  mirror?: boolean;
  muted?: boolean;
  name?: string;
  isMicOff?: boolean;
  loading?: boolean;
  className?: string;
  avatarGender?: MatchProfile["gender"] | "unknown";
  /** If true, show the "searching" spinner overlay */
  searching?: boolean;
}

export default function VideoCard({
  stream,
  mirror = false,
  muted = false,
  name,
  isMicOff = false,
  loading = false,
  searching = false,
  className = "",
  avatarGender = "unknown",
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.srcObject = stream;
    video.muted = muted;

    if (!stream) return;

    const playVideo = () => {
      video.play().catch(() => {});
    };

    if (video.readyState >= HTMLMediaElement.HAVE_METADATA) {
      playVideo();
    } else {
      video.onloadedmetadata = playVideo;
    }

    return () => {
      video.onloadedmetadata = null;
    };
  }, [stream, muted]);

  return (
    <div className={`relative overflow-hidden bg-[#242424] ${className}`}>
      {/* Video */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={muted}
        className={`h-full w-full object-cover transition-opacity duration-300 ${
          stream ? "opacity-100" : "opacity-0"
        } ${mirror ? "mirror" : ""}`}
      />

      {/* No-stream placeholder */}
      {!stream && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#242424]">
          {loading || searching ? (
            <>
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-white/70" />
              <span className="px-2 text-center text-xs font-semibold leading-tight text-white/50 sm:text-sm">
                {searching ? "Recherche d'un partenaire…" : "Connexion…"}
              </span>
            </>
          ) : (
            /* Avatar placeholder (camera off) */
            <GenderAvatar gender={avatarGender} className="h-24 w-24" />
          )}
        </div>
      )}

      {/* Name badge (Zoom-style: bottom-left) */}
      {name && (
        <div className="name-badge">
          {isMicOff && (
            <svg className="h-3 w-3 text-red-400 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              <line x1="3" y1="3" x2="21" y2="21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          )}
          <span>{name}</span>
        </div>
      )}
    </div>
  );
}
