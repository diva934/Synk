import type { ConnectionStatus } from "../types";

interface Props {
  status: ConnectionStatus;
  compact?: boolean;
}

const CFG: Record<ConnectionStatus, { dot: string; label: string }> = {
  searching:     { dot: "bg-yellow-400 animate-pulse", label: "Recherche…" },
  connected:     { dot: "bg-green-400",                label: "Connecté"   },
  "partner-left":{ dot: "bg-red-400",                  label: "Déconnecté" },
  error:         { dot: "bg-red-500",                  label: "Erreur"     },
};

export default function StatusBadge({ status, compact = false }: Props) {
  const { dot, label } = CFG[status];
  return (
    <span className="flex items-center gap-1.5 text-xs text-white/60">
      <span className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${dot}`} />
      {!compact && label}
    </span>
  );
}
