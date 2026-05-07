import { useEffect, useState } from "react";
import GemShopModal from "./GemShopModal";
import LogoMark from "./LogoMark";
import type { Country, Gender, MatchingPreferences, MediaPreferences } from "../types";

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

const PREVIEW_CARDS = [
  { name: "Sofia, 24", flag: "FR", online: true, tall: false },
  { name: "Marco, 27", flag: "IT", online: true, tall: true },
  { name: "Yuna, 22", flag: "KR", online: false, tall: false },
  { name: "Alex, 25", flag: "US", online: true, tall: true },
  { name: "Lea, 23", flag: "BE", online: true, tall: false },
  { name: "Carlos, 29", flag: "BR", online: false, tall: true },
];

const GRADIENTS = [
  "linear-gradient(135deg,#1e3a5f,#2d6ade)",
  "linear-gradient(135deg,#3b1f5e,#7c3aed)",
  "linear-gradient(135deg,#1f3b2e,#16a34a)",
  "linear-gradient(135deg,#3b2a1f,#d97706)",
  "linear-gradient(135deg,#3b1f2a,#db2777)",
  "linear-gradient(135deg,#1f2b3b,#0891b2)",
];

const COUNTRIES: Array<{ value: Country; label: string }> = [
  { value: "any", label: "Tous les pays" },
  { value: "FR", label: "France" },
  { value: "BE", label: "Belgique" },
  { value: "CH", label: "Suisse" },
  { value: "CA", label: "Canada" },
  { value: "US", label: "Etats-Unis" },
  { value: "GB", label: "Royaume-Uni" },
  { value: "DE", label: "Allemagne" },
  { value: "ES", label: "Espagne" },
  { value: "IT", label: "Italie" },
  { value: "MA", label: "Maroc" },
  { value: "DZ", label: "Algerie" },
  { value: "TN", label: "Tunisie" },
];

const TARGET_GENDERS: Array<{ value: Gender; label: string }> = [
  { value: "any", label: "Tous" },
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
  const [showShop, setShowShop] = useState(false);
  const [matching, setMatching] = useState<MatchingPreferences>(matchingPrefs);

  useEffect(() => {
    setMatching(matchingPrefs);
  }, [matchingPrefs]);

  return (
    <div className="app-screen flex overflow-hidden bg-[#111]">
      <div className="flex w-full flex-shrink-0 flex-col bg-[#161616] md:w-[420px] lg:w-[480px] md:border-r md:border-[#1e1e1e]">
        <div className="flex items-center gap-2.5 px-6 py-5" style={{ borderBottom: "1px solid #1e1e1e" }}>
          <div className="flex min-w-0 flex-1 items-center gap-2.5">
            <LogoMark className="h-11 w-11 flex-shrink-0" />
            <div className="min-w-0">
              <span className="block text-lg font-bold tracking-tight text-white">RandomChat</span>
              {userEmail && <span className="block truncate text-[11px] text-white/30">{userEmail}</span>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowShop(true)}
              className="flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-2 text-xs font-bold text-white transition hover:bg-white/10"
              title="Boutique"
            >
              <span>💎</span>
              <span>{gemBalance.toLocaleString()}</span>
            </button>
            <button
              type="button"
              onClick={onSignOut}
              className="rounded-full px-3 py-2 text-xs font-semibold text-white/45 transition hover:bg-white/5 hover:text-white"
            >
              Sortir
            </button>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col px-6 py-5 md:px-8 md:py-8">
          <div className="flex flex-1 flex-col justify-center">
            <div className="mb-5 flex items-center gap-2 text-sm text-green-400 md:mb-8">
              <span className="h-2 w-2 animate-pulse rounded-full bg-green-400" />
              <span className="font-medium">{onlineCount.toLocaleString()} en ligne maintenant !</span>
            </div>

            <h1 className="mb-2 text-4xl font-bold leading-tight text-white">
              Rencontrez des<br />inconnus en video
            </h1>
            <p className="mb-5 text-sm leading-relaxed text-white/35 md:mb-8">
              Connexions video anonymes et aleatoires.
            </p>

            <DeviceToggle
              label="Camera"
              icon={
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.553-2.069A1 1 0 0 1 21 9.382v5.236a1 1 0 0 1-1.447.894L15.75 13.5M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9A2.25 2.25 0 0 0 13.5 5.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25z" />
                </svg>
              }
              enabled={video}
              onToggle={() => setVideo((v) => !v)}
            />
          </div>

          {mediaError && (
            <div className="mb-4 rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-xs leading-relaxed text-red-200">
              {mediaError}
            </div>
          )}

          <div className="flex-shrink-0 pb-2">
            <div className="mb-4 grid grid-cols-[1fr_auto_1fr] items-center rounded-full border border-white/5 bg-[#0b1b18]/90 px-5 py-4 shadow-2xl shadow-black/30 backdrop-blur-xl">
              <FilterPill
                icon="⚧"
                label="Genre"
                value={matching.filters.gender}
                onChange={(value) =>
                  setMatching((current) => ({
                    ...current,
                    filters: { ...current.filters, gender: value as Gender },
                  }))
                }
                options={TARGET_GENDERS}
              />
              <span className="mx-4 h-7 w-px bg-white/15" />
              <FilterPill
                icon="🌍"
                label="Pays"
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

            <button
              onClick={() => onStart({ video, audio: true, matching })}
              className="group relative w-full overflow-hidden rounded-full py-4 text-lg font-black text-black transition-all duration-200 hover:opacity-90 active:scale-[0.98]"
              style={{ background: "#00f29a" }}
            >
              <span className="flex items-center justify-center gap-2">
                <svg className="h-6 w-6 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M5 6.5A3.5 3.5 0 0 0 1.5 10v4A3.5 3.5 0 0 0 5 17.5h7A3.5 3.5 0 0 0 15.5 14v-.17l3.55 2.28A1.6 1.6 0 0 0 21.5 14.76V9.24a1.6 1.6 0 0 0-2.45-1.35l-3.55 2.28V10A3.5 3.5 0 0 0 12 6.5H5Z" />
                </svg>
                Lancer un chat video
              </span>
            </button>
          </div>
        </div>
      </div>

      <div className="hidden flex-1 flex-col overflow-hidden md:flex">
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid #1a1a1a" }}>
          <span className="text-sm font-medium text-white/30">Apercu en ligne</span>
          <span className="flex items-center gap-1.5 text-xs text-white/25">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-500" />
            {onlineCount} disponibles
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 scrollbar-hide">
          <div className="columns-2 gap-3 space-y-3 lg:columns-3">
            {PREVIEW_CARDS.map((card, i) => (
              <div
                key={card.name}
                className="break-inside-avoid overflow-hidden rounded-2xl relative cursor-pointer group"
                style={{
                  background: GRADIENTS[i % GRADIENTS.length],
                  height: card.tall ? 240 : 170,
                  border: "1px solid #222",
                }}
              >
                <div className="absolute inset-0 bg-black/0 transition-colors duration-200 group-hover:bg-black/20" />
                {card.online && (
                  <div className="absolute left-2.5 top-2.5 flex items-center gap-1 rounded-full bg-green-500 px-2 py-0.5 text-[10px] font-semibold text-white">
                    <span className="h-1.5 w-1.5 rounded-full bg-white" />
                    ONLINE
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="select-none text-4xl font-bold text-white/20">{card.name[0]}</span>
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                  <p className="text-sm font-semibold text-white">
                    {card.flag} {card.name}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showShop && (
        <GemShopModal
          balance={gemBalance}
          canClaimDaily={canClaimDailyGems}
          dailyReward={dailyReward}
          onBuy={onBuyGemPack}
          onClaimDaily={onClaimDailyGems}
          onClose={() => setShowShop(false)}
        />
      )}
    </div>
  );
}

function FilterPill<T extends string>({
  icon,
  label,
  value,
  onChange,
  options,
}: {
  icon: string;
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: Array<{ value: T; label: string }>;
}) {
  return (
    <label className="relative block min-w-0 cursor-pointer">
      <span className="pointer-events-none flex items-center justify-center gap-2 text-lg font-black text-white">
        <span className="text-xl leading-none">{icon}</span>
        <span>{label}</span>
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
        aria-label={label}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
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
      className="flex cursor-pointer items-center justify-between rounded-2xl px-4 py-3"
      style={{ background: "#1e1e1e", border: "1px solid #282828" }}
      onClick={onToggle}
    >
      <div className="flex items-center gap-3 text-sm" style={{ color: enabled ? "#ccc" : "#555" }}>
        <span style={{ color: enabled ? "#888" : "#444" }}>{icon}</span>
        {label}
      </div>
      <div
        className="relative flex-shrink-0 rounded-full transition-colors duration-200"
        style={{
          width: 40,
          height: 22,
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
