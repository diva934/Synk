import { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";

// ─── Constants ────────────────────────────────────────────────────────────────

const MODELS_URL = "/models";
const FRAME_COUNT = 5;
const FRAME_INTERVAL_MS = 400;
const AGE_THRESHOLD = 22;
const VERIFIED_DURATION_MS = 24 * 60 * 60 * 1000;
const LOG_KEY = "synk_age_gate_log";

// ─── Types ────────────────────────────────────────────────────────────────────

type Stage = "loading" | "scanning" | "no_face" | "multiple_faces" | "rejected" | "error";

interface Props {
  onVerified: () => void;
  onRejected: (reason: string) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function isAgeVerifiedRecently(): boolean {
  try {
    const until = localStorage.getItem("synk_age_verified_until");
    return !!until && Date.now() < Number(until);
  } catch {
    return false;
  }
}

function saveVerified(): void {
  try {
    localStorage.setItem("synk_age_verified_until", String(Date.now() + VERIFIED_DURATION_MS));
    appendLog("passed");
  } catch { /* ignore */ }
}

function appendLog(result: "passed" | "rejected" | "no_face" | "multiple_faces"): void {
  try {
    const existing: unknown[] = JSON.parse(localStorage.getItem(LOG_KEY) || "[]");
    existing.push({ ts: new Date().toISOString(), result });
    if (existing.length > 50) existing.splice(0, existing.length - 50);
    localStorage.setItem(LOG_KEY, JSON.stringify(existing));
  } catch { /* ignore */ }
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AgeGate({ onVerified, onRejected }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [stage, setStage] = useState<Stage>("loading");
  const [progress, setProgress] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(3);

  // ── Phase 1 : chargement des modèles ────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODELS_URL),
          faceapi.nets.ageGenderNet.loadFromUri(MODELS_URL),
        ]);
        if (!cancelled) startCamera();
      } catch (err) {
        console.error("[AgeGate] model load failed:", err);
        if (!cancelled) setStage("error");
      }
    }

    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" },
          audio: false,
        });
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        if (!cancelled) setStage("scanning");
      } catch (err) {
        console.error("[AgeGate] camera failed:", err);
        if (!cancelled) setStage("error");
      }
    }

    load();

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Phase 2 : capture + analyse ─────────────────────────────────────────
  useEffect(() => {
    if (stage !== "scanning") return;

    let cancelled = false;
    const ages: number[] = [];
    let frame = 0;

    function cleanup() {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    async function captureFrame() {
      if (cancelled || !videoRef.current) return;

      try {
        const detections = await faceapi
          .detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 }))
          .withAgeAndGender();

        if (cancelled) return;

        if (detections.length > 1) {
          cleanup();
          appendLog("multiple_faces");
          setStage("multiple_faces");
          return;
        }

        if (detections.length === 1) ages.push(detections[0].age);
      } catch (err) {
        console.warn("[AgeGate] frame detection error:", err);
        // Frame ratée, on continue
      }

      frame++;
      setProgress(Math.round((frame / FRAME_COUNT) * 100));

      if (frame < FRAME_COUNT) {
        setTimeout(captureFrame, FRAME_INTERVAL_MS);
      } else {
        evaluate();
      }
    }

    function evaluate() {
      cleanup();

      if (ages.length === 0) {
        appendLog("no_face");
        setStage("no_face");
        return;
      }

      const medianAge = median(ages);
      console.log("[AgeGate] median age:", medianAge);

      if (medianAge < AGE_THRESHOLD) {
        appendLog("rejected");
        setStage("rejected");
        onRejected("age");
      } else {
        saveVerified();
        onVerified();
      }
    }

    // Compte à rebours : 3s total (800ms init + 5×400ms ≈ 2.8s)
    setSecondsLeft(3);
    const t1 = setTimeout(() => setSecondsLeft(2), 1000);
    const t2 = setTimeout(() => setSecondsLeft(1), 2000);

    const initDelay = setTimeout(captureFrame, 800);
    return () => {
      cancelled = true;
      clearTimeout(initDelay);
      clearTimeout(t1);
      clearTimeout(t2);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  // ── Retry ────────────────────────────────────────────────────────────────
  function handleRetry() {
    setProgress(0);
    setStage("loading");
    // Re-déclenche Phase 1 en remontant le composant — on utilise une clé dans App.tsx
    // Pour l'instant, on simule un retry en forçant le re-chargement
    window.location.reload();
  }

  // ── Rendu ────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-[#0f0f13]">
      {/* Fond décoratif */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ background: "radial-gradient(circle, rgba(45,106,222,0.12) 0%, transparent 70%)" }}
      />

      <div className="relative z-10 flex w-full max-w-sm flex-col items-center gap-5 px-6 text-center">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2d6ade] text-xl shadow-lg">
            💬
          </div>
          <span className="text-xl font-black text-white">Synk</span>
        </div>

        {/* Aperçu caméra */}
        <div className="relative w-full overflow-hidden rounded-2xl bg-zinc-900 shadow-2xl" style={{ aspectRatio: "4/3" }}>
          <video ref={videoRef} className="h-full w-full object-cover scale-x-[-1]" muted playsInline autoPlay />

          {stage === "loading" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/80">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-[#2d6ade]" />
              <p className="text-sm text-white/60">Chargement des modèles…</p>
            </div>
          )}

          {stage === "scanning" && (
            <>
              {/* Ovale visage centré */}
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div
                  className="border-2 border-[#2d6ade] shadow-[0_0_20px_rgba(45,106,222,0.4)]"
                  style={{ width: 110, height: 140, borderRadius: "50%", marginTop: "-10%" }}
                />
              </div>
              {/* Compte à rebours + barre */}
              <div className="absolute bottom-3 left-3 right-3 flex flex-col gap-1.5">
                <div className="flex justify-end">
                  <span className="text-xs font-bold text-white/60">
                    {secondsLeft}s
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-[#2d6ade] transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Texte selon le stage */}
        {stage === "loading" && (
          <div>
            <h2 className="text-lg font-black text-white">Vérification d'âge</h2>
            <p className="mt-1 text-sm text-white/50">Préparation en cours…</p>
          </div>
        )}

        {stage === "scanning" && (
          <div>
            <h2 className="text-lg font-black text-white">Vérification en cours</h2>
            <p className="mt-1 text-sm text-white/50">Restez seul, face à la caméra, bien éclairé.</p>
          </div>
        )}

        {stage === "no_face" && (
          <div className="flex flex-col items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-400/15 text-2xl">👤</div>
            <div>
              <h2 className="text-lg font-black text-white">Visage non détecté</h2>
              <p className="mt-1 text-sm text-white/50">Assurez-vous d'être face à la caméra et bien éclairé.</p>
            </div>
            <button onClick={handleRetry} className="rounded-full bg-[#2d6ade] px-8 py-3 text-sm font-black text-white active:scale-95">
              Réessayer
            </button>
          </div>
        )}

        {stage === "multiple_faces" && (
          <div className="flex flex-col items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-400/15 text-2xl">👥</div>
            <div>
              <h2 className="text-lg font-black text-white">Une seule personne</h2>
              <p className="mt-1 text-sm text-white/50">Plusieurs visages détectés. Effectuez la vérification seul.</p>
            </div>
            <button onClick={handleRetry} className="rounded-full bg-[#2d6ade] px-8 py-3 text-sm font-black text-white active:scale-95">
              Réessayer
            </button>
          </div>
        )}

        {stage === "rejected" && (
          <div className="flex flex-col items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-400/15 text-2xl">🔒</div>
            <div>
              <h2 className="text-lg font-black text-white">Accès refusé</h2>
              <p className="mt-2 text-sm leading-relaxed text-white/50">
                Ce service est réservé aux personnes majeures. Notre système automatique estime que vous ne répondez pas à ce critère.
              </p>
              <p className="mt-3 text-xs text-white/30">
                Erreur ?{" "}
                <a href="mailto:contact@synk.app" className="text-white/50 underline">
                  contact@synk.app
                </a>
              </p>
            </div>
          </div>
        )}

        {stage === "error" && (
          <div className="flex flex-col items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-400/15 text-2xl">📷</div>
            <div>
              <h2 className="text-lg font-black text-white">Caméra indisponible</h2>
              <p className="mt-1 text-sm text-white/50">
                Autorisez l'accès à la caméra dans les paramètres du navigateur.
              </p>
            </div>
            <button onClick={handleRetry} className="rounded-full bg-[#2d6ade] px-8 py-3 text-sm font-black text-white active:scale-95">
              Réessayer
            </button>
          </div>
        )}

        {(stage === "loading" || stage === "scanning") && (
          <p className="text-xs leading-relaxed text-white/25">
            🔒 Analyse 100 % locale — aucune image n'est stockée ni transmise.
          </p>
        )}
      </div>
    </div>
  );
}
