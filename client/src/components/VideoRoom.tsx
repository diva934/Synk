import { useCallback, useEffect, useRef, useState } from "react";
import type { Socket } from "socket.io-client";
import type {
  AnswerPayload,
  ChatMessage,
  ConnectionStatus,
  IceCandidatePayload,
  MatchingPreferences,
  MatchedPayload,
  OfferPayload,
} from "../types";
import Chat from "./Chat";
import GenderAvatar from "./GenderAvatar";
import LogoMark from "./LogoMark";
import VideoCard from "./VideoCard";

// ─── ICE config ───────────────────────────────────────────────────────────────
const ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

interface Props {
  socket: Socket;
  localStream: MediaStream | null;
  matching: MatchingPreferences;
  onSpendSwipe: () => boolean;
  onOpenShop: () => void;
  onOpenProfile: () => void;
  onlineCount: number;
}

// ─── Timer ────────────────────────────────────────────────────────────────────
function useTimer(running: boolean) {
  const [s, setS] = useState(0);
  useEffect(() => {
    if (!running) { setS(0); return; }
    const id = setInterval(() => setS((x) => x + 1), 1000);
    return () => clearInterval(id);
  }, [running]);
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function VideoRoom({
  socket,
  localStream,
  matching,
  onSpendSwipe,
  onOpenShop,
  onOpenProfile,
  onlineCount,
}: Props) {
  const [status, setStatus]           = useState<ConnectionStatus>("searching");
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMuted]                    = useState(false);
  const [isCameraOff]                = useState(false);
  const [isNextLoading, setIsNextLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [showChat, setShowChat]       = useState(false);
  const [swipeDir, setSwipeDir]       = useState<"left" | "right" | null>(null);
  const [isPartnerLarge, setIsPartnerLarge] = useState(false);

  const timer = useTimer(status === "connected");
  const localAvatarGender = matching.profile.gender;
  const partnerAvatarGender = matching.filters.gender === "any" ? "unknown" : matching.filters.gender;
  const canSwapFrames = status === "connected" || status === "searching";
  const largeStream = isPartnerLarge ? remoteStream : localStream;
  const largeIsLocal = !isPartnerLarge;
  const smallStream = isPartnerLarge ? localStream : remoteStream;
  const smallIsLocal = isPartnerLarge;

  // refs
  const localStreamRef     = useRef<MediaStream | null>(localStream);
  const pcRef              = useRef<RTCPeerConnection | null>(null);
  const roomIdRef          = useRef<string | null>(null);
  const iceCandidateBuffer = useRef<RTCIceCandidateInit[]>([]);

  useEffect(() => { localStreamRef.current = localStream; }, [localStream]);

  useEffect(() => {
    let wakeLock: { release: () => Promise<void> } | null = null;

    const requestWakeLock = async () => {
      const wakeLockApi = (
        navigator as Navigator & {
          wakeLock?: { request: (type: "screen") => Promise<{ release: () => Promise<void> }> };
        }
      ).wakeLock;

      if (!wakeLockApi || document.visibilityState !== "visible") return;
      try {
        wakeLock = await wakeLockApi.request("screen");
      } catch {
        wakeLock = null;
      }
    };

    const restoreTracks = () => {
      const stream = localStreamRef.current;
      if (!stream) return;
      stream.getAudioTracks().forEach((track) => {
        track.enabled = !isMuted;
      });
      stream.getVideoTracks().forEach((track) => {
        track.enabled = !isCameraOff;
      });
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        restoreTracks();
        void requestWakeLock();
      }
    };

    void requestWakeLock();
    window.addEventListener("focus", restoreTracks);
    window.addEventListener("pageshow", restoreTracks);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("focus", restoreTracks);
      window.removeEventListener("pageshow", restoreTracks);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      void wakeLock?.release();
    };
  }, [isCameraOff, isMuted]);

  // ── PC helpers ──────────────────────────────────────────────────────────────
  const closePC = useCallback((clearBufferedIce = true) => {
    if (pcRef.current) {
      pcRef.current.ontrack = null;
      pcRef.current.onicecandidate = null;
      pcRef.current.onconnectionstatechange = null;
      pcRef.current.close();
      pcRef.current = null;
    }
    if (clearBufferedIce) iceCandidateBuffer.current = [];
    setRemoteStream(null);
  }, []);

  const createPC = useCallback((): RTCPeerConnection => {
    closePC(false);
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    const stream = localStreamRef.current;
    if (stream) stream.getTracks().forEach((t) => pc.addTrack(t, stream));
    pc.ontrack = (e) => {
      const [stream] = e.streams;
      if (stream) {
        setRemoteStream(stream);
        setStatus("connected");
      }
    };
    pc.onicecandidate = (e) => {
      if (e.candidate && roomIdRef.current)
        socket.emit("ice-candidate", { candidate: e.candidate.toJSON(), roomId: roomIdRef.current });
    };
    pc.onconnectionstatechange = () => {
      if (pcRef.current === pc && ["disconnected", "failed", "closed"].includes(pc.connectionState)) {
        setStatus("partner-left"); closePC();
      }
    };
    pcRef.current = pc;
    return pc;
  }, [socket, closePC]);

  const flushICE = useCallback(async (pc: RTCPeerConnection) => {
    for (const c of iceCandidateBuffer.current)
      await pc.addIceCandidate(new RTCIceCandidate(c)).catch(() => {});
    iceCandidateBuffer.current = [];
  }, []);

  // ── Socket events ───────────────────────────────────────────────────────────
  useEffect(() => {
    socket.emit("join-queue", matching);

    const onSearching    = () => { setStatus("searching"); setRemoteStream(null); setChatMessages([]); setIsPartnerLarge(false); };
    const onMatched      = async ({ roomId, isInitiator }: MatchedPayload) => {
      roomIdRef.current = roomId;
      iceCandidateBuffer.current = [];
      setChatMessages([]);
      setIsPartnerLarge(false);
      setStatus("searching");
      if (isInitiator) {
        const pc = createPC();
        try {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.emit("offer", { offer: pc.localDescription, roomId });
        } catch (e) { console.error("[webrtc] offer:", e); }
      }
    };
    const onOffer        = async ({ offer }: OfferPayload) => {
      const roomId = roomIdRef.current; if (!roomId) return;
      const pc = createPC();
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        await flushICE(pc);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit("answer", { answer: pc.localDescription, roomId });
      } catch (e) { console.error("[webrtc] answer:", e); }
    };
    const onAnswer       = async ({ answer }: AnswerPayload) => {
      const pc = pcRef.current; if (!pc) return;
      try { await pc.setRemoteDescription(new RTCSessionDescription(answer)); await flushICE(pc); }
      catch (e) { console.error("[webrtc] setAnswer:", e); }
    };
    const onIceCandidate = async ({ candidate }: IceCandidatePayload) => {
      const pc = pcRef.current;
      if (!pc) {
        iceCandidateBuffer.current.push(candidate);
        return;
      }
      if (pc.remoteDescription) await pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => {});
      else iceCandidateBuffer.current.push(candidate);
    };
    const onPartnerLeft  = () => {
      closePC(); roomIdRef.current = null; setStatus("partner-left");
      setTimeout(() => socket.emit("join-queue", matching), 2000);
    };
    const onChatMessage  = ({ message }: { message: string }) =>
      setChatMessages((p) => [...p, { id: Date.now().toString(), from: "partner", text: message, timestamp: Date.now() }]);

    socket.on("searching",     onSearching);
    socket.on("matched",       onMatched);
    socket.on("offer",         onOffer);
    socket.on("answer",        onAnswer);
    socket.on("ice-candidate", onIceCandidate);
    socket.on("partner-left",  onPartnerLeft);
    socket.on("chat-message",  onChatMessage);

    return () => {
      ["searching","matched","offer","answer","ice-candidate","partner-left","chat-message"]
        .forEach((ev) => socket.off(ev));
      socket.emit("leave-queue");
      closePC();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, matching]);

  // ── Actions ─────────────────────────────────────────────────────────────────
  const handleNext = useCallback(() => {
    if (isNextLoading) return;
    if (!onSpendSwipe()) {
      onOpenShop();
      return;
    }

    setIsNextLoading(true);
    closePC(); roomIdRef.current = null; setChatMessages([]);
    setIsPartnerLarge(false);
    socket.emit("next", matching);
    setTimeout(() => setIsNextLoading(false), 1200);
  }, [isNextLoading, onSpendSwipe, onOpenShop, socket, closePC, matching]);

  const swapFrames = useCallback(() => {
    if (!canSwapFrames) return;
    setIsPartnerLarge((current) => !current);
  }, [canSwapFrames]);

  const sendMessage = useCallback((text: string) => {
    const roomId = roomIdRef.current; if (!roomId) return;
    socket.emit("chat-message", { message: text, roomId });
    setChatMessages((p) => [...p, { id: Date.now().toString(), from: "me", text, timestamp: Date.now() }]);
  }, [socket]);

  // ── Swipe (mobile) ──────────────────────────────────────────────────────────
  const touchStartX = useRef<number | null>(null);
  const handleTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd   = (e: React.TouchEvent) => {
    if (touchStartX.current === null || isNextLoading) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(delta) < 80) return;
    setSwipeDir(delta < 0 ? "left" : "right");
    setTimeout(() => { setSwipeDir(null); handleNext(); }, 280);
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="app-screen relative overflow-hidden bg-[#05070b]">

      {/* ── Navbar ──────────────────────────────────────────────────────────── */}
      <nav
        className="absolute inset-x-0 top-0 z-30 flex items-center gap-2.5 px-6 py-5"
      >
        {/* Logo */}
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          <LogoMark className="h-11 w-11 flex-shrink-0" />
        </div>

        {/* Center: status + timer */}
        <div className="hidden">
          <span className={`flex min-w-0 items-center gap-1.5 truncate ${
            status === "connected" ? "text-green-400" :
            status === "partner-left" ? "text-red-400" : "text-yellow-400"
          }`}>
            <span className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${
              status === "connected" ? "bg-green-400" :
              status === "partner-left" ? "bg-red-400" : "bg-yellow-400 animate-pulse"
            }`} />
            {status === "searching"     && "Recherche…"}
            {status === "connected"     && `Connecté · ${timer}`}
            {status === "partner-left"  && "Déconnecté — Recherche…"}
            {status === "error"         && "Erreur"}
          </span>
        </div>

        {/* Right: online + chat toggle */}
        <div className="flex items-center gap-2">
          <span className="hidden" style={{ color: "#555" }}>
            <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
            {onlineCount} en ligne
          </span>
          <button
            type="button"
            onClick={onOpenShop}
            className="rounded-full bg-white px-5 py-2.5 text-sm font-black text-black shadow-2xl shadow-black/25 transition hover:bg-white/90"
            title="Boutique"
          >
            Shop
          </button>
          <button
            type="button"
            onClick={onOpenProfile}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white shadow-2xl shadow-black/25 backdrop-blur-xl transition hover:bg-white/15"
            title="Profil"
          >
            <GenderAvatar gender={matching.profile.gender} className="h-8 w-8" />
          </button>
        </div>
      </nav>

      {/* ── Main area ────────────────────────────────────────────────────────── */}
      <div className="absolute inset-0 flex overflow-hidden">

        {/* ── TWO BIG SQUARES SIDE BY SIDE ────────────────────────────────── */}
        <div
          className="relative flex flex-1"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* LEFT SQUARE — Local video (You) */}
          <div className="hidden">
            <VideoCard
              stream={localStream}
              mirror
              muted
              name="Vous"
              isMicOff={isMuted}
              avatarGender={localAvatarGender}
              className="h-full w-full"
            />

            {/* Camera off overlay */}
            {isCameraOff && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2" style={{ background: "#1a1a1a" }}>
                <div className="flex h-20 w-20 items-center justify-center rounded-full" style={{ background: "#2a2a2a" }}>
                  <svg className="h-9 w-9 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.553-2.069A1 1 0 0121 9.382v5.236a1 1 0 01-1.447.894L15.75 13.5M12 18.75H4.5A2.25 2.25 0 012.25 16.5v-9A2.25 2.25 0 014.5 5.25h9A2.25 2.25 0 0115.75 7.5" />
                    <line x1="3" y1="3" x2="21" y2="21" strokeLinecap="round"/>
                  </svg>
                </div>
                <span className="text-sm" style={{ color: "#555" }}>Caméra désactivée</span>
              </div>
            )}
          </div>

          {/* RIGHT SQUARE — Remote video (Partner) */}
          <div
            className="relative flex-1 min-w-0 overflow-hidden"
            style={{
              background: "#1a1a1a",
              transition: swipeDir ? "transform 0.28s ease, opacity 0.28s ease" : undefined,
              transform: swipeDir === "left" ? "translateX(-110%)" : swipeDir === "right" ? "translateX(110%)" : undefined,
              opacity: swipeDir ? 0 : 1,
            }}
          >
            <VideoCard
              stream={largeStream}
              mirror={largeIsLocal}
              muted={largeIsLocal}
              name={largeIsLocal ? "Vous" : "Partenaire"}
              searching={status === "searching" && !largeIsLocal && !largeStream}
              avatarGender={largeIsLocal ? localAvatarGender : partnerAvatarGender}
              className="h-full w-full"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/45 via-black/5 to-black/65" />

            {/* Partner left overlay */}
            {status === "partner-left" && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3" style={{ background: "rgba(0,0,0,0.85)" }}>
                <div className="flex h-14 w-14 items-center justify-center rounded-full" style={{ background: "#2a2a2a" }}>
                  <svg className="h-7 w-7 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                  </svg>
                </div>
                <p className="text-sm text-white/50">Partenaire déconnecté</p>
                <p className="text-xs" style={{ color: "#444" }}>Recherche automatique dans 2s…</p>
              </div>
            )}

            {/* Swipe hint */}
            {status === "connected" && (
              <div className="absolute bottom-28 left-1/2 -translate-x-1/2 text-[10px] pointer-events-none md:hidden" style={{ color: "#777" }}>
                ← Swipe pour changer →
              </div>
            )}
          </div>

          <div className="absolute bottom-7 right-5 z-20 h-48 w-[7.5rem] overflow-hidden rounded-[32px] border border-white/20 bg-[#1a1a1a] shadow-2xl shadow-black/45 sm:h-60 sm:w-[9.5rem] sm:rounded-[36px]">
            <VideoCard
              stream={smallStream}
              mirror={smallIsLocal}
              muted={smallIsLocal}
              name={smallIsLocal ? "Vous" : "Partenaire"}
              isMicOff={smallIsLocal ? isMuted : false}
              searching={status === "searching" && !smallIsLocal && !smallStream}
              avatarGender={smallIsLocal ? localAvatarGender : partnerAvatarGender}
              className="h-full w-full"
            />

            {isCameraOff && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-1" style={{ background: "#1a1a1a" }}>
                <div className="flex h-10 w-10 items-center justify-center rounded-full" style={{ background: "#2a2a2a" }}>
                  <svg className="h-5 w-5 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.553-2.069A1 1 0 0121 9.382v5.236a1 1 0 01-1.447.894L15.75 13.5M12 18.75H4.5A2.25 2.25 0 012.25 16.5v-9A2.25 2.25 0 014.5 5.25h9A2.25 2.25 0 0115.75 7.5" />
                    <line x1="3" y1="3" x2="21" y2="21" strokeLinecap="round"/>
                  </svg>
                </div>
                <span className="text-[10px]" style={{ color: "#555" }}>Camera off</span>
              </div>
            )}
          </div>
        </div>

        <div className="absolute left-4 top-1/2 z-30 flex -translate-y-1/2 flex-col items-center gap-2.5 rounded-[999px] border border-white/10 bg-black/40 px-2.5 py-3.5 shadow-2xl shadow-black/40 backdrop-blur-2xl">
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-full text-white transition hover:bg-white/10"
            title="Effets"
          >
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 20 14.5 9.5M13 3l1.2 3.1L17.5 7l-3.3.9L13 11l-1.2-3.1L8.5 7l3.3-.9L13 3ZM19 12l.8 2.2L22 15l-2.2.8L19 18l-.8-2.2L16 15l2.2-.8L19 12Z" />
            </svg>
          </button>
          <button
            type="button"
            onClick={swapFrames}
            disabled={!canSwapFrames}
            className="flex h-10 w-10 items-center justify-center rounded-full text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-35"
            title="Inverser les cadres"
            aria-label="Inverser les cadres video"
          >
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 3H4a1 1 0 0 0-1 1v4m0-5 7 7M16 21h4a1 1 0 0 0 1-1v-4m0 5-7-7" />
            </svg>
          </button>
          <span className="h-px w-7 bg-white/20" />
          <button
            type="button"
            onClick={onOpenShop}
            className="flex h-10 w-10 items-center justify-center rounded-full text-white transition hover:bg-white/10"
            title="Shop"
          >
            <svg className="h-7 w-7" viewBox="0 0 64 64" fill="none">
              <path d="M13 24c0-6 5-11 11-11h16c6 0 11 5 11 11v21c0 4-3 7-7 7H20c-4 0-7-3-7-7V24Z" fill="#2d6ade" />
              <path d="M23 24v-2a9 9 0 0 1 18 0v2" stroke="white" strokeWidth="5" strokeLinecap="round" />
              <path d="M20 35h24M20 43h18" stroke="white" strokeOpacity=".75" strokeWidth="4" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Chat panel (right side when open) */}
        {showChat && (
          <div className="hidden sm:flex flex-col rounded-2xl overflow-hidden flex-shrink-0" style={{ width: 280 }}>
            <Chat
              messages={chatMessages}
              onSend={sendMessage}
              disabled={status !== "connected"}
              onClose={() => setShowChat(false)}
            />
          </div>
        )}
      </div>

      {/* Mobile chat */}
      {showChat && (
        <div className="sm:hidden flex-shrink-0 mx-3 mb-2 rounded-xl overflow-hidden" style={{ height: 200 }}>
          <Chat messages={chatMessages} onSend={sendMessage} disabled={status !== "connected"} onClose={() => setShowChat(false)} />
        </div>
      )}

      {/* ── Bottom toolbar ───────────────────────────────────────────────────── */}
    </div>
  );
}
