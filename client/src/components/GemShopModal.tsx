interface GemPack {
  gems: number;
  bonus: number;
  price: string;
  featured?: boolean;
}

interface Props {
  balance: number;
  canClaimDaily: boolean;
  dailyReward: number;
  onBuy: (gems: number) => void;
  onClaimDaily: () => void;
  onClose: () => void;
}

const GEM_PACKS: GemPack[] = [
  { gems: 25000, bonus: 2500, price: "€155.99", featured: true },
  { gems: 10000, bonus: 1000, price: "€63.99" },
  { gems: 5000, bonus: 500, price: "€32.99" },
  { gems: 2500, bonus: 250, price: "€16.99" },
  { gems: 1000, bonus: 100, price: "€6.99" },
  { gems: 500, bonus: 50, price: "€3.59" },
];

function GemIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 160 126" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="gemTop" x1="80" y1="18" x2="80" y2="70" gradientUnits="userSpaceOnUse">
          <stop stopColor="#bff7ff" />
          <stop offset="0.5" stopColor="#62d8ff" />
          <stop offset="1" stopColor="#2563ff" />
        </linearGradient>
        <linearGradient id="gemBottom" x1="80" y1="58" x2="80" y2="118" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2f6fff" />
          <stop offset="1" stopColor="#48c7ff" />
        </linearGradient>
        <filter id="gemGlow" x="0" y="0" width="160" height="126" filterUnits="userSpaceOnUse">
          <feGaussianBlur stdDeviation="5" result="blur" />
          <feColorMatrix in="blur" type="matrix" values="0 0 0 0 0.08 0 0 0 0 0.45 0 0 0 0 1 0 0 0 0.8 0" />
          <feBlend in="SourceGraphic" />
        </filter>
      </defs>
      <g filter="url(#gemGlow)">
        <path d="M32 56L58 26L80 20L102 26L128 56L80 118L32 56Z" fill="#1d6dff" />
        <path d="M58 26H102L110 62H50L58 26Z" fill="url(#gemTop)" />
        <path d="M32 56L58 26L50 62L32 56Z" fill="#42b8ff" />
        <path d="M128 56L102 26L110 62L128 56Z" fill="#2b73ff" />
        <path d="M50 62H110L80 118L50 62Z" fill="url(#gemBottom)" />
        <path d="M32 56H50L80 118L32 56Z" fill="#1f7bff" />
        <path d="M128 56H110L80 118L128 56Z" fill="#1744e8" />
        <path d="M58 26L50 62H80L58 26Z" fill="#2a7fff" opacity="0.85" />
        <path d="M102 26L110 62H80L102 26Z" fill="#2066ff" opacity="0.85" />
        <path d="M50 62H110L80 70L50 62Z" fill="#72e8ff" opacity="0.45" />
        <path d="M62 30H98" stroke="white" strokeWidth="5" strokeLinecap="round" opacity="0.55" />
      </g>
    </svg>
  );
}

function GemArtwork({ level }: { level: number }) {
  const count = level + 1;
  const gems = Array.from({ length: count });

  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-gradient-to-br from-[#071b31] via-[#0b3658] to-[#07111f]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_35%_25%,rgba(56,189,248,0.38),transparent_34%),radial-gradient(circle_at_72%_68%,rgba(45,106,222,0.35),transparent_38%)]" />
      <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/45 to-transparent" />
      <div className="relative h-full w-full">
        {gems.map((_, index) => {
          const positions = [
            "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 scale-100",
            "left-1/2 top-1/2 -translate-x-[92%] -translate-y-[8%] scale-[0.72] rotate-[-12deg]",
            "left-1/2 top-1/2 -translate-x-[8%] -translate-y-[8%] scale-[0.68] rotate-[13deg]",
            "left-1/2 top-1/2 -translate-x-[72%] -translate-y-[64%] scale-[0.58] rotate-[9deg]",
            "left-1/2 top-1/2 -translate-x-[18%] -translate-y-[62%] scale-[0.54] rotate-[-8deg]",
            "left-1/2 top-1/2 -translate-x-[45%] translate-y-[18%] scale-[0.5] rotate-[6deg]",
          ];

          return (
        <GemIcon
          key={index}
              className={`absolute h-16 w-20 drop-shadow-[0_12px_18px_rgba(14,165,233,0.45)] ${positions[index]}`}
            />
          );
        })}
      </div>
      <span className="absolute right-8 top-8 h-1.5 w-1.5 rounded-full bg-white/80 shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
      <span className="absolute left-10 top-14 h-1 w-1 rounded-full bg-white/80 shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
    </div>
  );
}

export default function GemShopModal({
  balance,
  canClaimDaily,
  dailyReward,
  onBuy,
  onClaimDaily,
  onClose,
}: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-3 backdrop-blur-md">
      <div className="flex max-h-[92dvh] w-full max-w-md flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#202020] text-white shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4">
          <div>
            <h2 className="text-2xl font-black tracking-tight">Boutique</h2>
            <p className="mt-1 text-xs text-white/40">10 % de gemmes bonus en tout</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 rounded-full bg-black/25 px-3 py-1.5 text-sm font-bold">
              <GemIcon className="h-5 w-5" />
              <span>{balance.toLocaleString()}</span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white/70 transition hover:bg-white/15 hover:text-white"
              title="Fermer"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto px-4 pb-4 scrollbar-hide">
          <button
            type="button"
            onClick={onClaimDaily}
            disabled={!canClaimDaily}
            className={`grid w-full grid-cols-[28%_1fr_auto] overflow-hidden rounded-2xl text-left transition active:scale-[0.99] ${
              canClaimDaily
                ? "bg-[#123f68] ring-1 ring-[#38bdf8]/35"
                : "bg-[#303030] opacity-55"
            }`}
          >
            <div className="relative min-h-[5.9rem] overflow-hidden bg-gradient-to-br from-[#071b31] via-[#0b3658] to-[#07111f]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_45%_35%,rgba(56,189,248,0.45),transparent_38%)]" />
              <div className="flex h-full items-center justify-center">
                <GemIcon className="relative h-16 w-20 drop-shadow-[0_12px_18px_rgba(14,165,233,0.5)]" />
              </div>
            </div>

            <div className="flex min-w-0 flex-col justify-center px-4">
              <div className="text-lg font-black leading-tight">
                Cadeau quotidien
              </div>
              <div className="mt-1 text-sm font-bold text-[#00f0a8]">
                + {dailyReward.toLocaleString()} gemmes gratuites
              </div>
            </div>

            <div className="flex items-center pr-4">
              <span className="rounded-2xl bg-white/10 px-4 py-2 text-sm font-black">
                {canClaimDaily ? "Récupérer" : "Demain"}
              </span>
            </div>
          </button>

          {GEM_PACKS.map((pack, index) => {
            const total = pack.gems + pack.bonus;
            const level = GEM_PACKS.length - index - 1;

            return (
              <button
                key={pack.gems}
                type="button"
                onClick={() => onBuy(total)}
                className={`grid w-full grid-cols-[28%_1fr_auto] overflow-hidden rounded-2xl bg-[#303030] text-left transition active:scale-[0.99] ${
                  pack.featured ? "ring-1 ring-[#f6d76b]/35" : ""
                }`}
              >
                <div className="min-h-[6.9rem]">
                  <GemArtwork level={level} />
                </div>

                <div className="flex min-w-0 flex-col justify-center px-4">
                  <div className="text-lg font-black leading-tight">
                    {pack.gems.toLocaleString()} gemmes
                  </div>
                  <div className="mt-1 text-sm font-bold text-[#00f0a8]">
                    + {pack.bonus.toLocaleString()} gemmes
                  </div>
                </div>

                <div className="flex items-center pr-4">
                  <span className="rounded-2xl bg-white/10 px-4 py-2 text-sm font-black">
                    {pack.price}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
