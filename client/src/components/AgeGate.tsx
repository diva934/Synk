import { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";

// ─── Constants ────────────────────────────────────────────────────────────────

const MODELS_URL = "/models";
const FRAME_COUNT = 5;
const FRAME_INTERVAL_MS = 400;
const AGE_THRESHOLD = 22; // Seuil volontairement haut (marge d'erreur modèle ±3-4 ans)
const VERIFIED_DURATION_MS = 24 * 60 * 60 * 1000; // 24h
const STORAGE_KEY = "synk_age_verified_until";
const LOG_KEY = "synk_age_gate_log";

// ─── Types ────────────────────────────────────────────────────────────────────

type Stage =
  | "loading"       // Chargement des modèles
  | "scanning"      // Analyse en cours
  | "no_face"       // Aucun visage détecté
  | "multiple_faces"// Plusieurs visages
  | "rejected"      // Trop jeune
  | "error";        // Erreur technique (pas de caméra, etc.)

interface Props {
  onVerified: () => void;
  onRejected: (reason: string) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isVerifiedRecently(): boolean {
  try {
    const until = localStorage.getItem(STORAGE_KEY);
    if (!until) return false;
    return Date.now() < Number(until);
  } catch {
    return false;
  }
}

function saveVerified(): void {
  try {
    localStorage.setItem(STORAGE_KEY, String(Date.now() + VERIFIED_DURATION_MS));
    appendLog("passed");
  } catch {
    /* ignore */
  }
}

function appendLog(result: "passed" | "rejected" | "no_face" | "multiple_faces"): void {
  try {
    const entry = { ts: new Date().toISOString(), result };
    const existing = JSON.parse(localStorage.getItem(LOG_KEY) || "[]");
    // Garder seulement les 50 derniers pour ne pas gonfler localStorage
    existing.push(entry);
    if (existing.length > 50) existing.splice(0, existing.length - 50);
    localStorage.setItem(LOG_KEY, JSON.stringify(existing));
  } catch {
    /* ignore */
  }
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AgeGate({ onVerified, onRejected }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [stage, setStage] = useState<Stage>("loading");
  const [progress, setProgress] = useState(0); // 0-100 pendant scan
  const [modelsLoaded, setModelsLoaded] = useState(false);

  // ── Bypass si vérifié récemment ──────────────────────────────────────────
  useEffect(() => {
    if (isVerifiedRecently()) {
      onVerified();
    }
  }, [onVerified]);

  // ── Chargement des modèles ───────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function loadModels() {
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODELS_URL),
          faceapi.nets.ageGenderNet.loadFromUri(MODELS_URL),
        ]);
        if (!cancelled) setModelsLoaded(true);
      } catch (err) {
        console.error("[AgeGate] model load error:", err);
        if (!cancelled) setStage("error");
      }
    }

    loadModels();
    return () => { cancelled = true; };
  }, []);

  // ── Démarrage du stream caméra ───────────────────────────────────────────
  useEffect(() => {
    if (!modelsLoaded) return;
    if (isVerifiedRecently()) return;

    let cancelled = false;

    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setStage("scanning");
      } catch (err) {
        console.error("[AgeGate] camera error:", err);
        if (!cancelled) setStage("error");
      }
    }

    startCamera();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [modelsLoaded]);

  // ── Séquence de capture + analyse ───────────────────────────────────────
  useEffect(() => {
    if (stage !== "scanning") return;
    if (!videoRef.current) return;

    let cancelled = false;
    const ages: number[] = [];
    let frame = 0;

    async function captureFrame() {
      if (cancelled || !videoRef.current) return;

      const detections = await faceapi
        .detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 }))
        .withAgeAndGender();

      if (!cancelled) {
        if (detections.length === 1) {
          ages.push(detections[0].age);
        } else if (detections.length > 1) {
          // Plusieurs visages dès la première frame → blocage immédiat
          cleanup();
          appendLog("multiple_faces");
          setStage("multiple_faces");
          return;
        }
        // 0 détections sur cette frame → on continue (mauvaise frame)

        frame++;
        setProgress(Math.round((frame / FRAME_COUNT) * 100));

        if (frame < FRAME_COUNT) {
          setTimeout(captureFrame, FRAME_INTERVAL_MS);
        } else {
          // Analyse finale
          evaluate(ages);
        }
      }
    }

    function evaluate(detectedAges: number[]) {
      cleanup();

      if (detectedAges.length === 0) {
        appendLog("no_face");
        setStage("no_face");
        return;
      }

      const medianAge = median(detectedAges);

      if (medianAge < AGE_THRESHOLD) {
        appendLog("rejected");
        setStage("rejected");
        onRejected("age");
      } else {
        saveVerified();
        onVerified();
      }
    }

    function cleanup() {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
    }

    // Laisser la caméra se stabiliser avant le premier scan
    const initDelay = setTimeout(captureFrame, 600);
    return () => {
      cancelled = true;
      clearTimeout(initDelay);
    };
  }, [stage, onVerified, onRejected]);

  // ── Retry ───────────────────────────────────────────────────────────────
  function handleRetry() {
    setProgress(0);
    setStage("loading");
    setModelsLoaded(false);

    // Re-trigger modèles (déjà en mémoire, sera instantané)
    setTimeout(() => setModelsLoaded(true), 100);
  }

  // ── Rendu ────────────────────────────────────────────────────────────────

  if (isVerifiedRecently()) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#0f0f13]">
      {/* Fond décoratif */}
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(45,106,222,0.12) 0%, transparent 70%)" }}
        />
      </div>

      <div className="relative z-10 flex w-full max-w-sm flex-col items-center gap-6 px-6 text-center">
        {/* ── Logo ── */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2d6ade] text-xl shadow-lg">
            💬
          </div>
          <span className="text-xl font-black text-white">Synk</span>
        </div>

        {/* ── Aperçu caméra ── */}
        <div className="relative w-full overflow-hidden rounded-2xl bg-black shadow-2xl" style={{ aspectRatio: "4/3" }}>
          <video
            ref={videoRef}
            className="h-full w-full object-cover"
            muted
            playsInline
            autoPlay
          />

          {/* Overlay selon le stage */}
          {stage === "loading" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-[#2d6ade]" />
              <p className="text-sm text-white/60">Chargement…</p>
            </div>
          )}

          {stage === "scanning" && (
            <div className="absolute inset-0 flex flex-col items-end justify-end p-3">
              {/* Barre de progression */}
              <div className="w-full overflow-hidden rounded-full bg-white/10 h-1.5">
                <div
                  className="h-full rounded-full bg-[#2d6ade] transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Cadre viseur */}
          {stage === "scanning" && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="relative h-36 w-28">
                {/* Coins */}
                <div className="absolute left-0 top-0 h-6 w-6 border-l-2 border-t-2 border-[#2d6ade] rounded-tl" />
                <div className="absolute right-0 top-0 h-6 w-6 border-r-2 border-t-2 border-[#2d6ade] rounded-tr" />
                <div className="absolute bottom-0 left-0 h-6 w-6 border-b-2 border-l-2 border-[#2d6ade] rounded-bl" />
                <div className="absolute bottom-0 right-0 h-6 w-6 border-b-2 border-r-2 border-[#2d6ade] rounded-br" />
              </div>
            </div>
          )}
        </div>

        {/* ── Texte principal ── */}
        {stage === "loading" && (
          <div>
            <h2 className="text-lg font-black text-white">Vérification d'âge</h2>
            <p className="mt-1 text-sm text-white/50">Préparation de la vérification automatique…</p>
          </div>
        )}

        {stage === "scanning" && (
          <div>
            <h2 className="text-lg font-black text-white">Vérification en cours</h2>
            <p className="mt-1 text-sm text-white/50">
              Restez face à la caméra, seul et bien éclairé.
            </p>
          </div>
        )}

        {stage === "no_face" && (
          <div className="flex flex-col items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-400/15 text-2xl">
              👤
            </div>
            <div>
              <h2 className="text-lg font-black text-white">Visage non détecté</h2>
              <p className="mt-1 text-sm text-white/50">
                Assurez-vous d'être bien face à la caméra et correctement éclairé.
              </p>
            </div>
            <button
              onClick={handleRetry}
              className="rounded-full bg-[#2d6ade] px-8 py-3 text-sm font-black text-white active:scale-95"
            >
              Réessayer
            </button>
          </div>
        )}

        {stage === "multiple_faces" && (
          <div className="flex flex-col items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-400/15 text-2xl">
              👥
            </div>
            <div>
              <h2 className="text-lg font-black text-white">Une seule personne</h2>
              <p className="mt-1 text-sm text-white/50">
                Plusieurs visages détectés. Veuillez effectuer la vérification seul.
              </p>
            </div>
            <button
              onClick={handleRetry}
              className="rounded-full bg-[#2d6ade] px-8 py-3 text-sm font-black text-white active:scale-95"
            >
              Réessayer
            </button>
          </div>
        )}

        {stage === "rejected" && (
          <div className="flex flex-col items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-400/15 text-2xl">
              🔒
            </div>
            <div>
              <h2 className="text-lg font-black text-white">Accès refusé</h2>
              <p className="mt-2 text-sm leading-relaxed text-white/50">
                Ce service est réservé aux personnes majeures. Notre système automatique estime que vous ne correspondez pas à ce critère.
              </p>
              <p className="mt-3 text-xs text-white/30">
                Si c'est une erreur, contactez-nous à{" "}
                <a href="mailto:contact@synk.app" className="underline text-white/50">
                  contact@synk.app
                </a>
              </p>
            </div>
          </div>
        )}

        {stage === "error" && (
          <div className="flex flex-col items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-400/15 text-2xl">
              📷
            </div>
            <div>
              <h2 className="text-lg font-black text-white">Caméra indisponible</h2>
              <p className="mt-1 text-sm text-white/50">
                L'accès à la caméra est requis pour la vérification d'âge. Autorisez l'accès dans les paramètres du navigateur.
              </p>
            </div>
            <button
              onClick={handleRetry}
              className="rounded-full bg-[#2d6ade] px-8 py-3 text-sm font-black text-white active:scale-95"
            >
              Réessayer
            </button>
          </div>
        )}

        {/* ── Notice RGPD ── */}
        {(stage === "loading" || stage === "scanning") && (
          <p className="text-xs text-white/25 leading-relaxed">
            🔒 Analyse 100% locale — aucune image n'est stockée ni transmise.
          </p>
        )}
      </div>
    </div>
  );
}
