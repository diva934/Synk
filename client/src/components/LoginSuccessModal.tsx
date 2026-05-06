interface Props {
  onContinue: () => void;
}

export default function LoginSuccessModal({ onContinue }: Props) {
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
          Votre compte est prêt. Vous pouvez maintenant lancer une rencontre vidéo.
        </p>

        <button
          type="button"
          onClick={onContinue}
          className="mt-7 w-full rounded-xl bg-[#2d6ade] px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 active:scale-[0.98]"
        >
          Continuer
        </button>
      </div>
    </div>
  );
}
