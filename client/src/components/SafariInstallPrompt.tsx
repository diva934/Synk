import { ReactNode, useEffect, useState } from "react";

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
    <div className="mx-auto w-[170px] rounded-[2.15rem] border border-white/12 bg-[#050505] p-1.5 shadow-2xl shadow-black/60">
      <div className="relative h-[316px] overflow-hidden rounded-[1.8rem] border border-white/10 bg-[#0d0d0d] font-[-apple-system,BlinkMacSystemFont,'SF_Pro_Display','Segoe_UI',sans-serif]">
        <div className="absolute inset-x-0 top-0 z-30 flex items-center justify-between px-5 pt-3 text-[9px] font-black text-white">
          <span>21:39</span>
          <div className="flex items-center gap-1">
            <CellularIcon className="h-2.5 w-3.5" />
            <WifiIcon className="h-2.5 w-3" />
            <span className="rounded-[4px] bg-white px-1 text-[8px] leading-[13px] text-black">37</span>
          </div>
        </div>

        <div className="absolute inset-0 bg-[#0c0c0c]" />
        <div
          className={`absolute inset-0 bg-black/45 backdrop-blur-[1px] transition-opacity duration-500 ${
            activeStep === 2 ? "opacity-100" : "opacity-0"
          }`}
        />

        <div className="absolute inset-x-0 top-0 h-24 bg-[#151515]" />
        <div className="absolute inset-x-3 top-12 flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-[radial-gradient(circle_at_60%_40%,#65f4ff,#0f6bff_58%,#063074)] shadow-[0_0_12px_rgba(45,216,255,0.45)]" />
          <div className="min-w-0 flex-1">
            <div className="h-3 w-20 rounded-full bg-white/90" />
            <div className="mt-1.5 h-2 w-24 rounded-full bg-white/28" />
          </div>
          <div className="h-7 w-12 rounded-xl bg-white/8" />
        </div>

        <div className="absolute inset-x-3 top-[112px]">
          <div className="mb-6 flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#34c759]" />
            <div className="h-3 w-24 rounded-full bg-[#34c759]/80" />
          </div>
          <div className="space-y-2">
            <div className="h-6 w-32 rounded-full bg-white/95" />
            <div className="h-6 w-28 rounded-full bg-white/95" />
          </div>
          <div className="mt-6 rounded-[1.35rem] border border-white/10 bg-[#151515] p-3">
            <div className="h-7 w-7 rounded-xl bg-[#2d6ade]" />
            <div className="mt-3 h-4 w-24 rounded-full bg-white/80" />
            <div className="mt-2 h-2.5 w-28 rounded-full bg-white/28" />
          </div>
        </div>

        <SafariBottomBar activeStep={activeStep} />
        <SafariMoreMenu activeStep={activeStep} />
        <IosShareSheet activeStep={activeStep} />
        <AnimatedPointer activeStep={activeStep} />
      </div>
    </div>
  );
}

function SafariBottomBar({ activeStep }: { activeStep: number }) {
  return (
    <div
      className={`absolute inset-x-0 bottom-0 z-20 px-3 pb-2 pt-2 transition-opacity duration-300 ${
        activeStep === 2 ? "opacity-0" : "opacity-100"
      }`}
    >
      <div className="mx-auto flex items-center justify-between gap-2 text-white">
        <button className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-[#171717]/95 text-white/50 shadow-lg">
          <ChevronLeftIcon className="h-5 w-5" />
        </button>

        <div className="flex h-10 flex-1 items-center rounded-full border border-white/10 bg-[#171717]/95 px-3 shadow-lg">
          <TabsIcon className="h-5 w-5 text-white/82" />
          <span className="mx-2 h-4 w-px bg-white/14" />
          <span className="min-w-0 flex-1 truncate text-center text-[11px] font-black text-white">synk-kappa.vercel.app</span>
          <ReloadIcon className="h-4 w-4 text-white/82" />
        </div>

        <button className="relative flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-[#171717]/95 text-white shadow-lg">
          {activeStep === 1 && <IosGlow className="-inset-1.5" />}
          <ShareIcon className="relative h-5 w-5" />
        </button>

        <button className="relative flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-[#171717]/95 text-white shadow-lg">
          {activeStep === 0 && <IosGlow className="-inset-1.5" />}
          <DotsIcon className="relative h-5 w-5" />
          {activeStep === 0 && (
            <span className="absolute -top-7 right-1 rounded-full bg-[#0a84ff] px-2 py-0.5 text-[8px] font-black text-white shadow-[0_0_12px_rgba(10,132,255,0.7)]">
              Menu
            </span>
          )}
        </button>
      </div>

      <div className="mx-auto mt-2 h-1 w-24 rounded-full bg-white" />
    </div>
  );
}

function SafariMoreMenu({ activeStep }: { activeStep: number }) {
  return (
    <div
      className={`absolute bottom-[54px] right-3 z-30 w-[120px] origin-bottom-right overflow-hidden rounded-[1.25rem] border border-white/10 bg-[#111]/95 shadow-2xl shadow-black/70 backdrop-blur-2xl transition-all duration-500 ${
        activeStep === 1 ? "scale-100 opacity-100" : "pointer-events-none scale-95 opacity-0"
      }`}
    >
      <MoreMenuRow label="Partager" active icon={<ShareIcon className="h-4 w-4" />} />
      <MoreMenuRow label="Signets" icon={<BookmarkIcon className="h-4 w-4" />} />
      <MoreMenuRow label="Nouvel onglet" icon={<PlusIcon className="h-4 w-4" />} />
      <MoreMenuRow label="Page privee" icon={<HandIcon className="h-4 w-4" />} />
      <div className="grid grid-cols-2 border-t border-white/10">
        <div className="flex flex-col items-center gap-1 py-2 text-[8px] font-bold text-white/70">
          <BookIcon className="h-4 w-4" />
          Signets
        </div>
        <div className="flex flex-col items-center gap-1 py-2 text-[8px] font-bold text-white/70">
          <TabsIcon className="h-4 w-4" />
          Onglets
        </div>
      </div>
    </div>
  );
}

function MoreMenuRow({ label, icon, active = false }: { label: string; icon: ReactNode; active?: boolean }) {
  return (
    <div className={`relative flex items-center gap-3 px-4 py-3 ${active ? "text-white" : "text-white/88"}`}>
      {active && <IosGlow className="inset-1 rounded-[0.95rem]" />}
      <span className="relative">{icon}</span>
      <span className="relative text-[13px] font-semibold leading-none">{label}</span>
    </div>
  );
}

function IosShareSheet({ activeStep }: { activeStep: number }) {
  return (
    <div
      className={`absolute inset-x-0 bottom-0 z-40 rounded-t-[1.8rem] border border-white/10 bg-[#111]/98 px-4 pb-4 pt-4 shadow-2xl shadow-black/80 backdrop-blur-2xl transition-all duration-700 ${
        activeStep === 2 ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-8 opacity-0"
      }`}
    >
      <div className="mb-3 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-[0.85rem] bg-white">
          <div className="h-7 w-7 rounded-md bg-[radial-gradient(circle_at_60%_40%,#65f4ff,#0f6bff_58%,#063074)]" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13px] font-black text-white">RandomChat</div>
          <div className="truncate text-[11px] font-bold text-white/45">synk-kappa.vercel.app</div>
        </div>
      </div>

      <div className="h-px bg-white/10" />

      <div className="my-3 flex gap-3 overflow-hidden">
        {["Enzo", "Redwane", "Papa"].map((name, index) => (
          <div key={name} className="w-12 flex-shrink-0 text-center">
            <div
              className={`mx-auto flex h-11 w-11 items-center justify-center rounded-full text-xl font-black text-white ${
                index === 0 ? "bg-[#bdeec4] text-[#138a22]" : index === 1 ? "bg-[#fff3bb] text-[#8c6d00]" : "bg-[#aebfff]"
              }`}
            >
              {name[0]}
            </div>
            <div className="mt-1 truncate text-[8px] font-black text-white">{name}</div>
          </div>
        ))}
      </div>

      <div className="h-px bg-white/10" />

      <div className="my-3 flex gap-3 overflow-hidden">
        <ShareApp icon="airdrop" label="AirDrop" />
        <ShareApp icon="messages" label="Messages" />
        <ShareApp icon="mail" label="Mail" />
        <ShareApp icon="notes" label="Notes" />
      </div>

      <div className="h-px bg-white/10" />

      <div className="mt-3 grid grid-cols-4 gap-2">
        <ShareAction icon={<CopyIcon className="h-5 w-5" />} label="Copier" />
        <ShareAction active icon={<HomeScreenIcon className="h-5 w-5" />} label="Ecran d'accueil" />
        <ShareAction icon={<BookmarkIcon className="h-5 w-5" />} label="Signets" />
        <ShareAction icon={<ChevronDownIcon className="h-5 w-5" />} label="Plus" />
      </div>
    </div>
  );
}

function ShareApp({ icon, label }: { icon: "airdrop" | "messages" | "mail" | "notes"; label: string }) {
  return (
    <div className="w-12 flex-shrink-0 text-center">
      <div
        className={`mx-auto flex h-11 w-11 items-center justify-center rounded-[0.9rem] shadow-inner ${
          icon === "messages"
            ? "bg-gradient-to-b from-[#5cf56f] to-[#12b833]"
            : icon === "mail"
              ? "bg-gradient-to-b from-[#55b8ff] to-[#1478ff]"
              : icon === "notes"
                ? "bg-gradient-to-b from-[#ffe35a] via-white to-white"
                : "bg-gradient-to-b from-[#5ec5ff] to-[#0a84ff]"
        }`}
      >
        {icon === "messages" && <BubbleIcon className="h-6 w-6 text-white" />}
        {icon === "mail" && <MailIcon className="h-6 w-6 text-white" />}
        {icon === "notes" && <NotesIcon className="h-6 w-6 text-[#111]" />}
        {icon === "airdrop" && <AirDropIcon className="h-6 w-6 text-white" />}
      </div>
      <div className="mt-1 truncate text-[8px] font-black text-white">{label}</div>
    </div>
  );
}

function ShareAction({ icon, label, active = false }: { icon: ReactNode; label: string; active?: boolean }) {
  return (
    <div className="relative text-center">
      {active && <IosGlow className="-inset-1 rounded-[1.2rem]" />}
      <div className={`relative mx-auto flex h-12 w-12 items-center justify-center rounded-full ${active ? "bg-[#2d6ade]/25 text-white" : "bg-[#2b2b2b] text-white"}`}>
        {icon}
      </div>
      <div className="relative mt-1 text-[8px] font-black leading-tight text-white">{label}</div>
    </div>
  );
}

function AnimatedPointer({ activeStep }: { activeStep: number }) {
  const positions = [
    "translate-x-[143px] translate-y-[258px]",
    "translate-x-[118px] translate-y-[258px]",
    "translate-x-[63px] translate-y-[256px]",
  ];

  return (
    <div
      className={`absolute left-0 top-0 z-50 transition-all duration-700 ease-out ${
        activeStep === 2 ? "opacity-0" : "opacity-100"
      } ${positions[activeStep]}`}
    >
      <div className="relative">
        <span className="absolute -left-2 -top-2 h-6 w-6 rounded-full border border-[#0a84ff]/70 bg-[#0a84ff]/18 shadow-[0_0_14px_rgba(10,132,255,0.85)]" />
        <svg className="relative h-4 w-4 -rotate-12 text-white drop-shadow-lg" viewBox="0 0 24 24" fill="currentColor">
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
  return <HomeScreenIcon className={`h-5 w-5 ${className}`} />;
}

function IosGlow({ className = "" }: { className?: string }) {
  return (
    <span
      className={`pointer-events-none absolute rounded-full border border-[#7ab7ff]/80 bg-[#0a84ff]/22 shadow-[0_0_18px_rgba(10,132,255,0.9)] ${className}`}
    />
  );
}

function DotsIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <circle cx="5" cy="12" r="1.8" />
      <circle cx="12" cy="12" r="1.8" />
      <circle cx="19" cy="12" r="1.8" />
    </svg>
  );
}

function ShareIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.1} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 14.5V4.75m0 0 3.4 3.4M12 4.75l-3.4 3.4" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.25 10.75H6.5a2 2 0 0 0-2 2v5.25a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-5.25a2 2 0 0 0-2-2h-.75" />
    </svg>
  );
}

function ChevronLeftIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.6}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 18 9 12l6-6" />
    </svg>
  );
}

function ChevronDownIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.6}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
    </svg>
  );
}

function ReloadIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 12a8 8 0 1 1-2.34-5.66" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 4v6h-6" />
    </svg>
  );
}

function TabsIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.1}>
      <rect x="5" y="5" width="14" height="14" rx="2.6" />
      <path strokeLinecap="round" d="M8 9h8M8 13h8" />
    </svg>
  );
}

function BookmarkIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.1}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 5.5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v15l-5-3-5 3v-15Z" />
    </svg>
  );
}

function PlusIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14m-7-7h14" />
    </svg>
  );
}

function HandIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12V7.5a1.5 1.5 0 0 1 3 0V12m0-2V6.5a1.5 1.5 0 0 1 3 0V12m0-1V8a1.5 1.5 0 0 1 3 0v6.5A5.5 5.5 0 0 1 11.5 20h-1A5.5 5.5 0 0 1 5 14.5V12a1.5 1.5 0 0 1 3 0Z" />
    </svg>
  );
}

function BookIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6.5A2.5 2.5 0 0 1 6.5 4H11v15H6.5A2.5 2.5 0 0 0 4 21V6.5Zm16 0A2.5 2.5 0 0 0 17.5 4H13v15h4.5A2.5 2.5 0 0 1 20 21V6.5Z" />
    </svg>
  );
}

function CopyIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <rect x="8" y="8" width="11" height="11" rx="2" />
      <path d="M5 16V7a2 2 0 0 1 2-2h9" />
    </svg>
  );
}

function HomeScreenIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <rect x="5" y="4" width="14" height="16" rx="2.5" />
      <path strokeLinecap="round" d="M12 9v6m-3-3h6" />
    </svg>
  );
}

function BubbleIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 4C6.9 4 3 7.25 3 11.35c0 2.35 1.3 4.45 3.34 5.78l-.52 2.65 3.04-1.45c.98.25 2.03.38 3.14.38 5.1 0 9-3.25 9-7.36S17.1 4 12 4Z" />
    </svg>
  );
}

function MailIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <rect x="3.5" y="5.5" width="17" height="13" rx="2" fill="rgba(255,255,255,0.12)" />
      <path d="m4.5 7 7.5 6 7.5-6" />
    </svg>
  );
}

function NotesIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <path d="M5 8h14M5 12h14M5 16h10" />
    </svg>
  );
}

function AirDropIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <circle cx="12" cy="12" r="2" fill="currentColor" />
      <path d="M8 16a5.7 5.7 0 0 1 0-8M16 8a5.7 5.7 0 0 1 0 8M5.5 18.5a9.2 9.2 0 0 1 0-13M18.5 5.5a9.2 9.2 0 0 1 0 13" />
    </svg>
  );
}

function CellularIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 12" fill="currentColor">
      <rect x="1" y="7" width="3" height="4" rx="1" />
      <rect x="6" y="5" width="3" height="6" rx="1" />
      <rect x="11" y="3" width="3" height="8" rx="1" />
      <rect x="16" y="1" width="3" height="10" rx="1" />
    </svg>
  );
}

function WifiIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 18 14" fill="currentColor">
      <path d="M9 11.8 12.1 8.7a4.4 4.4 0 0 0-6.2 0L9 11.8Z" />
      <path d="M3.1 5.9a8.4 8.4 0 0 1 11.8 0l-1.7 1.7a6 6 0 0 0-8.4 0L3.1 5.9Z" />
      <path d="M0 2.8a12.7 12.7 0 0 1 18 0l-1.7 1.7a10.3 10.3 0 0 0-14.6 0L0 2.8Z" />
    </svg>
  );
}
