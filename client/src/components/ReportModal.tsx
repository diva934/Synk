interface Props {
  onClose: () => void;
}

const REASONS = [
  "Contenu inapproprié ou nudité",
  "Harcèlement ou menaces",
  "Comportement abusif",
  "Mineur en danger",
  "Spam ou robot",
  "Autre raison",
];

export default function ReportModal({ onClose }: Props) {
  const handleReport = (reason: string) => {
    console.info("[report]", reason);
    alert(`Signalement envoyé : « ${reason} »\nMerci de contribuer à la sécurité de RandomChat.`);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.75)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-5"
        style={{ background: "#242424", border: "1px solid #3a3a3a" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-white">Signaler cet utilisateur</h2>
          <button onClick={onClose} className="rounded p-1 text-white/40 hover:text-white transition-colors">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <ul className="space-y-1.5">
          {REASONS.map((r) => (
            <li key={r}>
              <button
                onClick={() => handleReport(r)}
                className="w-full rounded-xl px-4 py-2.5 text-left text-sm text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                style={{ border: "1px solid #3a3a3a" }}
              >
                {r}
              </button>
            </li>
          ))}
        </ul>

        <button onClick={onClose} className="mt-4 w-full py-2 text-sm text-white/30 hover:text-white/60 transition-colors">
          Annuler
        </button>
      </div>
    </div>
  );
}
