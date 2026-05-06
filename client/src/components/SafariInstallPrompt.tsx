import { useEffect, useState } from "react";

const steps = [
  {
    title: "Appuie sur les 3 petits points",
    text: "Ouvre le menu Safari en bas a droite de l'ecran.",
  },
  {
    title: "Appuie sur Partager",
    text: "Dans le menu qui apparait, selectionne l'icone de partage.",
  },
  {
    title: "Ajouter a l'ecran d'accueil",
    text: "Fais defiler puis appuie sur 'Ajouter a l'ecran d'accueil'.",
  },
];

function isIosSafari() {
  const userAgent = window.navigator.userAgent;
  const isIos = /iPad|iPhone|iPod/.test(userAgent);
  const isSafari = /Safari/.test(userAgent) && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(userAgent);
  const isStandalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone);

  return isIos && isSafari && !isStandalone;
}

export default function SafariInstallPrompt() {
  const [visible, setVisible] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    if (isIosSafari()) {
      const timer = window.setTimeout(() => setVisible(true), 900);
      return () => window.clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    if (!visible) return;

    const timer = window.setInterval(() => {
      setActiveStep((current) => (current + 1) % steps.length);
    }, 2100);

    return () => window.clearInterval(timer);
  }, [visible]);

  const dismiss = () => {
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[60] px-3 pb-2 text-white">
      <div className="mx-auto max-w-md overflow-hidden rounded-3xl border border-white/10 bg-[#121212]/95 shadow-2xl shadow-black/70 backdrop-blur-xl">
        <div className="relative overflow-hidden px-4 py-4">
          <div className="pointer-events-none absolute -right-16 -top-20 h-44 w-44 rounded-full bg-[#2d6ade]/25 blur-3xl" />
          <div className="pointer-events-none absolute -left-20 bottom-4 h-40 w-40 rounded-full bg-cyan-400/10 blur-3xl" />

          <div className="relative flex items-start justify-between gap-3">
            <div>
              <div className="text-[11px] font-black uppercase tracking-[0.18em] text-[#78aaff]">Installation iPhone</div>
              <h2 className="mt-1 text-lg font-black tracking-tight">Ajouter Random Chat a l'ecran d'accueil</h2>
              <p className="mt-1 max-w-[300px] text-xs leading-relaxed text-white/45">
                Suis les etapes Safari pour lancer le site comme une vraie app.
              </p>
            </div>
            <button
              type="button"
              onClick={dismiss}
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-white/10 text-white/60 transition hover:bg-white/15 hover:text-white"
              title="Fermer"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="relative mt-4 grid gap-4 sm:grid-cols-[152px_1fr] sm:items-stretch">
            <IphoneTutorial activeStep={activeStep} />

            <div className="grid gap-2">
              {steps.map((step, index) => (
                <button
                  key={step.title}
                  type="button"
                  onClick={() => setActiveStep(index)}
                  className={`grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-2xl border px-3 py-2.5 text-left transition ${
                    activeStep === index
                      ? "border-[#2d6ade]/70 bg-[#2d6ade]/18 shadow-[0_0_22px_rgba(45,106,222,0.22)]"
                      : "border-white/5 bg-white/5 hover:bg-white/8"
                  }`}
                >
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-black ${
                      activeStep === index ? "bg-[#2d6ade] text-white" : "bg-white/10 text-white/50"
                    }`}
                  >
                    {index + 1}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-black text-white">{step.title}</span>
                    <span className="mt-0.5 block text-xs leading-snug text-white/45">{step.text}</span>
                  </span>
                  <StepGlyph active={activeStep === index} step={index} />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function IphoneTutorial({ activeStep }: { activeStep: number }) {
  return (
    <div className="mx-auto w-[152px] rounded-[2rem] border border-white/12 bg-[#050505] p-1.5 shadow-2xl shadow-black/50">
      <div className="relative h-[276px] overflow-hidden rounded-[1.65rem] border border-white/10 bg-[#111]">
        <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-center pt-2">
          <span className="h-4 w-16 rounded-full bg-black/80" />
        </div>

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_12%,rgba(45,106,222,0.25),transparent_32%),linear-gradient(180deg,#171717,#070707)]" />

        <div className="absolute inset-x-2 top-9 grid gap-1.5">
          <div className="h-11 rounded-2xl bg-white/8" />
          <div className="grid grid-cols-2 gap-1.5">
            <div className="h-20 rounded-2xl bg-white/8" />
            <div className="h-20 rounded-2xl bg-white/8" />
          </div>
          <div className="h-20 rounded-2xl bg-white/8" />
        </div>

        <SafariBottomBar activeStep={activeStep} />
        <SafariMenu activeStep={activeStep} />
        <AnimatedPointer activeStep={activeStep} />
      </div>
    </div>
  );
}

function SafariBottomBar({ activeStep }: { activeStep: number }) {
  return (
    <div className="absolute inset-x-2 bottom-2 rounded-[1.25rem] border border-white/10 bg-[#1b1b1b]/95 p-2 shadow-2xl">
      <div className="mb-2 h-5 rounded-full bg-white/10 px-2 text-[8px] font-bold leading-5 text-white/35">randomchat.app</div>
      <div className="flex items-center justify-between text-white/70">
        <SmallSafariIcon type="back" />
        <SmallSafariIcon type="tabs" />
        <div className={`relative ${activeStep === 1 ? "text-white" : ""}`}>
          {activeStep === 1 && <BluePulse className="-inset-2" />}
          <ShareIcon className="relative h-5 w-5" />
        </div>
        <div className={`relative ${activeStep === 0 ? "text-white" : ""}`}>
          {activeStep === 0 && <BluePulse className="-inset-2" />}
          <DotsIcon className="relative h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function SafariMenu({ activeStep }: { activeStep: number }) {
  const menuVisible = activeStep > 0;

  return (
    <div
      className={`absolute inset-x-3 bottom-[74px] rounded-2xl border border-white/10 bg-[#242424]/95 p-2 shadow-2xl transition-all duration-500 ${
        menuVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
      }`}
    >
      <div className="mb-2 grid grid-cols-4 gap-1.5">
        <MenuIcon label="Copier" />
        <MenuIcon label="Lire" />
        <div className={`relative rounded-xl bg-white/10 py-2 text-center ${activeStep === 1 ? "text-white" : "text-white/45"}`}>
          {activeStep === 1 && <BluePulse className="-inset-1" />}
          <ShareIcon className="relative mx-auto h-4 w-4" />
          <div className="relative mt-1 text-[7px] font-bold">Partager</div>
        </div>
        <MenuIcon label="Signet" />
      </div>

      <div className={`relative flex items-center gap-2 rounded-xl px-2 py-2 ${activeStep === 2 ? "bg-[#2d6ade]/25" : "bg-white/8"}`}>
        {activeStep === 2 && <BluePulse className="-inset-1" />}
        <span className="relative flex h-6 w-6 items-center justify-center rounded-lg bg-white text-[#111]">
          <PlusIcon className="h-3.5 w-3.5" />
        </span>
        <span className="relative text-[9px] font-black text-white">Ajouter a l'ecran d'accueil</span>
      </div>
    </div>
  );
}

function AnimatedPointer({ activeStep }: { activeStep: number }) {
  const positions = [
    "translate-x-[112px] translate-y-[236px]",
    "translate-x-[83px] translate-y-[236px]",
    "translate-x-[42px] translate-y-[164px]",
  ];

  return (
    <div className={`absolute left-0 top-0 transition-transform duration-700 ease-out ${positions[activeStep]}`}>
      <div className="relative">
        <div className="absolute -left-3 -top-3 h-8 w-8 rounded-full border border-[#78aaff]/70 bg-[#2d6ade]/25 shadow-[0_0_18px_rgba(45,106,222,0.8)]" />
        <svg className="relative h-5 w-5 -rotate-12 text-white drop-shadow-lg" viewBox="0 0 24 24" fill="currentColor">
          <path d="M4 3.5 19.5 12 13 13.5 16.5 20l-2.7 1.4-3.4-6.3L6 19.4 4 3.5Z" />
        </svg>
      </div>
    </div>
  );
}

function StepGlyph({ active, step }: { active: boolean; step: number }) {
  const className = active ? "text-[#78aaff]" : "text-white/35";

  if (step === 0) return <DotsIcon className={`h-5 w-5 ${className}`} />;
  if (step === 1) return <ShareIcon className={`h-5 w-5 ${className}`} />;
  return <PlusIcon className={`h-5 w-5 ${className}`} />;
}

function MenuIcon({ label }: { label: string }) {
  return (
    <div className="rounded-xl bg-white/8 py-2 text-center text-white/35">
      <span className="mx-auto block h-4 w-4 rounded bg-white/15" />
      <div className="mt-1 text-[7px] font-bold">{label}</div>
    </div>
  );
}

function BluePulse({ className = "" }: { className?: string }) {
  return (
    <span
      className={`pointer-events-none absolute rounded-full border border-[#78aaff] bg-[#2d6ade]/20 shadow-[0_0_18px_rgba(45,106,222,0.9)] ${className}`}
    />
  );
}

function SmallSafariIcon({ type }: { type: "back" | "tabs" }) {
  if (type === "tabs") {
    return (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <rect x="7" y="7" width="10" height="10" rx="2" />
        <path d="M4 14V6a2 2 0 0 1 2-2h8" />
      </svg>
    );
  }

  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 18 9 12l6-6" />
    </svg>
  );
}

function DotsIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <circle cx="5" cy="12" r="2" />
      <circle cx="12" cy="12" r="2" />
      <circle cx="19" cy="12" r="2" />
    </svg>
  );
}

function ShareIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 16V4m0 0 4 4m-4-4-4 4" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" />
    </svg>
  );
}

function PlusIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14m-7-7h14" />
    </svg>
  );
}
