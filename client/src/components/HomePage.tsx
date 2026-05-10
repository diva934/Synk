import { useEffect, useRef, useState, type ReactNode } from "react";
import GenderAvatar from "./GenderAvatar";
import GemShopModal from "./GemShopModal";
import LogoMark from "./LogoMark";
import type { Country, Gender, MatchingPreferences, MediaPreferences } from "../types";

interface Props {
  onStart: (prefs: MediaPreferences) => void;
  onPrepareCamera: () => void;
  previewStream: MediaStream | null;
  mediaError: string | null;
  onClearMediaError: () => void;
  onlineCount: number;
  userEmail?: string;
  gemBalance: number;
  matchingPrefs: MatchingPreferences;
  canClaimDailyGems: boolean;
  dailyReward: number;
  onBuyGemPack: (gems: number) => void;
  onClaimDailyGems: () => void;
  profileEdit: ProfileEditDraft;
  onProfileEditSave: (draft: ProfileEditDraft) => void;
  onSignOut: () => void;
}

const PREVIEW_CARDS = [
  { name: "Sofia, 24", flag: "🇫🇷", online: true,  tall: false },
  { name: "Marco, 27", flag: "🇮🇹", online: true,  tall: true  },
  { name: "Yuna, 22",  flag: "🇰🇷", online: false, tall: false },
  { name: "Alex, 25",  flag: "🇺🇸", online: true,  tall: true  },
  { name: "Lea, 23",   flag: "🇧🇪", online: true,  tall: false },
  { name: "Carlos, 29",flag: "🇧🇷", online: false, tall: true  },
  { name: "Hana, 21",  flag: "🇯🇵", online: true,  tall: false },
  { name: "Diego, 26", flag: "🇲🇽", online: true,  tall: true  },
  { name: "Emma, 23",  flag: "🇩🇪", online: false, tall: false },
];

const GRADIENTS = [
  "linear-gradient(135deg,#1e3a5f,#2d6ade)",
  "linear-gradient(135deg,#3b1f5e,#7c3aed)",
  "linear-gradient(135deg,#1f3b2e,#16a34a)",
  "linear-gradient(135deg,#3b2a1f,#d97706)",
  "linear-gradient(135deg,#3b1f2a,#db2777)",
  "linear-gradient(135deg,#1f2b3b,#0891b2)",
  "linear-gradient(135deg,#2d1f3b,#9333ea)",
  "linear-gradient(135deg,#1f3b35,#0d9488)",
  "linear-gradient(135deg,#3b2f1f,#ea580c)",
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
  onClearMediaError,
  onlineCount,
  userEmail,
  gemBalance,
  matchingPrefs,
  canClaimDailyGems,
  dailyReward,
  onBuyGemPack,
  onClaimDailyGems,
  profileEdit,
  onProfileEditSave,
  onSignOut,
}: Props) {
  const [showShop, setShowShop] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showCountrySheet, setShowCountrySheet] = useState(false);
  const [showGenderSheet, setShowGenderSheet] = useState(false);
  const [matching, setMatching] = useState<MatchingPreferences>(matchingPrefs);
  const previewVideoRef = useRef<HTMLVideoElement | null>(null);
  const desktopVideoRef = useRef<HTMLVideoElement | null>(null);
  const showMediaPermissionPrompt = Boolean(mediaError);

  useEffect(() => {
    setMatching(matchingPrefs);
  }, [matchingPrefs]);

  useEffect(() => {
    onPrepareCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (previewVideoRef.current) previewVideoRef.current.srcObject = previewStream;
    if (desktopVideoRef.current) desktopVideoRef.current.srcObject = previewStream;
  }, [previewStream]);

  // Handle Stripe payment return
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const payment = params.get("payment");
    if (payment === "success") {
      const gems = parseInt(params.get("gems") ?? "0", 10);
      if (gems > 0) onBuyGemPack(gems);
      // Clean URL without reload
      window.history.replaceState({}, "", window.location.pathname);
    } else if (payment === "cancelled") {
      window.history.replaceState({}, "", window.location.pathname);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="app-screen relative flex overflow-hidden bg-[#05070b]">

      {/* ══════════════════════════════════════════════════════════════
          MOBILE layout  (hidden on lg+)
      ══════════════════════════════════════════════════════════════ */}
      {previewStream && (
        <video
          ref={previewVideoRef}
          autoPlay playsInline muted
          className="absolute inset-0 h-full w-full scale-x-[-1] object-cover lg:hidden"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/10 to-black/70 lg:hidden" />
      <div className="relative z-10 flex w-full flex-shrink-0 flex-col bg-transparent lg:hidden">
        {/* Mobile header */}
        <div className="flex items-center gap-2.5 px-6 py-5">
          <div className="flex min-w-0 flex-1 items-center gap-2.5">
            <LogoMark className="h-11 w-11 flex-shrink-0" />
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setShowShop(true)}
              className="rounded-full bg-white px-5 py-2.5 text-sm font-black text-black transition hover:bg-white/90">
              Shop
            </button>
            <button type="button" onClick={() => setShowProfile(true)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-white transition hover:bg-white/10">
              {profileEdit.primaryPhoto
                ? <img src={profileEdit.primaryPhoto} alt="" className="h-8 w-8 rounded-full object-cover" />
                : <GenderAvatar gender={matching.profile.gender} className="h-8 w-8" />}
            </button>
          </div>
        </div>
        {/* Mobile controls */}
        <div className="flex min-h-0 flex-1 flex-col px-6 py-5">
          <div className="flex flex-1" />
          <div className="flex-shrink-0 pb-2">
            <div className="mb-4 grid grid-cols-[1fr_auto_1fr] items-center rounded-full border border-white/25 bg-white/[0.11] px-5 py-4 shadow-2xl shadow-black/40 backdrop-blur-2xl">
              <button
                type="button"
                onClick={() => setShowGenderSheet(true)}
                className="flex items-center justify-center gap-2 text-lg font-black text-white"
              >
                <FilterIcon type="gender" />
                <span>Genre</span>
              </button>
              <span className="mx-4 h-7 w-px bg-white/15" />
              <button
                type="button"
                onClick={() => setShowCountrySheet(true)}
                className="flex items-center justify-center gap-2 text-lg font-black text-white"
              >
                <FilterIcon type="globe" />
                <span>Pays</span>
              </button>
            </div>
            <button onClick={() => onStart({ video: true, audio: true, matching })}
              className="group relative w-full overflow-hidden rounded-full py-4 text-lg font-black text-white transition-all duration-200 hover:opacity-90 active:scale-[0.98] btn-swipe"
              style={{ background: "#2d6ade" }}>
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

      {/* ══════════════════════════════════════════════════════════════
          DESKTOP layout — style Azar  (hidden on mobile)
      ══════════════════════════════════════════════════════════════ */}
      <div className="hidden lg:flex absolute inset-0 flex-col bg-[#111111]">

        {/* ── Top navbar ── */}
        <div className="flex flex-shrink-0 items-center gap-3 border-b border-white/[0.06] px-6 py-3">
          <LogoMark className="h-10 w-10 flex-shrink-0" />
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setShowShop(true)}
              className="rounded-full bg-white px-5 py-2 text-sm font-black text-black transition hover:bg-white/90">
              Shop
            </button>
            <button type="button" onClick={() => setShowProfile(true)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-white transition hover:bg-white/10">
              {profileEdit.primaryPhoto
                ? <img src={profileEdit.primaryPhoto} alt="" className="h-8 w-8 rounded-full object-cover" />
                : <GenderAvatar gender={matching.profile.gender} className="h-8 w-8" />}
            </button>
          </div>
        </div>

        {/* ── Two panels ── */}
        <div className="flex flex-1 min-h-0">

          {/* LEFT PANEL — camera + controls */}
          <div className="relative flex w-[48%] flex-shrink-0 flex-col overflow-hidden">
            {/* Camera preview as bg */}
            {previewStream ? (
              <video ref={desktopVideoRef} autoPlay playsInline muted
                className="absolute inset-0 h-full w-full scale-x-[-1] object-cover" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-[#0d0d0d]">
                <GenderAvatar gender={matching.profile.gender} className="h-28 w-28 opacity-10" />
              </div>
            )}
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/10 to-black/80" />

            {/* Content */}
            <div className="relative z-10 flex flex-1 flex-col justify-end px-8 pb-8">
              {/* Online count */}
              <p className="mb-8 flex items-center gap-2 text-sm font-semibold text-white/70">
                <span className="h-2 w-2 animate-pulse rounded-full bg-green-400" />
                {onlineCount.toLocaleString()} personnes sont en ligne maintenant !
              </p>

              {/* Genre + Pays pills */}
              <div className="mb-3 flex gap-3">
                {/* Genre pill */}
                <label className="relative flex h-12 flex-1 cursor-pointer items-center gap-2.5 rounded-full bg-white/10 px-5 text-white backdrop-blur-sm transition hover:bg-white/15">
                  <FilterIcon type="gender" />
                  <span className="flex-1 text-sm font-bold">Genre</span>
                  <span className="text-[10px] font-semibold text-white/50 uppercase tracking-wider">
                    {TARGET_GENDERS.find((o) => o.value === matching.filters.gender)?.label ?? "Tous"}
                  </span>
                  <svg className="h-4 w-4 text-white/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
                  </svg>
                  <select
                    value={matching.filters.gender}
                    onChange={(e) => setMatching((c) => ({ ...c, filters: { ...c.filters, gender: e.target.value as Gender } }))}
                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                  >
                    {TARGET_GENDERS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </label>

                {/* Pays pill */}
                <label className="relative flex h-12 flex-1 cursor-pointer items-center gap-2.5 rounded-full bg-white/10 px-5 text-white backdrop-blur-sm transition hover:bg-white/15">
                  <FilterIcon type="globe" />
                  <span className="flex-1 text-sm font-bold">Pays</span>
                  <span className="text-[10px] font-semibold text-white/50 uppercase tracking-wider">
                    {COUNTRIES.find((o) => o.value === matching.filters.country)?.label.slice(0, 8) ?? "Tous"}
                  </span>
                  <svg className="h-4 w-4 text-white/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
                  </svg>
                  <select
                    value={matching.filters.country}
                    onChange={(e) => setMatching((c) => ({ ...c, filters: { ...c.filters, country: e.target.value as Country } }))}
                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                  >
                    {COUNTRIES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </label>
              </div>

              {/* Launch button */}
              <button
                onClick={() => onStart({ video: true, audio: true, matching })}
                className="relative flex w-full overflow-hidden items-center justify-center gap-3 rounded-full bg-white py-4 text-base font-black text-black shadow-2xl shadow-black/30 transition hover:bg-white/90 active:scale-[0.98] btn-swipe"
              >
                <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M5 6.5A3.5 3.5 0 0 0 1.5 10v4A3.5 3.5 0 0 0 5 17.5h7A3.5 3.5 0 0 0 15.5 14v-.17l3.55 2.28A1.6 1.6 0 0 0 21.5 14.76V9.24a1.6 1.6 0 0 0-2.45-1.35l-3.55 2.28V10A3.5 3.5 0 0 0 12 6.5H5Z" />
                </svg>
                Lancer un chat vidéo
              </button>
            </div>
          </div>

          {/* RIGHT PANEL — masonry preview grid */}
          <div className="flex-1 overflow-y-auto bg-[#111111] scrollbar-hide">
            <div className="columns-3 gap-[3px] p-[3px] space-y-[3px]">
              {PREVIEW_CARDS.map((card, i) => (
                <div
                  key={card.name}
                  className="break-inside-avoid relative overflow-hidden rounded-xl"
                  style={{
                    background: GRADIENTS[i % GRADIENTS.length],
                    height: card.tall ? 320 : 220,
                  }}
                >
                  {card.online && (
                    <div className="absolute left-2.5 top-2.5 z-10 flex items-center gap-1 rounded-full bg-green-500 px-2 py-0.5 text-[10px] font-bold text-white">
                      <span className="h-1.5 w-1.5 rounded-full bg-white" />
                      ONLINE
                    </div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="select-none text-7xl font-black text-white/10">{card.name[0]}</span>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/85 to-transparent p-3 pt-8">
                    <p className="text-sm font-bold text-white">
                      {card.flag} {card.name}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>{/* end two panels */}
      </div>{/* end desktop layout */}

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
          initialEdit={profileEdit}
          onProfileEditSave={onProfileEditSave}
          onClose={() => setShowProfile(false)}
          onSignOut={onSignOut}
        />
      )}

      {showGenderSheet && (
        <GenderSheet
          value={matching.filters.gender}
          onChange={(g) => setMatching((m) => ({ ...m, filters: { ...m.filters, gender: g } }))}
          onClose={() => setShowGenderSheet(false)}
          onStart={() => { setShowGenderSheet(false); onStart({ video: true, audio: true, matching }); }}
        />
      )}

      {showCountrySheet && (
        <CountrySheet
          value={matching.filters.country}
          profileCountry={matching.profile.country}
          onChange={(c) => setMatching((m) => ({ ...m, filters: { ...m.filters, country: c } }))}
          onClose={() => setShowCountrySheet(false)}
          onStart={() => { setShowCountrySheet(false); onStart({ video: true, audio: true, matching }); }}
        />
      )}

      {showMediaPermissionPrompt && (
        <MediaPermissionPrompt onDismiss={onClearMediaError} />
      )}
    </div>
  );
}

function MediaPermissionPrompt({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div
      className="absolute inset-0 z-[80] flex flex-col bg-black/82 text-white backdrop-blur-[2px]"
      onClick={onDismiss}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_46%,rgba(255,255,255,0.08),transparent_24%),linear-gradient(to_bottom,rgba(0,0,0,0.45),rgba(0,0,0,0.94))]" />

      <div className="relative flex min-h-0 flex-1 flex-col items-center justify-center px-7 pb-8 pt-24">
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
          <p className="mt-10 text-sm font-semibold text-white/30">
            Appuyez n'importe où pour réessayer
          </p>
        </div>
      </div>
    </div>
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

export type ProfileEditDraft = {
  bio?: string;
  hashtag?: string;
  displayName?: string;
  language?: string;
  primaryPhoto?: string;
  secondaryPhoto?: string;
};

const DEFAULT_PROFILE_HASHTAG = "Salut";
const DEFAULT_PROFILE_LANGUAGE = "Français";
const PROFILE_HASHTAGS = ["Salut", "Chill", "Discussion", "Video"];
const PROFILE_LANGUAGES = ["Français", "English", "Español", "Deutsch"];

function getProfileEditStorageKey(userEmail?: string) {
  return `randomchat:profile-edit:${userEmail || "anonymous"}`;
}

export function readProfileEditDraft(userEmail?: string): ProfileEditDraft {
  try {
    const saved = localStorage.getItem(getProfileEditStorageKey(userEmail));
    return saved ? (JSON.parse(saved) as ProfileEditDraft) : {};
  } catch {
    return {};
  }
}

export function ProfileSheet({
  userEmail,
  matching,
  onlineCount,
  initialEdit,
  onProfileEditSave,
  onClose,
  onSignOut,
}: {
  userEmail?: string;
  matching: MatchingPreferences;
  onlineCount: number;
  initialEdit?: ProfileEditDraft;
  onProfileEditSave?: (draft: ProfileEditDraft) => void;
  onClose: () => void;
  onSignOut: () => void;
}) {
  const [profileEdit, setProfileEdit] = useState<ProfileEditDraft>(() => initialEdit || readProfileEditDraft(userEmail));

  useEffect(() => {
    setProfileEdit(initialEdit || readProfileEditDraft(userEmail));
  }, [userEmail, initialEdit]);

  const handleProfileEditSave = (draft: ProfileEditDraft) => {
    setProfileEdit(draft);
    onProfileEditSave?.(draft);
  };

  const username = profileEdit.displayName?.trim() || userEmail?.split("@")[0] || "Profil";
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
              {profileEdit.primaryPhoto ? (
                <img src={profileEdit.primaryPhoto} alt="" className="h-16 w-16 rounded-full object-cover" />
              ) : (
                <GenderAvatar gender={matching.profile.gender} className="h-16 w-16" />
              )}
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
            {profileEdit.primaryPhoto ? (
              <img src={profileEdit.primaryPhoto} alt="" className="h-14 w-14 flex-shrink-0 rounded-full object-cover" />
            ) : (
              <GenderAvatar gender={matching.profile.gender} className="h-14 w-14 flex-shrink-0" />
            )}
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
          initialEdit={profileEdit}
          onSave={handleProfileEditSave}
          onClose={() => setShowEditProfile(false)}
        />
      )}

      {showMorePage && (
        <ProfileMorePage
          userEmail={userEmail}
          onClose={() => setShowMorePage(false)}
        />
      )}
    </div>
  );
}

function ProfileMorePage({
  userEmail,
  onClose,
}: {
  userEmail?: string;
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
        <MoreSectionTitle label="Compte et sécurité" />
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
  initialEdit,
  onSave,
  onClose,
}: {
  userEmail?: string;
  username: string;
  matching: MatchingPreferences;
  initialEdit: ProfileEditDraft;
  onSave: (draft: ProfileEditDraft) => void;
  onClose: () => void;
}) {
  const storageKey = getProfileEditStorageKey(userEmail);
  const primaryPhotoInputRef = useRef<HTMLInputElement | null>(null);
  const secondaryPhotoInputRef = useRef<HTMLInputElement | null>(null);
  const [displayName, setDisplayName] = useState(initialEdit.displayName || username);
  const [bio, setBio] = useState(initialEdit.bio || "");
  const [hashtag, setHashtag] = useState(initialEdit.hashtag || DEFAULT_PROFILE_HASHTAG);
  const [language, setLanguage] = useState(initialEdit.language || DEFAULT_PROFILE_LANGUAGE);
  const [primaryPhoto, setPrimaryPhoto] = useState(initialEdit.primaryPhoto || "");
  const [secondaryPhoto, setSecondaryPhoto] = useState(initialEdit.secondaryPhoto || "");
  const [showNameEditor, setShowNameEditor] = useState(false);
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);

  const remaining = 250 - bio.length;

  const handleDone = () => {
    const draft = {
      bio,
      hashtag,
      displayName: displayName.trim() || username,
      language,
      primaryPhoto,
      secondaryPhoto,
    };
    localStorage.setItem(storageKey, JSON.stringify(draft));
    onSave(draft);
    onClose();
  };

  const handlePhotoFile = (file: File | undefined, slot: "primary" | "secondary") => {
    if (!file || !file.type.startsWith("image/")) return;

    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        const maxSide = 640;
        const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
        const width = Math.max(1, Math.round(image.width * scale));
        const height = Math.max(1, Math.round(image.height * scale));
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        if (!context) return;
        canvas.width = width;
        canvas.height = height;
        context.drawImage(image, 0, 0, width, height);
        const photo = canvas.toDataURL("image/jpeg", 0.82);
        if (slot === "primary") setPrimaryPhoto(photo);
        else setSecondaryPhoto(photo);
      };
      image.src = String(reader.result || "");
    };
    reader.readAsDataURL(file);
  };

  return (
    <div
      className="fixed inset-0 z-[90] flex flex-col overflow-hidden bg-[#101010] text-white"
      onClick={(event) => event.stopPropagation()}
    >
      <div className="flex flex-shrink-0 items-center gap-3 px-5 pb-4 pt-12">
        <button
          type="button"
          onClick={onClose}
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-white transition hover:bg-white/10"
          title="Fermer"
        >
          <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
        <h1 className="min-w-0 text-3xl font-black leading-tight tracking-tight">Modifier le profil</h1>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-24 scrollbar-hide">
        <div className="grid max-w-[20rem] grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => primaryPhotoInputRef.current?.click()}
            className="relative aspect-[0.78] overflow-hidden rounded-[1.15rem] bg-[#2f2f2f] shadow-2xl shadow-black/35"
            title="Modifier la photo"
          >
            <div className="absolute left-3 top-3 z-10 rounded-full bg-black px-2.5 py-1 text-[0.65rem] font-black">En avant</div>
            <div className="absolute inset-0 flex items-center justify-center bg-[radial-gradient(circle_at_44%_25%,rgba(255,255,255,0.32),transparent_28%),linear-gradient(155deg,#1d1d1d,#353535)]">
              {primaryPhoto ? (
                <img src={primaryPhoto} alt="" className="h-full w-full object-cover" />
              ) : (
                <GenderAvatar gender={matching.profile.gender} className="h-28 w-28" />
              )}
            </div>
            <span className="absolute bottom-3 right-3 flex h-10 w-10 items-center justify-center rounded-full bg-white text-black shadow-xl">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="m16.7 3.9 3.4 3.4-10.9 10.9H5.8v-3.4L16.7 3.9Zm1.4-1.4a1.6 1.6 0 0 1 2.3 0l1.1 1.1a1.6 1.6 0 0 1 0 2.3l-.7.7-3.4-3.4.7-.7Z" />
              </svg>
            </span>
          </button>

          <button
            type="button"
            onClick={() => secondaryPhotoInputRef.current?.click()}
            className="flex aspect-[0.78] items-center justify-center overflow-hidden rounded-[1.15rem] bg-[#343434] text-white transition hover:bg-[#3c3c3c]"
            title="Ajouter une photo"
          >
            {secondaryPhoto ? (
              <img src={secondaryPhoto} alt="" className="h-full w-full object-cover" />
            ) : (
              <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" d="M12 5v14M5 12h14" />
              </svg>
            )}
          </button>
          <input
            ref={primaryPhotoInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => {
              handlePhotoFile(event.target.files?.[0], "primary");
              event.currentTarget.value = "";
            }}
          />
          <input
            ref={secondaryPhotoInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => {
              handlePhotoFile(event.target.files?.[0], "secondary");
              event.currentTarget.value = "";
            }}
          />
        </div>

        <p className="mt-4 max-w-[34rem] text-sm font-medium leading-snug text-white/75">
          Veuillez ne pas partager de contenu inapproprie ou d'informations personnelles
          (comme votre numero de telephone ou votre adresse) sur votre profil. Tous les
          elements telecharges sont verifies et moderes.
        </p>

        <section className="mt-8">
          <h2 className="text-2xl font-black tracking-tight">A propos de moi</h2>
          <div className="relative mt-4 rounded-[1.1rem] bg-[#333]">
            <textarea
              value={bio}
              onChange={(event) => setBio(event.target.value.slice(0, 250))}
              placeholder="Ecris quelque chose a propos de toi!"
              className="h-28 w-full resize-none rounded-[1.1rem] bg-transparent px-5 py-5 pr-14 text-lg font-medium text-white outline-none placeholder:text-white/32"
              maxLength={250}
            />
            <span className="absolute bottom-5 right-5 text-sm font-black text-white/55">{remaining}</span>
          </div>
        </section>

        <section className="mt-7">
          <h2 className="text-2xl font-black tracking-tight">Hashtag</h2>
          <label className="relative mt-4 flex h-16 items-center rounded-[1.1rem] bg-[#333] px-5">
            <span className="mr-3 text-2xl font-black text-white/45">#</span>
            <span className="rounded-full bg-white px-4 py-2 text-base font-medium text-black">{hashtag}</span>
            <select
              value={hashtag}
              onChange={(event) => setHashtag(event.target.value)}
              aria-label="Hashtag"
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            >
              {PROFILE_HASHTAGS.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
            <svg className="ml-auto h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
            </svg>
          </label>
        </section>

        <section className="mt-7">
          <h2 className="text-2xl font-black tracking-tight">Mes infos</h2>
          <ProfileInfoRow icon="profile" label={displayName} onClick={() => setShowNameEditor((value) => !value)} />
          {showNameEditor && (
            <input
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value.slice(0, 32))}
              className="mt-3 h-14 w-full rounded-[1.1rem] bg-[#333] px-5 text-lg font-bold text-white outline-none ring-1 ring-white/10 focus:ring-white/25"
              placeholder="Ton pseudo"
            />
          )}
          <ProfileInfoRow
            icon="language"
            label={`Langue - ${language}`}
            onClick={() => setShowLanguagePicker((value) => !value)}
          />
          {showLanguagePicker && (
            <div className="mt-3 grid grid-cols-2 gap-2">
              {PROFILE_LANGUAGES.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => {
                    setLanguage(option);
                    setShowLanguagePicker(false);
                  }}
                  className={`h-12 rounded-full text-sm font-black transition ${
                    language === option ? "bg-white text-black" : "bg-[#333] text-white"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          )}
        </section>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#101010] via-[#101010] to-transparent px-6 pb-7 pt-12">
        <button
          type="button"
          onClick={handleDone}
          className="pointer-events-auto w-full rounded-full bg-[#00ef9b] py-4 text-lg font-black text-black shadow-2xl shadow-[#00ef9b]/20 transition active:scale-[0.98]"
        >
          Accomplie
        </button>
      </div>
    </div>
  );
}

function ProfileInfoRow({
  icon,
  label,
  onClick,
}: {
  icon: "profile" | "language";
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-4 flex h-16 w-full items-center gap-4 rounded-[1.1rem] bg-[#333] px-5 text-left text-lg font-black text-white transition hover:bg-[#3b3b3b]"
    >
      {icon === "language" ? (
        <svg className="h-6 w-6 flex-shrink-0 text-white/45" viewBox="0 0 24 24" fill="currentColor">
          <path d="M4 4h8a3 3 0 0 1 3 3v1h1a4 4 0 0 1 0 8h-.4l1.9 4h-2.3l-.7-1.5h-4.1L9.7 20H7.4l3.2-6.8A3.99 3.99 0 0 1 8 9.5V7H4V4Zm8 3v2.5A1.5 1.5 0 0 0 13.5 11H16a2 2 0 1 0 0-4h-4Zm-.7 9.5h2.4l-1.2-2.7-1.2 2.7Z" />
        </svg>
      ) : (
        <svg className="h-6 w-6 flex-shrink-0 text-white/45" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 21a8 8 0 0 1 16 0H4Z" />
        </svg>
      )}
      <span className="min-w-0 flex-1 truncate">{label}</span>
      <svg className="h-5 w-5 flex-shrink-0 text-white/85" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
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

// ─── Gender bottom sheet ──────────────────────────────────────────────────────

function GenderSheet({
  value,
  onChange,
  onClose,
  onStart,
}: {
  value: Gender;
  onChange: (g: Gender) => void;
  onClose: () => void;
  onStart: () => void;
}) {
  const [selected, setSelected] = useState<Gender>(value);
  const [superMatch, setSuperMatch] = useState(false);

  const select = (g: Gender) => { setSelected(g); onChange(g); };

  const options: Array<{ value: Gender; label: string; avatar: ReactNode }> = [
    {
      value: "any",
      label: "Les deux",
      avatar: (
        <svg viewBox="0 0 80 64" fill="none" className="h-16 w-20">
          <defs>
            <radialGradient id="gsBoth1" cx="35%" cy="15%" r="82%">
              <stop offset="0%" stopColor="#fff" /><stop offset="28%" stopColor="#ff8bf0" />
              <stop offset="65%" stopColor="#c300b8" /><stop offset="100%" stopColor="#350038" />
            </radialGradient>
            <radialGradient id="gsBoth2" cx="35%" cy="15%" r="82%">
              <stop offset="0%" stopColor="#fff" /><stop offset="28%" stopColor="#72dcff" />
              <stop offset="65%" stopColor="#0057ff" /><stop offset="100%" stopColor="#001448" />
            </radialGradient>
          </defs>
          {/* femme (derrière) */}
          <path d="M20 27c0-10 5-16 12-16s12 6 12 16c0 4 2 7 3 9-3 3-8 3-15 3s-12 0-15-3c1-2 3-5 3-9Z" fill="url(#gsBoth1)" stroke="#ff5ee8" strokeWidth="1.5"/>
          <path d="M8 55c3-9 9-13 18-13s15 4 18 13" fill="url(#gsBoth1)" stroke="#ff5ee8" strokeWidth="1.5" strokeLinecap="round"/>
          {/* homme (devant) */}
          <circle cx="52" cy="22" r="10" fill="url(#gsBoth2)" stroke="#37c8ff" strokeWidth="1.5"/>
          <path d="M34 55c3-10 9-15 18-15s15 5 18 15" fill="url(#gsBoth2)" stroke="#37c8ff" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      ),
    },
    {
      value: "female",
      label: "Femme",
      avatar: (
        <svg viewBox="0 0 64 64" fill="none" className="h-16 w-16">
          <defs>
            <radialGradient id="gsFem" cx="35%" cy="15%" r="82%">
              <stop offset="0%" stopColor="#fff" /><stop offset="28%" stopColor="#ff8bf0" />
              <stop offset="65%" stopColor="#c300b8" /><stop offset="100%" stopColor="#350038" />
            </radialGradient>
          </defs>
          <path d="M18 29c0-11 6-18 14-18s14 7 14 18c0 5 3 8 4 11-4 4-10 4-18 4s-14 0-18-4c1-3 4-6 4-11Z" fill="url(#gsFem)" stroke="#ff5ee8" strokeWidth="1.8"/>
          <path d="M12 58c3.3-10 10.4-15.5 20-15.5S48.7 48 52 58" fill="url(#gsFem)" stroke="#ff5ee8" strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
      ),
    },
    {
      value: "male",
      label: "Homme",
      avatar: (
        <svg viewBox="0 0 64 64" fill="none" className="h-16 w-16">
          <defs>
            <radialGradient id="gsMal" cx="35%" cy="15%" r="82%">
              <stop offset="0%" stopColor="#fff" /><stop offset="28%" stopColor="#72dcff" />
              <stop offset="65%" stopColor="#0057ff" /><stop offset="100%" stopColor="#001448" />
            </radialGradient>
          </defs>
          <circle cx="32" cy="22" r="11.5" fill="url(#gsMal)" stroke="#37c8ff" strokeWidth="1.8"/>
          <path d="M10 58c3.7-11.5 11.2-17.5 22-17.5S50.3 46.5 54 58" fill="url(#gsMal)" stroke="#37c8ff" strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
      ),
    },
  ];

  return (
    <div className="absolute inset-0 z-[70] flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative flex flex-col rounded-t-3xl bg-[#1c1c1e] text-white shadow-2xl overflow-hidden">
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full bg-white/20" />
        </div>

        <div className="px-5 pb-2">
          <h2 className="pt-3 pb-1 text-xl font-black">Préférence de genre</h2>
          <p className="text-sm text-white/50">Sélectionne le genre que tu préfères</p>
        </div>

        <div className="px-5 pb-3">
          {/* Matcher avec */}
          <div className="mb-4 flex items-center justify-between">
            <span className="text-base font-black">Matcher avec</span>
          </div>

          {/* Cards */}
          <div className="grid grid-cols-3 gap-3">
            {options.map((opt) => {
              const active = selected === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => select(opt.value)}
                  className={`flex flex-col items-center justify-end gap-2 rounded-2xl pb-3 pt-4 transition active:scale-[0.97] ${
                    active
                      ? "bg-[#2d6ade]/20 ring-2 ring-[#2d6ade]"
                      : "bg-white/6 ring-1 ring-white/10"
                  }`}
                >
                  {opt.avatar}
                  <span className={`text-sm font-black ${active ? "text-white" : "text-white/50"}`}>
                    {opt.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Super Match */}
          <div className="mt-5 flex items-start gap-3">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-yellow-400/20">
              <span className="text-base">⚡</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-black">Super Match</span>
              </div>
              <p className="mt-0.5 text-xs leading-snug text-white/40">
                La Super Rencontre trouve des personnes avec lesquelles vous aurez plus de chances de cliquer.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSuperMatch((v) => !v)}
              className={`mt-0.5 flex-shrink-0 h-6 w-11 rounded-full transition-colors ${superMatch ? "bg-[#2d6ade]" : "bg-white/20"}`}
            >
              <div className={`h-5 w-5 rounded-full bg-white shadow transition-transform mt-0.5 mx-0.5 ${superMatch ? "translate-x-5" : "translate-x-0"}`} />
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="px-5 pb-8 pt-3 border-t border-white/8">
          <button
            type="button"
            onClick={onStart}
            className="relative w-full overflow-hidden rounded-full py-4 text-lg font-black text-white btn-swipe"
            style={{ background: "#2d6ade" }}
          >
            Lancer un chat vidéo
          </button>
          <button
            type="button"
            onClick={onClose}
            className="mt-3 w-full py-2 text-sm font-semibold text-white/40"
          >
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Country bottom sheet ─────────────────────────────────────────────────────

const COUNTRY_LIST: Array<{ value: Exclude<Country, "any">; label: string }> = [
  { value: "DZ", label: "Algérie" },
  { value: "MA", label: "Maroc" },
  { value: "TN", label: "Tunisie" },
  { value: "BE", label: "Belgique" },
  { value: "FR", label: "France" },
  { value: "CH", label: "Suisse" },
  { value: "CA", label: "Canada" },
  { value: "US", label: "États-Unis" },
  { value: "GB", label: "Royaume-Uni" },
  { value: "DE", label: "Allemagne" },
  { value: "ES", label: "Espagne" },
  { value: "IT", label: "Italie" },
];

type CountryMode = "recommended" | "worldwide" | "france-plus" | Exclude<Country, "any">;

function valueToMode(value: Country, profileCountry: Exclude<Country, "any">): CountryMode {
  if (value === "any") return "worldwide";
  if (value === profileCountry) return "recommended";
  // "France et autres pays" : FR sélectionné alors que le profil n'est pas FR
  if (value === "FR" && profileCountry !== "FR") return "france-plus";
  return value as Exclude<Country, "any">;
}

function modeToValue(mode: CountryMode, profileCountry: Exclude<Country, "any">): Country {
  if (mode === "recommended") return profileCountry;
  if (mode === "worldwide") return "any";
  if (mode === "france-plus") return "FR";
  return mode;
}

function CountrySheet({
  value,
  profileCountry,
  onChange,
  onClose,
  onStart,
}: {
  value: Country;
  profileCountry: Exclude<Country, "any">;
  onChange: (c: Country) => void;
  onClose: () => void;
  onStart: () => void;
}) {
  const [mode, setMode] = useState<CountryMode>(() => valueToMode(value, profileCountry));

  const select = (m: CountryMode) => {
    setMode(m);
    onChange(modeToValue(m, profileCountry));
  };

  function Radio({ active }: { active: boolean }) {
    return (
      <span className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-2 transition-colors ${active ? "border-[#2d6ade] bg-[#2d6ade]" : "border-white/30"}`}>
        {active && <span className="h-2.5 w-2.5 rounded-full bg-white" />}
      </span>
    );
  }

  return (
    <div className="absolute inset-0 z-[70] flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative flex max-h-[88dvh] flex-col rounded-t-3xl bg-[#1c1c1e] text-white shadow-2xl overflow-hidden">
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="h-1 w-10 rounded-full bg-white/20" />
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-4 scrollbar-hide">
          <h2 className="py-4 text-xl font-black">Choix du pays</h2>

          {/* ── Presets ── */}
          <div className="space-y-1">

            {/* Recommandé */}
            <button type="button" onClick={() => select("recommended")}
              className="flex w-full items-center gap-3 rounded-2xl px-4 py-4 transition active:bg-white/5">
              <Radio active={mode === "recommended"} />
              <span className={`text-base font-bold ${mode === "recommended" ? "text-white" : "text-white/70"}`}>
                Recommandé
              </span>
            </button>

            {/* Mondial */}
            <button type="button" onClick={() => select("worldwide")}
              className="flex w-full items-center gap-3 rounded-2xl px-4 py-4 transition active:bg-white/5">
              <Radio active={mode === "worldwide"} />
              <span className={`text-base font-bold ${mode === "worldwide" ? "text-white" : "text-white/70"}`}>
                Mondial
              </span>
            </button>

            {/* France et autres pays — masqué si le profil est déjà FR */}
            {profileCountry !== "FR" && <button type="button" onClick={() => select("france-plus")}
              className="flex w-full items-start gap-3 rounded-2xl px-4 py-4 transition active:bg-white/5">
              <span className="mt-0.5"><Radio active={mode === "france-plus"} /></span>
              <div className="min-w-0 flex-1 text-left">
                <div className={`text-base font-bold ${mode === "france-plus" ? "text-white" : "text-white/70"}`}>
                  France et autres pays
                </div>
                <div className="mt-0.5">
                  <span className="text-xs font-bold text-[#2d6ade]">Recommandé</span>
                </div>
                <div className="mt-0.5 text-xs text-white/40 leading-snug">
                  Tu pourrais matcher avec des personnes d'autres pays.
                </div>
              </div>
              <div className={`mt-1 flex-shrink-0 h-6 w-11 rounded-full transition-colors ${mode === "france-plus" ? "bg-[#2d6ade]" : "bg-white/20"}`}>
                <div className={`h-5 w-5 rounded-full bg-white shadow transition-transform mt-0.5 mx-0.5 ${mode === "france-plus" ? "translate-x-5" : "translate-x-0"}`} />
              </div>
            </button>}
          </div>

          {/* ── Pays spécifiques ── */}
          <p className="mt-5 mb-3 text-base font-black">Sélectionne le pays de tes matchs</p>
          <div className="space-y-1">
            {COUNTRY_LIST.map((c) => (
              <button key={c.value} type="button" onClick={() => select(c.value)}
                className="flex w-full items-center gap-3 rounded-2xl px-4 py-4 transition active:bg-white/5">
                <Radio active={mode === c.value} />
                <span className={`text-base font-bold ${mode === c.value ? "text-white" : "text-white/70"}`}>
                  {c.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Actions ── */}
        <div className="flex-shrink-0 px-5 pb-8 pt-3 border-t border-white/8">
          <button type="button" onClick={onStart}
            className="relative w-full overflow-hidden rounded-full py-4 text-lg font-black text-white btn-swipe"
            style={{ background: "#2d6ade" }}>
            Lancer un chat vidéo
          </button>
          <button type="button" onClick={onClose}
            className="mt-3 w-full py-2 text-sm font-semibold text-white/40">
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}
