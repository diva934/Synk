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
import Controls from "./Controls";
import LogoMark from "./LogoMark";
import ReportModal from "./ReportModal";
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
  gemBalance: number;
  onSpendSwipe: () => boolean;
  onOpenShop: () => void;
  onEnd: () => void;
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
  gemBalance,
  onSpendSwipe,
  onOpenShop,
  onEnd,
  onlineCount,
}: Props) {
  const [status, setStatus]           = useState<ConnectionStatus>("searching");
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted]         = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isNextLoading, setIsNextLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [showChat, setShowChat]       = useState(false);
  const [showReport, setShowReport]   = useState(false);
  const [swipeDir, setSwipeDir]       = useState<"left" | "right" | null>(null);

  const timer = useTimer(status === "connected");

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

    const onSearching    = () => { setStatus("searching"); setRemoteStream(null); setChatMessages([]); };
    const onMatched      = async ({ roomId, isInitiator }: MatchedPayload) => {
      roomIdRef.current = roomId;
      iceCandidateBuffer.current = [];
      setChatMessages([]);
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
    socket.emit("next", matching);
    setTimeout(() => setIsNextLoading(false), 1200);
  }, [isNextLoading, onSpendSwipe, onOpenShop, socket, closePC, matching]);

  const toggleMute = useCallback(() => {
    const s = localStreamRef.current; if (!s) return;
    const next = !isMuted;
    s.getAudioTracks().forEach((t) => (t.enabled = !next));
    setIsMuted(next);
  }, [isMuted]);

  const toggleCamera = useCallback(() => {
    const s = localStreamRef.current; if (!s) return;
    const next = !isCameraOff;
    s.getVideoTracks().forEach((t) => (t.enabled = !next));
    setIsCameraOff(next);
  }, [isCameraOff]);

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
    <div className="app-screen flex flex-col overflow-hidden" style={{ background: "#111" }}>

      {/* ── Navbar ──────────────────────────────────────────────────────────── */}
      <nav
        className="grid flex-shrink-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 px-3 py-2 sm:px-5 sm:py-3"
        style={{ background: "#161616", borderBottom: "1px solid #222" }}
      >
        {/* Logo */}
        <div className="flex min-w-0 items-center gap-2 sm:gap-2.5">
          <LogoMark className="h-10 w-10 flex-shrink-0" />
          <span className="hidden truncate text-base font-bold text-white sm:block">RandomChat</span>
        </div>

        {/* Center: status + timer */}
        <div className="flex min-w-0 items-center justify-center text-xs sm:text-sm">
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
        <div className="flex min-w-0 items-center justify-end gap-1.5 sm:gap-3">
          <span className="hidden items-center gap-1.5 text-xs sm:flex" style={{ color: "#555" }}>
            <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
            {onlineCount} en ligne
          </span>
          <button
            onClick={() => setShowChat((v) => !v)}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              showChat ? "bg-[#2d6ade]/20 text-[#6da3f5]" : "text-white/40 hover:bg-white/5 hover:text-white/70"
            }`}
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-12 0c0 4.556 4.03 8.25 9 8.25a9.76 9.76 0 002.555-.337 5.97 5.97 0 005.01.577 4.48 4.48 0 01-.978-2.025C20.07 16.178 21 14.189 21 12c0-4.556-4.03-8.25-9-8.25S3 7.444 3 12z" />
            </svg>
            Chat
          </button>
        </div>
      </nav>

      {/* ── Main area ────────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden gap-3 p-0 md:p-3">

        {/* ── TWO BIG SQUARES SIDE BY SIDE ────────────────────────────────── */}
        <div
          className="relative flex flex-1 gap-0 md:gap-3"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* LEFT SQUARE — Local video (You) */}
          <div className="hidden md:relative md:block md:flex-1 md:min-w-0 md:overflow-hidden md:rounded-2xl" style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}>
            <VideoCard
              stream={localStream}
              mirror
              muted
              name="Vous"
              isMicOff={isMuted}
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
            className="relative flex-1 min-w-0 overflow-hidden md:rounded-2xl"
            style={{
              background: "#1a1a1a",
              border: "1px solid #2a2a2a",
              transition: swipeDir ? "transform 0.28s ease, opacity 0.28s ease" : undefined,
              transform: swipeDir === "left" ? "translateX(-110%)" : swipeDir === "right" ? "translateX(110%)" : undefined,
              opacity: swipeDir ? 0 : 1,
            }}
          >
            {/* Searching state */}
            {status === "searching" && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4" style={{ background: "#1a1a1a" }}>
                {/* Animated pulse rings */}
                <div className="relative flex items-center justify-center">
                  <div className="absolute h-24 w-24 animate-ping rounded-full opacity-10" style={{ background: "#2d6ade" }} />
                  <div className="absolute h-16 w-16 animate-ping rounded-full opacity-20 animation-delay-150" style={{ background: "#2d6ade" }} />
                  <div className="relative flex h-12 w-12 items-center justify-center rounded-full" style={{ background: "#2d6ade" }}>
                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                    </svg>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-white/60">Recherche d'un partenaire…</p>
                  <p className="mt-1 text-xs" style={{ color: "#444" }}>{onlineCount} utilisateur{onlineCount !== 1 ? "s" : ""} en ligne</p>
                </div>
              </div>
            )}

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

            <VideoCard
              stream={remoteStream}
              mirror={false}
              muted={false}
              name={status === "connected" ? "Partenaire" : undefined}
              className="h-full w-full"
            />

            {/* Swipe hint */}
            {status === "connected" && (
              <div className="absolute bottom-28 left-1/2 -translate-x-1/2 text-[10px] pointer-events-none md:hidden" style={{ color: "#777" }}>
                ← Swipe pour changer →
              </div>
            )}
          </div>

          <div
            className="absolute bottom-4 right-4 z-20 h-36 w-28 overflow-hidden rounded-2xl shadow-2xl md:hidden"
            style={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.18)" }}
          >
            <VideoCard
              stream={localStream}
              mirror
              muted
              name="Vous"
              isMicOff={isMuted}
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
      <Controls
        isMuted={isMuted}
        isCameraOff={isCameraOff}
        isNextLoading={isNextLoading}
        showChat={showChat}
        gemBalance={gemBalance}
        onToggleMute={toggleMute}
        onToggleCamera={toggleCamera}
        onNext={handleNext}
        onEnd={onEnd}
        onToggleChat={() => setShowChat((v) => !v)}
        onReport={() => setShowReport(true)}
      />

      {/* Safety footer */}
      <div className="flex-shrink-0 py-1 text-center text-[10px]" style={{ color: "#333", background: "#111" }}>
        Chiffré P2P · Aucun enregistrement · Respectez les autres
      </div>

      {showReport && <ReportModal onClose={() => setShowReport(false)} />}
    </div>
  );
}
