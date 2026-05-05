import { useState } from "react";
import type { MediaPreferences } from "../types";

interface Props {
  onStart: (prefs: MediaPreferences) => void;
  mediaError: string | null;
  onlineCount: number;
}

// Fake preview cards (decorative, like Azar's right panel)
const PREVIEW_CARDS = [
  { name: "Sofia, 24",   flag: "🇫🇷", online: true,  tall: false },
  { name: "Marco, 27",   flag: "🇮🇹", online: true,  tall: true  },
  { name: "Yuna, 22",    flag: "🇰🇷", online: false, tall: false },
  { name: "Alex, 25",    flag: "🇺🇸", online: true,  tall: true  },
  { name: "Léa, 23",     flag: "🇧🇪", online: true,  tall: false },
  { name: "Carlos, 29",  flag: "🇧🇷", online: false, tall: true  },
  { name: "Emma, 21",    flag: "🇩🇪", online: true,  tall: false },
  { name: "Kai, 26",     flag: "🇯🇵", online: true,  tall: false },
];

// Gradient colors for placeholder avatars
const GRADIENTS = [
  "linear-gradient(135deg,#1e3a5f,#2d6ade)",
  "linear-gradient(135deg,#3b1f5e,#7c3aed)",
  "linear-gradient(135deg,#1f3b2e,#16a34a)",
  "linear-gradient(135deg,#3b2a1f,#d97706)",
  "linear-gradient(135deg,#3b1f2a,#db2777)",
  "linear-gradient(135deg,#1f2b3b,#0891b2)",
  "linear-gradient(135deg,#2e1f3b,#9333ea)",
  "linear-gradient(135deg,#3b2e1f,#ea580c)",
];

export default function HomePage({ onStart, mediaError, onlineCount }: Props) {
  const [video, setVideo] = useState(true);
  const [audio, setAudio] = useState(true);

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#111" }}>

      {/* ── LEFT PANEL ─────────────────────────────────────────────────────── */}
      <div
        className="flex w-full flex-col md:w-[420px] lg:w-[480px] flex-shrink-0"
        style={{ background: "#161616", borderRight: "1px solid #1e1e1e" }}
      >
        {/* Top nav */}
        <div className="flex items-center gap-2.5 px-6 py-5" style={{ borderBottom: "1px solid #1e1e1e" }}>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: "#2d6ade" }}>
            <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.553-2.069A1 1 0 0121 9.382v5.236a1 1 0 01-1.447.894L15.75 13.5M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9A2.25 2.25 0 0013.5 5.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </div>
          <span className="text-lg font-bold text-white tracking-tight">RandomChat</span>
        </div>

        {/* Main content */}
        <div className="flex flex-1 flex-col justify-center px-8 py-8">
          {/* Counter */}
          <div className="mb-8 flex items-center gap-2 text-sm" style={{ color: "#4ade80" }}>
            <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
            <span className="font-medium">{onlineCount.toLocaleString()} en ligne maintenant !</span>
          </div>

          {/* Headline */}
          <h1 className="mb-2 text-4xl font-bold leading-tight text-white">
            Rencontrez des<br />inconnus en vidéo
          </h1>
          <p className="mb-8 text-sm leading-relaxed" style={{ color: "#666" }}>
            Connexions vidéo anonymes et aléatoires.<br />
            Aucun compte requis.
          </p>

          {/* Device toggles */}
          <div className="mb-6 space-y-2.5">
            <DeviceToggle
              label="Caméra"
              icon={
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.553-2.069A1 1 0 0121 9.382v5.236a1 1 0 01-1.447.894L15.75 13.5M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9A2.25 2.25 0 0013.5 5.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
                </svg>
              }
              enabled={video}
              onToggle={() => setVideo((v) => !v)}
            />
            <DeviceToggle
              label="Microphone"
              icon={
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 1a3 3 0 013 3v8a3 3 0 01-6 0V4a3 3 0 013-3zm6 9a6 6 0 01-12 0M12 19v4m-3 0h6" />
                </svg>
              }
              enabled={audio}
              onToggle={() => setAudio((a) => !a)}
            />
          </div>

          {/* Error */}
          {mediaError && (
            <div
              className="mb-4 rounded-xl px-4 py-3 text-xs leading-relaxed"
              style={{ background: "rgba(220,38,38,0.12)", border: "1px solid rgba(220,38,38,0.25)", color: "#fca5a5" }}
            >
              {mediaError}
            </div>
          )}

          {/* CTA button */}
          <button
            onClick={() => onStart({ video, audio })}
            className="group relative w-full overflow-hidden rounded-2xl py-4 text-base font-semibold text-white transition-all duration-200 hover:opacity-90 active:scale-[0.98]"
            style={{ background: "#2d6ade" }}
          >
            <span className="flex items-center justify-center gap-2">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.553-2.069A1 1 0 0121 9.382v5.236a1 1 0 01-1.447.894L15.75 13.5M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9A2.25 2.25 0 0013.5 5.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
              </svg>
              Démarrer le Video Chat
            </span>
          </button>

          <p className="mt-4 text-center text-[11px]" style={{ color: "#444" }}>
            En continuant, vous acceptez de respecter les autres.
          </p>
        </div>

        {/* Feature chips */}
        <div className="flex flex-wrap gap-2 px-8 pb-6">
          {["P2P chiffré", "Anonyme", "Aucun enregistrement", "Gratuit"].map((f) => (
            <span
              key={f}
              className="rounded-full px-3 py-1 text-[11px]"
              style={{ color: "#444", border: "1px solid #222", background: "#1a1a1a" }}
            >
              {f}
            </span>
          ))}
        </div>
      </div>

      {/* ── RIGHT PANEL — Preview grid (like Azar) ─────────────────────────── */}
      <div className="hidden md:flex flex-1 flex-col overflow-hidden">
        {/* Grid header */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid #1a1a1a" }}>
          <span className="text-sm font-medium" style={{ color: "#555" }}>Aperçu en ligne</span>
          <span className="flex items-center gap-1.5 text-xs" style={{ color: "#444" }}>
            <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
            {onlineCount} disponibles
          </span>
        </div>

        {/* Masonry-style card grid */}
        <div className="flex-1 overflow-y-auto p-4" style={{ scrollbarWidth: "none" }}>
          <div className="columns-2 lg:columns-3 gap-3 space-y-3">
            {PREVIEW_CARDS.map((card, i) => (
              <div
                key={card.name}
                className="break-inside-avoid rounded-2xl overflow-hidden relative cursor-pointer group"
                style={{
                  background: GRADIENTS[i % GRADIENTS.length],
                  height: card.tall ? 240 : 170,
                  border: "1px solid #222",
                }}
              >
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200" />

                {/* ONLINE badge */}
                {card.online && (
                  <div
                    className="absolute top-2.5 left-2.5 flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold text-white"
                    style={{ background: "rgba(34,197,94,0.9)" }}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-white" />
                    ONLINE
                  </div>
                )}

                {/* Avatar initials */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-4xl font-bold text-white/20 select-none">
                    {card.name[0]}
                  </span>
                </div>

                {/* Name badge */}
                <div className="absolute bottom-0 left-0 right-0 p-3" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.8), transparent)" }}>
                  <p className="text-sm font-semibold text-white">
                    {card.flag} {card.name}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Blur overlay at bottom hinting more content */}
          <div
            className="sticky bottom-0 left-0 right-0 h-16 pointer-events-none"
            style={{ background: "linear-gradient(to top, #111, transparent)", marginTop: -64 }}
          />
        </div>
      </div>

    </div>
  );
}

// ─── Device toggle row ────────────────────────────────────────────────────────
function DeviceToggle({
  label,
  icon,
  enabled,
  onToggle,
}: {
  label: string;
  icon: React.ReactNode;
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className="flex items-center justify-between rounded-xl px-4 py-3 cursor-pointer"
      style={{ background: "#1e1e1e", border: "1px solid #282828" }}
      onClick={onToggle}
    >
      <div className="flex items-center gap-3 text-sm" style={{ color: enabled ? "#ccc" : "#555" }}>
        <span style={{ color: enabled ? "#888" : "#444" }}>{icon}</span>
        {label}
      </div>
      {/* iOS-style toggle */}
      <div
        className="relative flex-shrink-0 rounded-full transition-colors duration-200"
        style={{
          width: 40, height: 22,
          background: enabled ? "#2d6ade" : "#2e2e2e",
          border: "1px solid " + (enabled ? "#2d6ade" : "#3a3a3a"),
        }}
      >
        <div
          className="absolute top-0.5 rounded-full bg-white shadow transition-all duration-200"
          style={{ width: 18, height: 18, left: enabled ? 20 : 2 }}
        />
      </div>
    </div>
  );
}
