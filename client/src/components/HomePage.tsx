import { useEffect, useRef, useState } from "react";
import GenderAvatar from "./GenderAvatar";
import GemShopModal from "./GemShopModal";
import LogoMark from "./LogoMark";
import type { Country, Gender, MatchingPreferences, MediaPreferences } from "../types";

interface Props {
  onStart: (prefs: MediaPreferences) => void;
  onPrepareCamera: () => void;
  previewStream: MediaStream | null;
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
  onPrepareCamera,
  previewStream,
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
  const [dismissedMediaError, setDismissedMediaError] = useState<string | null>(null);
  const previewVideoRef = useRef<HTMLVideoElement | null>(null);
  const showMediaPermissionPrompt = Boolean(mediaError && dismissedMediaError !== mediaError);

  useEffect(() => {
    setMatching(matchingPrefs);
  }, [matchingPrefs]);

  useEffect(() => {
    onPrepareCamera();
  }, [onPrepareCamera]);

  useEffect(() => {
    if (!previewVideoRef.current) return;
    previewVideoRef.current.srcObject = previewStream;
  }, [previewStream]);

  useEffect(() => {
    setDismissedMediaError(null);
  }, [mediaError]);

  return (
    <div className="app-screen relative flex overflow-hidden bg-[#05070b]">
      {previewStream && (
        <video
          ref={previewVideoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 h-full w-full scale-x-[-1] object-cover"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/10 to-black/70" />
      <div className="relative z-10 flex w-full flex-shrink-0 flex-col bg-transparent md:w-full">
        <div className="flex items-center gap-2.5 px-6 py-5">
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

          <div className="flex-shrink-0 pb-2">
            <div className="mb-4 grid grid-cols-[1fr_auto_1fr] items-center rounded-full border border-white/25 bg-white/[0.11] px-5 py-4 shadow-2xl shadow-black/40 backdrop-blur-2xl">
              <FilterPill
                icon="gender"
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
                icon="globe"
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
              className="group relative w-full overflow-hidden rounded-full py-4 text-lg font-black text-white transition-all duration-200 hover:opacity-90 active:scale-[0.98]"
              style={{ background: "#2d6ade" }}
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

      <div className="hidden">
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
          gemBalance={gemBalance}
          onOpenShop={() => {
            setShowProfile(false);
            setShowShop(true);
          }}
          onClose={() => setShowProfile(false)}
          onSignOut={onSignOut}
        />
      )}

      {showMediaPermissionPrompt && (
        <MediaPermissionPrompt onClose={() => setDismissedMediaError(mediaError)} />
      )}
    </div>
  );
}

function MediaPermissionPrompt({ onClose }: { onClose: () => void }) {
  return (
    <div className="absolute inset-0 z-[80] flex flex-col bg-black/82 text-white backdrop-blur-[2px]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_46%,rgba(255,255,255,0.08),transparent_24%),linear-gradient(to_bottom,rgba(0,0,0,0.45),rgba(0,0,0,0.94))]" />

      <div className="relative flex min-h-0 flex-1 flex-col px-7 pb-8 pt-24">
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-[44rem] text-center">
            <div className="mx-auto mb-12 flex h-28 w-28 items-center justify-center rounded-full bg-[#00ef9b]/20 shadow-[0_0_48px_rgba(0,239,155,0.3)] ring-1 ring-[#00ef9b]/25">
              <svg className="h-16 w-16 text-[#00ef9b]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5 20.1 8.4A1.3 1.3 0 0 1 22 9.57v4.86a1.3 1.3 0 0 1-1.9 1.17l-4.35-2.1M4.75 18h8a3 3 0 0 0 3-3V9a3 3 0 0 0-3-3h-8a3 3 0 0 0-3 3v6a3 3 0 0 0 3 3Z" />
                <path strokeLinecap="round" d="M3 3l18 18" />
              </svg>
            </div>

            <h2 className="text-[2.55rem] font-black leading-[1.08] tracking-tight sm:text-6xl">
              Autoriser l'acces a votre camera et microphone
            </h2>
            <p className="mx-auto mt-28 max-w-[43rem] text-[1.35rem] font-semibold leading-tight text-white/62 sm:mt-12 sm:text-2xl">
              Cliquez sur l'icone a cote de la barre d'adresse, choisissez "Parametres du site",
              et reglez la camera et le microphone sur "Autoriser".
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="relative w-full rounded-full border-2 border-white/75 bg-black/15 py-5 text-2xl font-black text-white shadow-2xl shadow-black/40 backdrop-blur-md transition active:scale-[0.98]"
        >
          Fermer
        </button>
      </div>
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
  icon: "gender" | "globe";
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: Array<{ value: T; label: string }>;
}) {
  return (
    <label className="relative block min-w-0 cursor-pointer">
      <span className="pointer-events-none flex items-center justify-center gap-2 text-lg font-black text-white">
        <FilterIcon type={icon} />
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

function FilterIcon({ type }: { type: "gender" | "globe" }) {
  if (type === "globe") {
    return (
      <svg className="h-6 w-6 flex-shrink-0" viewBox="0 0 64 64" fill="none" aria-hidden="true">
        <defs>
          <linearGradient id="filterGlobe" x1="16" y1="10" x2="48" y2="56" gradientUnits="userSpaceOnUse">
            <stop stopColor="#24b9ff" />
            <stop offset="1" stopColor="#102d91" />
          </linearGradient>
        </defs>
        <circle cx="32" cy="32" r="27" fill="url(#filterGlobe)" />
        <path d="M17 19c8 2 12 2 17-2 3 5 1 9-4 10-3 1-6-1-9 2-3 3-4 7-2 11-5-2-9-7-9-14 0-3 1-5 7-7Z" fill="white" />
        <path d="M41 16c7 3 11 9 12 16-4-1-8 0-10 3-3 4-6 4-10 2 2-7 8-8 7-14 0-3-1-5 1-7Z" fill="white" opacity="0.95" />
        <path d="M30 43c5 1 7 4 7 9-4 2-10 2-15-1 1-5 4-8 8-8Z" fill="white" opacity="0.95" />
      </svg>
    );
  }

  return (
    <svg className="h-7 w-7 flex-shrink-0" viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <circle cx="24" cy="35" r="13" stroke="#ef4b87" strokeWidth="6" />
      <path d="M24 48v12M16 56h16" stroke="#ef4b87" strokeWidth="6" strokeLinecap="round" />
      <circle cx="40" cy="24" r="13" stroke="#35aef4" strokeWidth="6" />
      <path d="M49 15h10v10M49 15l10 10" stroke="#35aef4" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ProfileSheet({
  userEmail,
  matching,
  onlineCount,
  gemBalance = 0,
  onOpenShop,
  onClose,
  onSignOut,
}: {
  userEmail?: string;
  matching: MatchingPreferences;
  onlineCount: number;
  gemBalance?: number;
  onOpenShop?: () => void;
  onClose: () => void;
  onSignOut: () => void;
}) {
  const username = userEmail?.split("@")[0] || "Profil";
  const countryLabel = PROFILE_COUNTRY_LABELS[matching.profile.country];
  const genderLabel = PROFILE_GENDER_LABELS[matching.profile.gender];
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showMorePage, setShowMorePage] = useState(false);

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
          <ProfileAction icon="profile" label="Modifier le profil" onClick={() => setShowEditProfile(true)} />
          <ProfileAction icon="settings" label="Plus" onClick={() => setShowMorePage(true)} />
          <ProfileAction icon="contact" label="Nous contacter" />
          <ProfileAction icon="logout" label="Fermer la session" onClick={onSignOut} />
        </div>
      </div>

      {showEditProfile && (
        <ProfileEditPage
          userEmail={userEmail}
          username={username}
          matching={matching}
          onClose={() => setShowEditProfile(false)}
        />
      )}

      {showMorePage && (
        <ProfileMorePage
          userEmail={userEmail}
          gemBalance={gemBalance}
          onOpenShop={onOpenShop}
          onClose={() => setShowMorePage(false)}
        />
      )}
    </div>
  );
}

function ProfileMorePage({
  userEmail,
  gemBalance,
  onOpenShop,
  onClose,
}: {
  userEmail?: string;
  gemBalance: number;
  onOpenShop?: () => void;
  onClose: () => void;
}) {
  const [marketingNotifications, setMarketingNotifications] = useState(false);
  const [onlineFriends, setOnlineFriends] = useState(true);
  const [newFollowers, setNewFollowers] = useState(true);

  return (
    <div
      className="fixed inset-0 z-[90] flex flex-col overflow-hidden bg-[#101010] text-white"
      onClick={(event) => event.stopPropagation()}
    >
      <div className="flex flex-shrink-0 items-center gap-3 px-5 pb-6 pt-12">
        <button
          type="button"
          onClick={onClose}
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-white transition hover:bg-white/10"
          title="Fermer"
        >
          <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
        <h1 className="min-w-0 text-4xl font-black leading-none tracking-tight">Plus</h1>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-12 scrollbar-hide">
        <MoreSectionTitle label="Activité" />
        <MoreRow label="Mes Gemmes" value={gemBalance.toLocaleString()} gem onClick={onOpenShop} />
        <MoreRow label="Mes Items" />

        <MoreSectionTitle label="Compte et sécurité" className="mt-9" />
        <MoreRow label="Email" sublabel={userEmail || "Non connecté"} />
        <MoreRow label="Paramètres du compte" />

        <MoreSectionTitle label="Notification" className="mt-9" />
        <MoreToggleRow
          label="Notification de marketing"
          checked={marketingNotifications}
          onChange={setMarketingNotifications}
        />
        <MoreToggleRow
          label="Informer mes amis que je suis en ligne"
          description="Tu peux informer tes amis que tu es en ligne et recevoir des notifications lorsqu'ils le sont aussi."
          checked={onlineFriends}
          onChange={setOnlineFriends}
        />
        <MoreToggleRow
          label="Notifications de nouveaux abonnés"
          checked={newFollowers}
          onChange={setNewFollowers}
        />

      </div>
    </div>
  );
}

function MoreSectionTitle({ label, className = "" }: { label: string; className?: string }) {
  return (
    <h2 className={`mb-4 text-2xl font-black tracking-tight text-white/20 ${className}`}>
      {label}
    </h2>
  );
}

function MoreRow({
  label,
  sublabel,
  value,
  gem = false,
  onClick,
}: {
  label: string;
  sublabel?: string;
  value?: string;
  gem?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-[4.4rem] w-full items-center gap-4 text-left transition active:scale-[0.99]"
    >
      <div className="min-w-0 flex-1">
        <div className="text-xl font-medium leading-tight text-white">{label}</div>
        {sublabel && (
          <div className="mt-1.5 truncate text-base font-medium leading-tight text-white/40">
            {sublabel}
          </div>
        )}
      </div>
      {value !== undefined && (
        <div className="flex items-center gap-2 text-xl font-semibold text-white">
          {gem && <GemMiniIcon className="h-7 w-7" />}
          <span>{value}</span>
        </div>
      )}
      <ChevronIcon />
    </button>
  );
}

function MoreToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex min-h-[4.8rem] items-center gap-4 py-1.5">
      <div className="min-w-0 flex-1">
        <div className="text-xl font-medium leading-tight text-white">{label}</div>
        {description && (
          <p className="mt-2 max-w-[21rem] text-base font-medium leading-snug text-white/40">
            {description}
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative h-9 w-16 flex-shrink-0 rounded-full p-1 transition ${
          checked ? "bg-[#58ea8c]" : "bg-[#303030]"
        }`}
        aria-pressed={checked}
      >
        <span
          className={`block h-7 w-7 rounded-full bg-white shadow-lg transition ${
            checked ? "translate-x-7" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}

function ChevronIcon() {
  return (
    <svg className="h-6 w-6 flex-shrink-0 text-white/30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m9 6 6 6-6 6" />
    </svg>
  );
}

function GemMiniIcon({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 52" fill="none" aria-hidden="true">
      <path d="M8 22 20 8h24l12 14-24 26L8 22Z" fill="#ffca3a" />
      <path d="M20 8h24l5 14H15l5-14Z" fill="#ffe27a" />
      <path d="M15 22h34L32 48 15 22Z" fill="#f7a800" />
      <path d="M8 22h7l17 26L8 22Z" fill="#ffb51d" />
      <path d="M56 22h-7L32 48l24-26Z" fill="#e49300" />
      <path d="M22 11h20" stroke="white" strokeWidth="4" strokeLinecap="round" opacity="0.45" />
    </svg>
  );
}

function ProfileEditPage({
  userEmail,
  username,
  matching,
  onClose,
}: {
  userEmail?: string;
  username: string;
  matching: MatchingPreferences;
  onClose: () => void;
}) {
  const storageKey = `randomchat:profile-edit:${userEmail || "anonymous"}`;
  const [bio, setBio] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? (JSON.parse(saved).bio as string) || "" : "";
    } catch {
      return "";
    }
  });
  const [hashtag, setHashtag] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? (JSON.parse(saved).hashtag as string) || "Salut" : "Salut";
    } catch {
      return "Salut";
    }
  });

  const remaining = 250 - bio.length;

  const handleDone = () => {
    localStorage.setItem(storageKey, JSON.stringify({ bio, hashtag }));
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[90] flex flex-col overflow-hidden bg-[#101010] text-white"
      onClick={(event) => event.stopPropagation()}
    >
      <div className="flex flex-shrink-0 items-center gap-4 px-6 pb-4 pt-12">
        <button
          type="button"
          onClick={onClose}
          className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full text-white transition hover:bg-white/10"
          title="Fermer"
        >
          <svg className="h-9 w-9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
        <h1 className="min-w-0 text-4xl font-black leading-tight tracking-tight">Modifier le profil</h1>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-32 scrollbar-hide">
        <div className="grid max-w-[25.5rem] grid-cols-2 gap-4">
          <button
            type="button"
            className="relative aspect-[0.74] overflow-hidden rounded-[1.55rem] bg-[#2f2f2f] shadow-2xl shadow-black/35"
            title="Modifier la photo"
          >
            <div className="absolute left-4 top-4 rounded-full bg-black px-3 py-1.5 text-xs font-black">En avant</div>
            <div className="absolute inset-0 flex items-center justify-center bg-[radial-gradient(circle_at_44%_25%,rgba(255,255,255,0.32),transparent_28%),linear-gradient(155deg,#1d1d1d,#353535)]">
              <GenderAvatar gender={matching.profile.gender} className="h-40 w-40" />
            </div>
            <span className="absolute bottom-4 right-4 flex h-14 w-14 items-center justify-center rounded-full bg-white text-black shadow-xl">
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="m16.7 3.9 3.4 3.4-10.9 10.9H5.8v-3.4L16.7 3.9Zm1.4-1.4a1.6 1.6 0 0 1 2.3 0l1.1 1.1a1.6 1.6 0 0 1 0 2.3l-.7.7-3.4-3.4.7-.7Z" />
              </svg>
            </span>
          </button>

          <button
            type="button"
            className="flex aspect-[0.74] items-center justify-center rounded-[1.55rem] bg-[#343434] text-white transition hover:bg-[#3c3c3c]"
            title="Ajouter une photo"
          >
            <svg className="h-12 w-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" d="M12 5v14M5 12h14" />
            </svg>
          </button>
        </div>

        <p className="mt-4 max-w-[38rem] text-base font-medium leading-snug text-white/75">
          Veuillez ne pas partager de contenu inapproprie ou d'informations personnelles
          (comme votre numero de telephone ou votre adresse) sur votre profil. Tous les
          elements telecharges sont verifies et moderes.
        </p>

        <section className="mt-10">
          <h2 className="text-3xl font-black tracking-tight">A propos de moi</h2>
          <div className="relative mt-5 rounded-[1.3rem] bg-[#333]">
            <textarea
              value={bio}
              onChange={(event) => setBio(event.target.value.slice(0, 250))}
              placeholder="Ecris quelque chose a propos de toi!"
              className="h-40 w-full resize-none rounded-[1.3rem] bg-transparent px-6 py-7 pr-16 text-2xl font-medium text-white outline-none placeholder:text-white/32"
              maxLength={250}
            />
            <span className="absolute bottom-7 right-6 text-lg font-black text-white/55">{remaining}</span>
          </div>
        </section>

        <section className="mt-9">
          <h2 className="text-3xl font-black tracking-tight">Hashtag</h2>
          <label className="relative mt-5 flex h-28 items-center rounded-[1.3rem] bg-[#333] px-7">
            <span className="mr-4 text-4xl font-black text-white/45">#</span>
            <span className="rounded-full bg-white px-7 py-3 text-2xl font-medium text-black">{hashtag}</span>
            <select
              value={hashtag}
              onChange={(event) => setHashtag(event.target.value)}
              aria-label="Hashtag"
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            >
              <option>Salut</option>
              <option>Chill</option>
              <option>Discussion</option>
              <option>Video</option>
            </select>
            <svg className="ml-auto h-8 w-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
            </svg>
          </label>
        </section>

        <section className="mt-9">
          <h2 className="text-3xl font-black tracking-tight">Mes infos</h2>
          <ProfileInfoRow icon="profile" label={username} />
          <ProfileInfoRow icon="language" label="Langue" />
        </section>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#101010] via-[#101010] to-transparent px-6 pb-8 pt-14">
        <button
          type="button"
          onClick={handleDone}
          className="pointer-events-auto w-full rounded-full bg-[#00ef9b] py-5 text-2xl font-black text-black shadow-2xl shadow-[#00ef9b]/20 transition active:scale-[0.98]"
        >
          Accomplie
        </button>
      </div>
    </div>
  );
}

function ProfileInfoRow({ icon, label }: { icon: "profile" | "language"; label: string }) {
  return (
    <button
      type="button"
      className="mt-5 flex h-24 w-full items-center gap-5 rounded-[1.3rem] bg-[#333] px-7 text-left text-2xl font-black text-white transition hover:bg-[#3b3b3b]"
    >
      {icon === "language" ? (
        <svg className="h-8 w-8 flex-shrink-0 text-white/45" viewBox="0 0 24 24" fill="currentColor">
          <path d="M4 4h8a3 3 0 0 1 3 3v1h1a4 4 0 0 1 0 8h-.4l1.9 4h-2.3l-.7-1.5h-4.1L9.7 20H7.4l3.2-6.8A3.99 3.99 0 0 1 8 9.5V7H4V4Zm8 3v2.5A1.5 1.5 0 0 0 13.5 11H16a2 2 0 1 0 0-4h-4Zm-.7 9.5h2.4l-1.2-2.7-1.2 2.7Z" />
        </svg>
      ) : (
        <svg className="h-8 w-8 flex-shrink-0 text-white/45" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 21a8 8 0 0 1 16 0H4Z" />
        </svg>
      )}
      <span className="min-w-0 flex-1 truncate">{label}</span>
      <svg className="h-7 w-7 flex-shrink-0 text-white/85" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m9 6 6 6-6 6" />
      </svg>
    </button>
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
