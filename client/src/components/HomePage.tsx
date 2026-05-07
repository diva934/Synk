import { useEffect, useState } from "react";
import GenderAvatar from "./GenderAvatar";
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

const PROFILE_COUNTRY_LABELS: Record<Exclude<Country, "any">, string> = {
  FR: "France",
  BE: "Belgique",
  CH: "Suisse",
  CA: "Canada",
  US: "Etats-Unis",
  GB: "Royaume-Uni",
  DE: "Allemagne",
  ES: "Espagne",
  IT: "Italie",
  MA: "Maroc",
  DZ: "Algerie",
  TN: "Tunisie",
};

const PROFILE_GENDER_LABELS: Record<Exclude<Gender, "any">, string> = {
  female: "Femme",
  male: "Homme",
};

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
  const [showShop, setShowShop] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
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
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowShop(true)}
              className="rounded-full bg-white px-5 py-2.5 text-sm font-black text-black transition hover:bg-white/90"
              title="Boutique"
            >
              Shop
            </button>
            <button
              type="button"
              onClick={() => setShowProfile(true)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-white transition hover:bg-white/10"
              title="Profil"
            >
              <GenderAvatar gender={matching.profile.gender} className="h-8 w-8" />
            </button>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col px-6 py-5 md:px-8 md:py-8">
          <div className="flex flex-1" />

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
              onClick={() => onStart({ video: true, audio: true, matching })}
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

      {showProfile && (
        <ProfileSheet
          userEmail={userEmail}
          matching={matching}
          onlineCount={onlineCount}
          onClose={() => setShowProfile(false)}
          onSignOut={onSignOut}
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

function ProfileSheet({
  userEmail,
  matching,
  onlineCount,
  onClose,
  onSignOut,
}: {
  userEmail?: string;
  matching: MatchingPreferences;
  onlineCount: number;
  onClose: () => void;
  onSignOut: () => void;
}) {
  const username = userEmail?.split("@")[0] || "Profil";
  const countryLabel = PROFILE_COUNTRY_LABELS[matching.profile.country];
  const genderLabel = PROFILE_GENDER_LABELS[matching.profile.gender];

  return (
    <div className="fixed inset-0 z-[70] bg-black/45 text-white backdrop-blur-sm" onClick={onClose}>
      <div
        className="absolute inset-x-0 bottom-0 overflow-hidden rounded-t-3xl border border-white/10 bg-[#202020] pb-8 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="relative h-52 bg-[radial-gradient(circle_at_50%_30%,rgba(255,255,255,0.28),rgba(55,65,81,0.35)_35%,rgba(10,10,10,0.9)_82%)]">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full bg-black/25 text-white/70 transition hover:bg-black/35 hover:text-white"
            title="Fermer"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="absolute left-1/2 top-20 -translate-x-1/2">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-black/75 shadow-2xl">
              <GenderAvatar gender={matching.profile.gender} className="h-16 w-16" />
            </div>
          </div>

          <div className="absolute right-10 top-24 text-right">
            <div className="flex items-center justify-end gap-2 text-2xl font-black">
              <span className="h-3 w-3 rounded-full bg-[#00f29a]" />
              {onlineCount.toLocaleString()}
            </div>
            <div className="text-2xl font-black leading-none">matches</div>
          </div>
        </div>

        <div className="border-b border-white/10 px-8 py-6">
          <div className="flex items-center gap-4">
            <GenderAvatar gender={matching.profile.gender} className="h-14 w-14 flex-shrink-0" />
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-lg font-black">
                <span className="truncate">{username}</span>
                <svg className="h-4 w-4 text-white/45" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2 4 5.5v6.2c0 5 3.4 9.6 8 10.8 4.6-1.2 8-5.8 8-10.8V5.5L12 2Zm-1 13.5-3-3 1.4-1.4 1.6 1.6 3.9-3.9 1.4 1.4-5.3 5.3Z" />
                </svg>
              </div>
              <div className="mt-1 flex items-center gap-2 text-sm font-semibold text-white/80">
                <span>{matching.profile.country}</span>
                <span>|</span>
                <span>{genderLabel}</span>
              </div>
              <div className="mt-2 inline-flex max-w-full items-center gap-2 rounded-xl bg-white/10 px-3 py-1.5 text-xs font-bold text-white/45">
                <span>Code</span>
                <span className="truncate">{countryLabel.slice(0, 2).toLowerCase()}{username.slice(0, 8)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="px-8 py-6">
          <ProfileAction icon="profile" label="Modifier le profil" />
          <ProfileAction icon="settings" label="Plus" />
          <ProfileAction icon="contact" label="Nous contacter" />
          <ProfileAction icon="logout" label="Fermer la session" onClick={onSignOut} />
        </div>
      </div>
    </div>
  );
}

function ProfileAction({
  icon,
  label,
  onClick,
}: {
  icon: "profile" | "settings" | "contact" | "logout";
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-5 rounded-2xl px-2 py-4 text-left text-2xl font-black text-white transition hover:bg-white/5"
    >
      <ProfileActionIcon icon={icon} />
      <span>{label}</span>
    </button>
  );
}

function ProfileActionIcon({ icon }: { icon: "profile" | "settings" | "contact" | "logout" }) {
  if (icon === "settings") {
    return (
      <svg className="h-8 w-8 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15.5A3.5 3.5 0 1 0 12 8a3.5 3.5 0 0 0 0 7.5Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.04.04a2 2 0 0 1-2.83 2.83l-.04-.04A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 1.55V21a2 2 0 0 1-4 0v-.05A1.7 1.7 0 0 0 9 19.4a1.7 1.7 0 0 0-1.88.34l-.04.04a2 2 0 0 1-2.83-2.83l.04-.04A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.55-1H3a2 2 0 0 1 0-4h.05A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.34-1.88l-.04-.04a2 2 0 0 1 2.83-2.83l.04.04A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.55V3a2 2 0 0 1 4 0v.05A1.7 1.7 0 0 0 15 4.6a1.7 1.7 0 0 0 1.88-.34l.04-.04a2 2 0 0 1 2.83 2.83l-.04.04A1.7 1.7 0 0 0 19.4 9a1.7 1.7 0 0 0 1.55 1H21a2 2 0 0 1 0 4h-.05A1.7 1.7 0 0 0 19.4 15Z" />
      </svg>
    );
  }

  if (icon === "contact") {
    return (
      <svg className="h-8 w-8 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m16.5 3.5 4 4L8 20H4v-4L16.5 3.5Z" />
      </svg>
    );
  }

  if (icon === "logout") {
    return (
      <svg className="h-8 w-8 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
        <path strokeLinecap="round" strokeLinejoin="round" d="m10 17 5-5-5-5M15 12H3" />
      </svg>
    );
  }

  return (
    <svg className="h-8 w-8 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 21a8 8 0 0 1 16 0" />
    </svg>
  );
}
