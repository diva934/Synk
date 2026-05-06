import { useEffect, useState } from "react";
import GemShopModal from "./GemShopModal";
import type { Country, Gender, MatchProfile, MatchingPreferences, MediaPreferences } from "../types";

interface Props {
  onStart: (prefs: MediaPreferences) => void;
  mediaError: string | null;
  onlineCount: number;
  userEmail?: string;
  gemBalance: number;
  matchingPrefs: MatchingPreferences;
  canClaimDailyGems: boolean;
  dailyReward: number;
  onBuyGemPack: (gems: number) => void;
  onClaimDailyGems: () => void;
  onSignOut: () => void;
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

const COUNTRIES: Array<{ value: Country; label: string }> = [
  { value: "any", label: "Tous les pays" },
  { value: "FR", label: "France" },
  { value: "BE", label: "Belgique" },
  { value: "CH", label: "Suisse" },
  { value: "CA", label: "Canada" },
  { value: "US", label: "États-Unis" },
  { value: "GB", label: "Royaume-Uni" },
  { value: "DE", label: "Allemagne" },
  { value: "ES", label: "Espagne" },
  { value: "IT", label: "Italie" },
  { value: "MA", label: "Maroc" },
  { value: "DZ", label: "Algérie" },
  { value: "TN", label: "Tunisie" },
];

const PROFILE_COUNTRIES = COUNTRIES.filter(
  (country): country is { value: MatchProfile["country"]; label: string } => country.value !== "any"
);

const TARGET_GENDERS: Array<{ value: Gender; label: string }> = [
  { value: "any", label: "Tous" },
  { value: "female", label: "Femme" },
  { value: "male", label: "Homme" },
];

const PROFILE_GENDERS: Array<{ value: MatchProfile["gender"]; label: string }> = [
  { value: "female", label: "Femme" },
  { value: "male", label: "Homme" },
];

export default function HomePage({
  onStart,
  mediaError,
  onlineCount,
  userEmail,
  gemBalance,
  matchingPrefs,
  canClaimDailyGems,
  dailyReward,
  onBuyGemPack,
  onClaimDailyGems,
  onSignOut,
}: Props) {
  const [video, setVideo] = useState(true);
  const [audio, setAudio] = useState(true);
  const [showShop, setShowShop] = useState(false);
  const [matching, setMatching] = useState<MatchingPreferences>(matchingPrefs);

  useEffect(() => {
    setMatching(matchingPrefs);
  }, [matchingPrefs]);

  return (
    <div className="app-screen flex overflow-hidden" style={{ background: "#111" }}>

      {/* ── LEFT PANEL ─────────────────────────────────────────────────────── */}
      <div
        className="flex w-full flex-col md:w-[420px] lg:w-[480px] flex-shrink-0"
        style={{ background: "#161616", borderRight: "1px solid #1e1e1e" }}
      >
        {/* Top nav */}
        <div className="flex items-center gap-2.5 px-6 py-5" style={{ borderBottom: "1px solid #1e1e1e" }}>
          <div className="flex min-w-0 flex-1 items-center gap-2.5">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl" style={{ background: "#2d6ade" }}>
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.553-2.069A1 1 0 0121 9.382v5.236a1 1 0 01-1.447.894L15.75 13.5M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9A2.25 2.25 0 0013.5 5.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
              </svg>
            </div>
            <div className="min-w-0">
              <span className="block text-lg font-bold text-white tracking-tight">RandomChat</span>
              {userEmail && (
                <span className="block truncate text-[11px]" style={{ color: "#555" }}>
                  {userEmail}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowShop(true)}
              className="flex items-center gap-1.5 rounded-lg bg-white/5 px-3 py-2 text-xs font-bold text-white transition hover:bg-white/10"
              title="Boutique"
            >
              <span>💎</span>
              <span>{gemBalance.toLocaleString()}</span>
            </button>
            <button
              type="button"
              onClick={onSignOut}
              className="rounded-lg px-3 py-2 text-xs font-semibold text-white/45 transition hover:bg-white/5 hover:text-white"
            >
              Sortir
            </button>
          </div>
        </div>

        {/* Main content */}
        <div className="flex flex-1 flex-col justify-center px-6 py-5 md:px-8 md:py-8">
          {/* Counter */}
          <div className="mb-5 flex items-center gap-2 text-sm md:mb-8" style={{ color: "#4ade80" }}>
            <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
            <span className="font-medium">{onlineCount.toLocaleString()} en ligne maintenant !</span>
          </div>

          {/* Headline */}
          <h1 className="mb-2 text-4xl font-bold leading-tight text-white">
            Rencontrez des<br />inconnus en vidéo
          </h1>
          <p className="mb-5 text-sm leading-relaxed md:mb-8" style={{ color: "#666" }}>
            Connexions vidéo anonymes et aléatoires.
          </p>

          {/* Device toggles */}
          <div className="mb-4 space-y-2.5 md:mb-6">
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

          <div className="mb-4 rounded-2xl border border-white/5 bg-[#1e1e1e] p-3 md:mb-6">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-semibold text-white/80">Critères</span>
              <span className="text-[11px] text-white/35">matching</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <SelectField
                label="Je suis"
                value={matching.profile.gender}
                onChange={(value) =>
                  setMatching((current) => ({
                    ...current,
                    profile: { ...current.profile, gender: value as MatchProfile["gender"] },
                  }))
                }
                options={PROFILE_GENDERS}
              />
              <SelectField
                label="Mon pays"
                value={matching.profile.country}
                onChange={(value) =>
                  setMatching((current) => ({
                    ...current,
                    profile: { ...current.profile, country: value as MatchProfile["country"] },
                  }))
                }
                options={PROFILE_COUNTRIES}
              />
              <SelectField
                label="Voir"
                value={matching.filters.gender}
                onChange={(value) =>
                  setMatching((current) => ({
                    ...current,
                    filters: { ...current.filters, gender: value as Gender },
                  }))
                }
                options={TARGET_GENDERS}
              />
              <SelectField
                label="Pays ciblé"
                value={matching.filters.country}
                onChange={(value) =>
                  setMatching((current) => ({
                    ...current,
                    filters: { ...current.filters, country: value as Country },
                  }))
                }
                options={COUNTRIES}
              />
            </div>
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
            onClick={() => onStart({ video, audio, matching })}
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

      {showShop && (
        <GemShopModal
          balance={gemBalance}
          canClaimDaily={canClaimDailyGems}
          dailyReward={dailyReward}
          onBuy={(gems) => {
            onBuyGemPack(gems);
          }}
          onClaimDaily={onClaimDailyGems}
          onClose={() => setShowShop(false)}
        />
      )}

    </div>
  );
}

// ─── Device toggle row ────────────────────────────────────────────────────────
function SelectField<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: Array<{ value: T; label: string }>;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-medium text-white/35">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
        className="w-full rounded-xl border border-white/5 bg-[#161616] px-3 py-2 text-xs font-semibold text-white outline-none transition focus:border-[#2d6ade]"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

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
