import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import HomePage from "./components/HomePage";
import VideoRoom from "./components/VideoRoom";
import type { MediaPreferences } from "./types";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:3001";

type Page = "home" | "room";

export default function App() {
  const [page, setPage] = useState<Page>("home");
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [onlineCount, setOnlineCount] = useState(0);

  // Socket is created once and persists for the entire session
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = io(SOCKET_URL, { autoConnect: true });
    socketRef.current = socket;

    socket.on("online-count", (count: number) => setOnlineCount(count));

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleStart = async (prefs: MediaPreferences) => {
    setMediaError(null);
    try {
      const constraints: MediaStreamConstraints = {
        video: prefs.video
          ? { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" }
          : false,
        audio: prefs.audio,
      };

      // If both are disabled, use a blank stream so WebRTC still works
      const stream =
        prefs.video || prefs.audio
          ? await navigator.mediaDevices.getUserMedia(constraints)
          : new MediaStream();

      setLocalStream(stream);
      setPage("room");
    } catch (err) {
      if (err instanceof Error) {
        if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
          setMediaError(
            "Accès à la caméra/micro refusé. Autorisez l'accès dans les paramètres du navigateur, puis réessayez."
          );
        } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
          setMediaError("Aucune caméra ou microphone trouvé sur cet appareil.");
        } else if (err.name === "NotReadableError") {
          setMediaError(
            "La caméra/micro est déjà utilisé par une autre application. Fermez-la et réessayez."
          );
        } else {
          setMediaError(`Impossible d'accéder aux médias : ${err.message}`);
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
    setPage("home");
  };

  if (!socketRef.current) return null;

  return (
    <div className="min-h-screen bg-gray-950">
      {page === "home" ? (
        <HomePage
          onStart={handleStart}
          mediaError={mediaError}
          onlineCount={onlineCount}
        />
      ) : (
        <VideoRoom
          socket={socketRef.current}
          localStream={localStream}
          onEnd={handleEndCall}
          onlineCount={onlineCount}
        />
      )}
    </div>
  );
}
