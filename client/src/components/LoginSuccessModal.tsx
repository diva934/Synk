import { useState } from "react";

interface Props {
  onContinue: () => void;
}

export default function LoginSuccessModal({ onContinue }: Props) {
  const [checked, setChecked] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-4 backdrop-blur-md">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#161616] px-6 py-7 text-center text-white shadow-2xl">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#2d6ade] shadow-lg shadow-[#2d6ade]/25">
          <svg className="h-9 w-9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h2 className="text-2xl font-bold leading-tight">
          Connexion réussie
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-white/50">
          Avant de continuer, merci de confirmer les informations ci-dessous.
        </p>

        <label
          className={`mt-6 flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 text-left transition ${
            checked
              ? "border-[#2d6ade]/60 bg-[#2d6ade]/10"
              : "border-white/10 bg-white/[0.04]"
          }`}
        >
          <div className="relative mt-0.5 flex-shrink-0">
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => setChecked(e.target.checked)}
              className="peer sr-only"
            />
            <div
              className={`flex h-5 w-5 items-center justify-center rounded border-2 transition ${
                checked
                  ? "border-[#2d6ade] bg-[#2d6ade]"
                  : "border-white/30 bg-transparent"
              }`}
            >
              {checked && (
                <svg className="h-3 w-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
          </div>
          <span className="text-sm leading-relaxed text-white/80">
            Je certifie avoir <span className="font-bold text-white">18 ans ou plus</span> et accepte les conditions d'utilisation de la plateforme.
          </span>
        </label>

        <button
          type="button"
          onClick={onContinue}
          disabled={!checked}
          className={`mt-5 w-full rounded-xl px-4 py-3 text-sm font-semibold text-white transition ${
            checked
              ? "bg-[#2d6ade] hover:opacity-90 active:scale-[0.98]"
              : "cursor-not-allowed bg-white/10 text-white/30"
          }`}
        >
          Continuer
        </button>
      </div>
    </div>
  );
}
