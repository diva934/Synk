import { useEffect, useState } from "react";

const DISMISS_KEY = "randomchat:safari-install-dismissed";

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

  useEffect(() => {
    if (localStorage.getItem(DISMISS_KEY) === "true") return;
    if (isIosSafari()) {
      const timer = window.setTimeout(() => setVisible(true), 900);
      return () => window.clearTimeout(timer);
    }
  }, []);

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, "true");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[60] px-3 pb-1 text-white">
      <div className="mx-auto max-w-md overflow-hidden rounded-3xl border border-white/10 bg-[#161616]/95 shadow-2xl backdrop-blur-xl">
        <div className="flex items-start gap-3 px-4 py-4">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-[#2d6ade]">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 16V4m0 0l-4 4m4-4l4 4" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 12v6a2 2 0 002 2h10a2 2 0 002-2v-6" />
            </svg>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-black tracking-tight">Ajouter Synk à l’écran d’accueil</h2>
                <p className="mt-1 text-xs leading-relaxed text-white/45">
                  Lance le site comme une vraie app, directement depuis ton iPhone.
                </p>
              </div>
              <button
                type="button"
                onClick={dismiss}
                className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white/10 text-white/60 transition hover:bg-white/15 hover:text-white"
                title="Fermer"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mt-4 grid gap-2">
              <InstallStep
                number="1"
                title="Ouvre le menu de partage"
                text="Appuie sur l’icône partage de Safari en bas de l’écran."
                icon="share"
              />
              <InstallStep
                number="2"
                title="Choisis Ajouter à l’écran d’accueil"
                text="Fais défiler le menu si l’option n’apparaît pas tout de suite."
                icon="plus"
              />
              <InstallStep
                number="3"
                title="Valide avec Ajouter"
                text="L’icône Synk apparaîtra avec tes apps."
                icon="check"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InstallStep({
  number,
  title,
  text,
  icon,
}: {
  number: string;
  title: string;
  text: string;
  icon: "share" | "plus" | "check";
}) {
  return (
    <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-2xl bg-white/5 px-3 py-2.5">
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#2d6ade]/20 text-xs font-black text-[#78aaff]">
        {number}
      </span>
      <div className="min-w-0">
        <div className="text-sm font-bold text-white/90">{title}</div>
        <div className="text-xs leading-snug text-white/40">{text}</div>
      </div>
      <StepIcon icon={icon} />
    </div>
  );
}

function StepIcon({ icon }: { icon: "share" | "plus" | "check" }) {
  if (icon === "plus") {
    return (
      <svg className="h-5 w-5 text-[#78aaff]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14m-7-7h14" />
      </svg>
    );
  }

  if (icon === "check") {
    return (
      <svg className="h-5 w-5 text-[#00f0a8]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    );
  }

  return (
    <svg className="h-5 w-5 text-[#78aaff]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 16V4m0 0l-4 4m4-4l4 4" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12v6a2 2 0 002 2h10a2 2 0 002-2v-6" />
    </svg>
  );
}
