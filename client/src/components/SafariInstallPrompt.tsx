import { useEffect } from "react";

type AddToHomeScreenOptions = {
  appName: string;
  appNameDisplay?: "standalone" | "inline";
  appIconUrl: string;
  assetUrl: string;
  maxModalDisplayCount?: number;
  displayOptions?: {
    showMobile?: boolean;
    showDesktop?: boolean;
  };
  allowClose?: boolean;
  showArrow?: boolean;
};

type AddToHomeScreenInstance = {
  show: (locale?: string) => unknown;
  clearModalDisplayCount?: () => void;
};

declare global {
  interface Window {
    AddToHomeScreen?: (options: AddToHomeScreenOptions) => AddToHomeScreenInstance;
    AddToHomeScreenInstance?: AddToHomeScreenInstance;
  }
}

function isStandaloneApp() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone)
  );
}

export default function SafariInstallPrompt() {
  useEffect(() => {
    if (isStandaloneApp()) return;

    let cancelled = false;
    let attempts = 0;
    let retryTimer: number | undefined;
    let showTimer: number | undefined;

    const startAddToHomescreen = () => {
      if (cancelled) return;

      if (!window.AddToHomeScreen) {
        attempts += 1;
        if (attempts < 25) {
          retryTimer = window.setTimeout(startAddToHomescreen, 200);
        }
        return;
      }

      window.AddToHomeScreenInstance = window.AddToHomeScreen({
        appName: "Random Chat",
        appNameDisplay: "standalone",
        appIconUrl: "/apple-touch-icon.png",
        assetUrl: "https://cdn.jsdelivr.net/gh/philfung/add-to-homescreen@3.5/dist/assets/img/",
        maxModalDisplayCount: -1,
        displayOptions: {
          showMobile: true,
          showDesktop: false,
        },
        allowClose: true,
        showArrow: true,
      });

      showTimer = window.setTimeout(() => {
        if (!cancelled) {
          window.AddToHomeScreenInstance?.show("fr");
        }
      }, 900);
    };

    startAddToHomescreen();

    return () => {
      cancelled = true;
      if (retryTimer) window.clearTimeout(retryTimer);
      if (showTimer) window.clearTimeout(showTimer);
    };
  }, []);

  return null;
}
