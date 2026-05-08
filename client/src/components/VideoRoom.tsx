import { useCallback, useEffect, useRef, useState } from "react";
import type { Socket } from "socket.io-client";
import type {
  AnswerPayload,
  CameraStatePayload,
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
  onOpenShop: (notice?: string) => void;
  onOpenProfile: () => void;
  profilePhotoUrl?: string;
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
function CameraOffOverlay({ compact = false }: { compact?: boolean }) {
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-[#1a1a1a]">
      <div
        className={`flex items-center justify-center rounded-full bg-[#2a2a2a] ${
          compact ? "h-10 w-10" : "h-20 w-20"
        }`}
      >
        <svg
          className={compact ? "h-5 w-5 text-white/25" : "h-9 w-9 text-white/25"}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.8}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.75 10.5 20.1 8.4A1.3 1.3 0 0 1 22 9.57v4.86a1.3 1.3 0 0 1-1.9 1.17l-4.35-2.1M4.75 18h8a3 3 0 0 0 3-3V9a3 3 0 0 0-3-3h-8a3 3 0 0 0-3 3v6a3 3 0 0 0 3 3Z"
          />
          <path strokeLinecap="round" d="M3 3l18 18" />
        </svg>
      </div>
      <span
        className={
          compact
            ? "px-1 text-center text-[10px] font-semibold leading-tight text-white/45"
            : "text-sm font-semibold text-white/45"
        }
      >
        Camera coupee
      </span>
    </div>
  );
}

export default function VideoRoom({
  socket,
  localStream,
  matching,
  onSpendSwipe,
  onOpenShop,
  onOpenProfile,
  profilePhotoUrl,
  onlineCount,
}: Props) {
  const [status, setStatus]           = useState<ConnectionStatus>("searching");
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMuted]                    = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isPartnerCameraOff, setIsPartnerCameraOff] = useState(false);
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
  const largeCameraOff = largeIsLocal ? isCameraOff : isPartnerCameraOff;
  const smallCameraOff = smallIsLocal ? isCameraOff : isPartnerCameraOff;

  // refs
  const localStreamRef     = useRef<MediaStream | null>(localStream);
  const pcRef              = useRef<RTCPeerConnection | null>(null);
  const videoSenderRef     = useRef<RTCRtpSender | null>(null);
  const roomIdRef          = useRef<string | null>(null);
  const iceCandidateBuffer = useRef<RTCIceCandidateInit[]>([]);
  const isCameraOffRef     = useRef(isCameraOff);

  useEffect(() => { localStreamRef.current = localStream; }, [localStream]);
  useEffect(() => { isCameraOffRef.current = isCameraOff; }, [isCameraOff]);

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
      videoSenderRef.current = null;
    }
    if (clearBufferedIce) iceCandidateBuffer.current = [];
    setRemoteStream(null);
  }, []);

  const createPC = useCallback((): RTCPeerConnection => {
    closePC(false);
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    const stream = localStreamRef.current;
    if (stream) {
      stream.getTracks().forEach((t) => {
        if (t.kind === "video") t.enabled = !isCameraOffRef.current;
        const sender = pc.addTrack(t, stream);
        if (t.kind === "video") {
          videoSenderRef.current = sender;
          if (isCameraOffRef.current) void sender.replaceTrack(null);
        }
      });
    }
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

    const onSearching    = () => { setStatus("searching"); setRemoteStream(null); setChatMessages([]); setIsPartnerLarge(false); setIsPartnerCameraOff(false); };
    const onMatched      = async ({ roomId, isInitiator }: MatchedPayload) => {
      roomIdRef.current = roomId;
      iceCandidateBuffer.current = [];
      setChatMessages([]);
      setIsPartnerLarge(false);
      setIsPartnerCameraOff(false);
      setStatus("searching");
      socket.emit("camera-state", { roomId, isCameraOff: isCameraOffRef.current });
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
      closePC(); roomIdRef.current = null; setStatus("partner-left"); setIsPartnerCameraOff(false);
      setTimeout(() => socket.emit("join-queue", matching), 2000);
    };
    const onChatMessage  = ({ message }: { message: string }) =>
      setChatMessages((p) => [...p, { id: Date.now().toString(), from: "partner", text: message, timestamp: Date.now() }]);
    const onCameraState = ({ isCameraOff }: CameraStatePayload) => {
      setIsPartnerCameraOff(isCameraOff);
    };

    socket.on("searching",     onSearching);
    socket.on("matched",       onMatched);
    socket.on("offer",         onOffer);
    socket.on("answer",        onAnswer);
    socket.on("ice-candidate", onIceCandidate);
    socket.on("partner-left",  onPartnerLeft);
    socket.on("chat-message",  onChatMessage);
    socket.on("camera-state",  onCameraState);

    return () => {
      ["searching","matched","offer","answer","ice-candidate","partner-left","chat-message","camera-state"]
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
      onOpenShop("A court de gemmes, recharge ici");
      return;
    }

    setIsNextLoading(true);
    closePC(); roomIdRef.current = null; setChatMessages([]); setIsPartnerCameraOff(false);
    setIsPartnerLarge(false);
    socket.emit("next", matching);
    setTimeout(() => setIsNextLoading(false), 1200);
  }, [isNextLoading, onSpendSwipe, onOpenShop, socket, closePC, matching]);

  const swapFrames = useCallback(() => {
    if (!canSwapFrames) return;
    setIsPartnerLarge((current) => !current);
  }, [canSwapFrames]);

  const toggleCamera = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const next = !isCameraOff;
    const [videoTrack] = stream.getVideoTracks();
    stream.getVideoTracks().forEach((track) => {
      track.enabled = !next;
    });
    void videoSenderRef.current?.replaceTrack(next ? null : videoTrack || null);
    if (roomIdRef.current) {
      socket.emit("camera-state", { roomId: roomIdRef.current, isCameraOff: next });
    }
    setIsCameraOff(next);
  }, [isCameraOff, socket]);

  const sendMessage = useCallback((text: string) => {
    const roomId = roomIdRef.current; if (!roomId) return;
    socket.emit("chat-message", { message: text, roomId });
    setChatMessages((p) => [...p, { id: Date.now().toString(), from: "me", text, timestamp: Date.now() }]);
  }, [socket]);

  // ── Swipe (mobile) ──────────────────────────────────────────────────────────
  const swipeStartRef = useRef<{ x: number; y: number; pointerId?: number } | null>(null);
  const lastSwipeAtRef = useRef(0);

  const isInteractiveSwipeTarget = (target: EventTarget | null) =>
    target instanceof HTMLElement &&
    Boolean(target.closest("button,a,input,select,textarea,[role='button']"));

  const startSwipe = (x: number, y: number, target: EventTarget | null, pointerId?: number) => {
    if (isNextLoading || isInteractiveSwipeTarget(target)) return;
    swipeStartRef.current = { x, y, pointerId };
  };

  const cancelSwipe = () => {
    swipeStartRef.current = null;
  };

  const finishSwipe = (x: number, y: number, pointerId?: number) => {
    const start = swipeStartRef.current;
    if (!start || isNextLoading) return;
    if (start.pointerId !== undefined && pointerId !== undefined && start.pointerId !== pointerId) return;
    swipeStartRef.current = null;

    const deltaX = x - start.x;
    const deltaY = y - start.y;
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);
    const now = Date.now();

    if (now - lastSwipeAtRef.current < 450) return;
    if (absX < 60 || absX < absY * 1.15) return;

    lastSwipeAtRef.current = now;
    setSwipeDir(deltaX < 0 ? "left" : "right");
    setTimeout(() => { setSwipeDir(null); handleNext(); }, 280);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    if (isNextLoading || isInteractiveSwipeTarget(e.target)) return;
    startSwipe(e.clientX, e.clientY, e.target, e.pointerId);
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    finishSwipe(e.clientX, e.clientY, e.pointerId);
    if (e.currentTarget.hasPointerCapture?.(e.pointerId)) {
      e.currentTarget.releasePointerCapture?.(e.pointerId);
    }
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if ("PointerEvent" in window || e.touches.length !== 1) return;
    const touch = e.touches[0];
    startSwipe(touch.clientX, touch.clientY, e.target);
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if ("PointerEvent" in window || e.changedTouches.length !== 1) return;
    const touch = e.changedTouches[0];
    finishSwipe(touch.clientX, touch.clientY);
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
            onClick={() => onOpenShop()}
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
            {profilePhotoUrl ? (
              <img src={profilePhotoUrl} alt="" className="h-8 w-8 rounded-full object-cover" />
            ) : (
              <GenderAvatar gender={matching.profile.gender} className="h-8 w-8" />
            )}
          </button>
        </div>
      </nav>

      {/* ── Main area ────────────────────────────────────────────────────────── */}
      <div className="absolute inset-0 flex overflow-hidden">
        <div className="hidden h-full w-full grid-cols-2 items-center gap-6 px-8 pb-8 pt-24 lg:grid">
          <div
            className="relative mx-auto aspect-square overflow-hidden rounded-[2rem] border border-white/10 bg-[#1a1a1a] shadow-2xl shadow-black/45"
            style={{ width: "min(calc((100vw - 5.5rem) / 2), calc(100vh - 8rem))" }}
          >
            <VideoCard
              stream={localStream}
              mirror
              muted
              isMicOff={isMuted}
              avatarGender={localAvatarGender}
              className="h-full w-full"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/45" />
            {isCameraOff && <CameraOffOverlay />}
          </div>

          <div
            className="relative mx-auto aspect-square overflow-hidden rounded-[2rem] border border-white/10 bg-[#1a1a1a] shadow-2xl shadow-black/45"
            style={{ width: "min(calc((100vw - 5.5rem) / 2), calc(100vh - 8rem))" }}
          >
            <VideoCard
              stream={remoteStream}
              searching={status === "searching" && !remoteStream}
              avatarGender={partnerAvatarGender}
              className="h-full w-full"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/45" />
            {isPartnerCameraOff && <CameraOffOverlay />}

            {status === "partner-left" && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-black/85">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#2a2a2a]">
                  <svg className="h-8 w-8 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
                  </svg>
                </div>
                <p className="text-sm font-semibold text-white/55">Partenaire deconnecte</p>
              </div>
            )}
          </div>
        </div>

        {/* ── TWO BIG SQUARES SIDE BY SIDE ────────────────────────────────── */}
        <div
          className="relative flex flex-1 lg:hidden"
          style={{ touchAction: "pan-y" }}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerCancel={cancelSwipe}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* LEFT SQUARE — Local video (You) */}
          <div className="hidden">
            <VideoCard
              stream={localStream}
              mirror
              muted
              isMicOff={isMuted}
              avatarGender={localAvatarGender}
              className="h-full w-full"
            />

            {/* Camera off overlay */}
            {isCameraOff && <CameraOffOverlay />}
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
              searching={status === "searching" && !largeIsLocal && !largeStream}
              avatarGender={largeIsLocal ? localAvatarGender : partnerAvatarGender}
              className="h-full w-full"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/45 via-black/5 to-black/65" />

            {largeCameraOff && <CameraOffOverlay />}

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
              isMicOff={smallIsLocal ? isMuted : false}
              searching={status === "searching" && !smallIsLocal && !smallStream}
              avatarGender={smallIsLocal ? localAvatarGender : partnerAvatarGender}
              className="h-full w-full"
            />

            {smallCameraOff && <CameraOffOverlay compact />}
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
            onClick={toggleCamera}
            className={`flex h-10 w-10 items-center justify-center rounded-full transition hover:bg-white/10 ${
              isCameraOff ? "text-red-300" : "text-white"
            }`}
            title={isCameraOff ? "Activer la camera" : "Desactiver la camera"}
            aria-label={isCameraOff ? "Activer la camera" : "Desactiver la camera"}
          >
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5 20.1 8.4A1.3 1.3 0 0 1 22 9.57v4.86a1.3 1.3 0 0 1-1.9 1.17l-4.35-2.1M4.75 18h8a3 3 0 0 0 3-3V9a3 3 0 0 0-3-3h-8a3 3 0 0 0-3 3v6a3 3 0 0 0 3 3Z" />
              {isCameraOff && <path strokeLinecap="round" d="M3 3l18 18" />}
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
