import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { io, Socket } from "socket.io-client";
import AgeGate from "./components/AgeGate";
import AuthPage from "./components/AuthPage";
import GemShopModal from "./components/GemShopModal";
import HomePage, { ProfileSheet, readProfileEditDraft, type ProfileEditDraft } from "./components/HomePage";
import LoginSuccessModal from "./components/LoginSuccessModal";
import ProfileSetupPage from "./components/ProfileSetupPage";
import SafariInstallPrompt from "./components/SafariInstallPrompt";
import VideoRoom from "./components/VideoRoom";
import { DEFAULT_MATCHING, hasCompleteProfile, sanitizeProfile } from "./lib/matching";
import { supabase } from "./lib/supabase";
import type { MatchingPreferences, MediaPreferences, MatchProfile } from "./types";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:3001";

type Page = "home" | "room";

const SWIPE_COST_BASE = 9;
const GENDER_FILTER_COST = 10;
const DAILY_REWARD = 1500;
const PENDING_PROFILE_KEY = "randomchat:pending-profile";

function getTodayKey(): string {
  const now = new Date();
  const jan1 = new Date(now.getFullYear(), 0, 1);
  const week = Math.ceil(((now.getTime() - jan1.getTime()) / 86400000 + jan1.getDay() + 1) / 7);
  return `${now.getFullYear()}-W${String(week).padStart(2, "0")}`;
}

function readStoredProfile(userId: string): MatchProfile | null {
  const storedProfile = localStorage.getItem(`randomchat:profile:${userId}`);
  if (!storedProfile) return null;

  try {
    return sanitizeProfile(JSON.parse(storedProfile));
  } catch {
    return null;
  }
}

function readPendingProfile(): MatchProfile | null {
  const pendingProfile = localStorage.getItem(PENDING_PROFILE_KEY);
  if (!pendingProfile) return null;

  try {
    return sanitizeProfile(JSON.parse(pendingProfile));
  } catch {
    return null;
  }
}


export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showAgeVerification, setShowAgeVerification] = useState(false);
  const [showShop, setShowShop] = useState(false);
  const [shopNotice, setShopNotice] = useState<string | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [page, setPage] = useState<Page>("home");
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [homeCameraRequested, setHomeCameraRequested] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [onlineCount, setOnlineCount] = useState(0);
  const [gemBalance, setGemBalance] = useState(0);
  const [dailyClaimDate, setDailyClaimDate] = useState<string | null>(null);
  const [matchingPrefs, setMatchingPrefs] = useState<MatchingPreferences>(DEFAULT_MATCHING);
  const [profileEdit, setProfileEdit] = useState<ProfileEditDraft>({});
  const [needsProfileSetup, setNeedsProfileSetup] = useState(false);

  const [socket, setSocket] = useState<Socket | null>(null);
  const [pendingPrefs, setPendingPrefs] = useState<MediaPreferences | null>(null);

  useEffect(() => {
    if (!supabase) {
      setAuthLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setAuthLoading(false);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!session) {
      socket?.disconnect();
      setSocket(null);
      setOnlineCount(0);
      setGemBalance(0);
      setShowShop(false);
      setShopNotice(null);
      setShowProfile(false);
      setDailyClaimDate(null);
      setMatchingPrefs(DEFAULT_MATCHING);
      setProfileEdit({});
      setShowAgeVerification(false);
      setNeedsProfileSetup(false);
      return;
    }

    if (!session.user.user_metadata?.age_verified) {
      setShowAgeVerification(true);
    }

    const storedGems = localStorage.getItem(`randomchat:gems:${session.user.id}`);
    setGemBalance(storedGems ? Number(storedGems) || 0 : 0);
    setDailyClaimDate(localStorage.getItem(`randomchat:daily-gems:${session.user.id}`));
    setProfileEdit(readProfileEditDraft(session.user.email));

    const pendingProfile = readPendingProfile();
    const storedProfile = readStoredProfile(session.user.id);
    const accountProfile = hasCompleteProfile(session.user.user_metadata)
      ? sanitizeProfile(session.user.user_metadata)
      : null;
    const profile = pendingProfile || storedProfile || accountProfile;

    if (profile) {
      setNeedsProfileSetup(false);
      localStorage.setItem(`randomchat:profile:${session.user.id}`, JSON.stringify(profile));
    } else {
      setNeedsProfileSetup(true);
    }

    if (pendingProfile && profile) {
      localStorage.removeItem(PENDING_PROFILE_KEY);
      void supabase?.auth.updateUser({ data: profile });
    }

    const storedMatching = localStorage.getItem(`randomchat:matching:${session.user.id}`);
    if (storedMatching) {
      try {
        const parsedMatching = JSON.parse(storedMatching) as MatchingPreferences;
        setMatchingPrefs({
          profile: profile || DEFAULT_MATCHING.profile,
          filters: parsedMatching.filters || DEFAULT_MATCHING.filters,
        });
      } catch {
        setMatchingPrefs({ ...DEFAULT_MATCHING, profile: profile || DEFAULT_MATCHING.profile });
      }
    } else {
      setMatchingPrefs({ ...DEFAULT_MATCHING, profile: profile || DEFAULT_MATCHING.profile });
    }

    let nextSocket: Socket | null = null;

    try {
      nextSocket = io(SOCKET_URL, {
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 500,
        reconnectionDelayMax: 3000,
      });
      setSocket(nextSocket);
      nextSocket.on("online-count", (count: number) => setOnlineCount(count));
    } catch (error) {
      console.error("[socket] connection setup failed:", error);
    }

    return () => {
      nextSocket?.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  const handleBuyGemPack = (gems: number) => {
    if (!session) return;
    setShopNotice(null);
    setGemBalance((current) => {
      const next = current + gems;
      localStorage.setItem(`randomchat:gems:${session.user.id}`, String(next));
      return next;
    });
  };

  const handleClaimDailyGems = () => {
    if (!session) return;

    const today = getTodayKey();
    if (dailyClaimDate === today) return;

    setShopNotice(null);
    setGemBalance((current) => {
      const next = current + DAILY_REWARD;
      localStorage.setItem(`randomchat:gems:${session.user.id}`, String(next));
      return next;
    });
    localStorage.setItem(`randomchat:daily-gems:${session.user.id}`, today);
    setDailyClaimDate(today);
  };

  const handleSpendSwipe = () => {
    const swipeCost = SWIPE_COST_BASE + (matchingPrefs.filters.gender !== "any" ? GENDER_FILTER_COST : 0);
    if (!session || gemBalance < swipeCost) return false;

    setGemBalance((current) => {
      if (current < swipeCost) return current;
      const next = current - swipeCost;
      localStorage.setItem(`randomchat:gems:${session.user.id}`, String(next));
      return next;
    });
    return true;
  };

  const openShop = (notice?: string | null) => {
    setShopNotice(typeof notice === "string" ? notice : null);
    setShowShop(true);
  };

  const handleStart = async (prefs: MediaPreferences) => {
    if (session) {
      setMatchingPrefs(prefs.matching);
      localStorage.setItem(`randomchat:matching:${session.user.id}`, JSON.stringify(prefs.matching));
    }

    // Si vérifié dans les 24h, bypass direct sans afficher AgeGate
    const until = localStorage.getItem("synk_age_verified_until");
    if (until && Date.now() < Number(until)) {
      void doStartRoom(prefs);
      return;
    }

    // Sinon, afficher AgeGate
    setPendingPrefs(prefs);
  };

  const doStartRoom = async (prefs: MediaPreferences) => {
    setMediaError(null);
    try {
      localStream?.getTracks().forEach((track) => track.stop());

      const stream =
        prefs.video || prefs.audio
          ? await navigator.mediaDevices.getUserMedia({
              video: prefs.video
                ? { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" }
                : false,
              audio: prefs.audio
                ? { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
                : false,
            })
          : new MediaStream();

      stream.getTracks().forEach((track) => { track.enabled = true; });
      setLocalStream(stream);
      setHomeCameraRequested(stream.getVideoTracks().length > 0);
      setPage("room");
    } catch (err) {
      setLocalStream(null);
      setHomeCameraRequested(false);
      if (err instanceof Error) {
        if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
          setMediaError("Accès à la caméra/micro refusé. Autorisez l'accès dans les paramètres du navigateur, puis réessayez.");
        } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
          setMediaError("Aucune caméra ou microphone trouvé sur cet appareil.");
        } else if (err.name === "NotReadableError") {
          setMediaError("La caméra/micro est déjà utilisé par une autre application. Fermez-la et réessayez.");
        } else {
          setMediaError(`Impossible d'accéder aux médias : ${err instanceof Error ? err.message : String(err)}`);
        }
      }
    }
  };

  const handleAgeVerified = () => {
    const prefs = pendingPrefs;
    setPendingPrefs(null);
    if (prefs) void doStartRoom(prefs);
  };

  const handleAgeRejected = (_reason: string) => {
    // AgeGate garde l'écran de blocage affiché — on ne ferme pas
  };

  const handlePrepareHomeCamera = async () => {
    if (page !== "home") return;
    if (localStream?.getVideoTracks().some((track) => track.readyState === "live")) return;
    if (homeCameraRequested) return;

    setHomeCameraRequested(true);
    setMediaError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
        audio: false,
      });
      setLocalStream(stream);
    } catch (err) {
      setHomeCameraRequested(false);
      if (err instanceof Error) {
        if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
          setMediaError(
            "AccÃ¨s Ã  la camÃ©ra refusÃ©. Autorisez l'accÃ¨s dans les paramÃ¨tres du navigateur, puis rÃ©essayez."
          );
        } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
          setMediaError("Aucune camÃ©ra trouvÃ©e sur cet appareil.");
        } else if (err.name === "NotReadableError") {
          setMediaError(
            "La camÃ©ra est dÃ©jÃ  utilisÃ©e par une autre application. Fermez-la et rÃ©essayez."
          );
        } else {
          setMediaError(`Impossible d'accÃ©der Ã  la camÃ©ra : ${err.message}`);
        }
      }
    }
  };

  const handleEndCall = () => {
    // Stop all tracks to release the camera/mic
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }
    setLocalStream(null);
    setHomeCameraRequested(false);
    setPage("home");
  };

  const handleSignOut = async () => {
    handleEndCall();
    await supabase?.auth.signOut();
  };

  const handleCompleteProfile = (profile: MatchProfile) => {
    if (!session) return;

    localStorage.setItem(`randomchat:profile:${session.user.id}`, JSON.stringify(profile));
    setMatchingPrefs((current) => ({ ...current, profile }));
    setNeedsProfileSetup(false);
    void supabase?.auth.updateUser({ data: profile });
  };

  if (authLoading) {
    return <div className="app-screen bg-[#111]" />;
  }

  if (!session) {
    return (
      <div className="app-screen bg-[#111]">
        <AuthPage />
        <SafariInstallPrompt />
      </div>
    );
  }

  if (needsProfileSetup) {
    return (
      <div className="app-screen bg-[#111]">
        <ProfileSetupPage onComplete={handleCompleteProfile} />
        <SafariInstallPrompt />
      </div>
    );
  }

  return (
    <div className="app-screen bg-gray-950">
      {page === "home" || !socket ? (
        <HomePage
          onStart={handleStart}
          onPrepareCamera={handlePrepareHomeCamera}
          previewStream={localStream}
          mediaError={mediaError}
          onClearMediaError={() => { setMediaError(null); setHomeCameraRequested(false); }}
          onlineCount={onlineCount}
          userEmail={session.user.email}
          gemBalance={gemBalance}
          matchingPrefs={matchingPrefs}
          canClaimDailyGems={dailyClaimDate !== getTodayKey()}
          dailyReward={DAILY_REWARD}
          onBuyGemPack={handleBuyGemPack}
          onClaimDailyGems={handleClaimDailyGems}
          profileEdit={profileEdit}
          onProfileEditSave={setProfileEdit}
          onSignOut={handleSignOut}
        />
      ) : (
        <VideoRoom
          socket={socket}
          localStream={localStream}
          matching={matchingPrefs}
          onSpendSwipe={handleSpendSwipe}
          onOpenShop={openShop}
          onOpenProfile={() => setShowProfile(true)}
          profilePhotoUrl={profileEdit.primaryPhoto}
          onlineCount={onlineCount}
        />
      )}
      {/* AgeGate : affiché entre le clic "Démarrer" et la mise en relation */}
      {pendingPrefs && (
        <AgeGate
          onVerified={handleAgeVerified}
          onRejected={handleAgeRejected}
        />
      )}
      {showAgeVerification && (
        <LoginSuccessModal onContinue={() => {
          setShowAgeVerification(false);
          void supabase?.auth.updateUser({ data: { age_verified: true } });
        }} />
      )}
      {showShop && (
        <GemShopModal
          notice={shopNotice}
          balance={gemBalance}
          canClaimDaily={dailyClaimDate !== getTodayKey()}
          dailyReward={DAILY_REWARD}
          onBuy={handleBuyGemPack}
          onClaimDaily={handleClaimDailyGems}
          onClose={() => {
            setShowShop(false);
            setShopNotice(null);
          }}
        />
      )}
      {showProfile && (
        <ProfileSheet
          userEmail={session.user.email}
          matching={matchingPrefs}
          onlineCount={onlineCount}
          initialEdit={profileEdit}
          onProfileEditSave={setProfileEdit}
          onClose={() => setShowProfile(false)}
          onSignOut={handleSignOut}
        />
      )}
      <SafariInstallPrompt />
    </div>
  );
}
