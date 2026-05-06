interface Props {
  isMuted: boolean;
  isCameraOff: boolean;
  isNextLoading: boolean;
  showChat: boolean;
  gemBalance: number;
  onToggleMute: () => void;
  onToggleCamera: () => void;
  onNext: () => void;
  onEnd: () => void;
  onToggleChat: () => void;
  onReport: () => void;
}

export default function Controls({
  isMuted,
  isCameraOff,
  isNextLoading,
  showChat,
  gemBalance,
  onToggleMute,
  onToggleCamera,
  onNext,
  onEnd,
  onToggleChat,
  onReport,
}: Props) {
  return (
    /* Zoom-style bottom toolbar: dark bar, full width, icons + labels */
    <div
      className="flex flex-shrink-0 items-center justify-between px-4 py-1"
      style={{ background: "#1a1a1a", borderTop: "1px solid #2e2e2e" }}
    >
      {/* Left group */}
      <div className="flex items-center">
        {/* Mute */}
        <button
          onClick={onToggleMute}
          className={`ctrl-btn ${isMuted ? "muted" : ""}`}
          title={isMuted ? "Activer le micro" : "Couper le micro"}
        >
          <span className="icon">
            {isMuted ? (
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                <line x1="3" y1="3" x2="21" y2="21" strokeLinecap="round"/>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 9v3a3 3 0 005.12 2.12M15 9.34V6a3 3 0 00-5.94-.6m-.06.6v.01M17 16.95A7 7 0 015 12v-2m14 0v2a7 7 0 01-.11 1.23M12 19v3m-3 0h6" />
              </svg>
            ) : (
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 1a3 3 0 013 3v8a3 3 0 01-6 0V4a3 3 0 013-3zm6 9a6 6 0 01-12 0M12 19v4m-3 0h6" />
              </svg>
            )}
          </span>
          <span className="label">{isMuted ? "Activer" : "Couper"}</span>
        </button>

        {/* Camera */}
        <button
          onClick={onToggleCamera}
          className={`ctrl-btn ${isCameraOff ? "muted" : ""}`}
          title={isCameraOff ? "Activer la caméra" : "Arrêter la caméra"}
        >
          <span className="icon">
            {isCameraOff ? (
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M12 18.75H4.5A2.25 2.25 0 012.25 16.5v-9A2.25 2.25 0 014.5 5.25h9A2.25 2.25 0 0115.75 7.5" />
                <line x1="3" y1="3" x2="21" y2="21" strokeLinecap="round"/>
              </svg>
            ) : (
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.553-2.069A1 1 0 0121 9.382v5.236a1 1 0 01-1.447.894L15.75 13.5M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9A2.25 2.25 0 0013.5 5.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
              </svg>
            )}
          </span>
          <span className="label">{isCameraOff ? "Caméra" : "Arrêter"}</span>
        </button>
      </div>

      {/* Center group */}
      <div className="flex items-center">
        {/* Chat */}
        <button
          onClick={onToggleChat}
          className={`ctrl-btn ${showChat ? "active-green" : ""}`}
          title="Chat"
        >
          <span className="icon">
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
            </svg>
          </span>
          <span className="label">Chat</span>
        </button>

        {/* Next — "Share Screen" equivalent, highlighted green */}
        <button
          onClick={onNext}
          disabled={isNextLoading}
          title="Partenaire suivant"
          className="ctrl-btn active-green disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="icon">
            {isNextLoading ? (
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-green-400/30 border-t-green-400" />
            ) : (
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8.689c0-.864.933-1.406 1.683-.977l7.108 4.061a1.125 1.125 0 010 1.954l-7.108 4.061A1.125 1.125 0 013 16.811V8.69zM12.75 8.689c0-.864.933-1.406 1.683-.977l7.108 4.061a1.125 1.125 0 010 1.954l-7.108 4.061a1.125 1.125 0 01-1.683-.977V8.69z" />
              </svg>
            )}
          </span>
          <span className="label">Suivant</span>
        </button>

        {/* Report */}
        <button
          onClick={onReport}
          className="ctrl-btn"
          title="Signaler"
        >
          <span className="icon">
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0l2.77-.693a9 9 0 016.208.682l.108.054a9 9 0 006.086.71l3.114-.732a48.524 48.524 0 01-.005-10.499l-3.11.732a9 9 0 01-6.085-.711l-.108-.054a9 9 0 00-6.208-.682L3 4.5M3 15V4.5" />
            </svg>
          </span>
          <span className="label">Signaler</span>
        </button>
      </div>

      {/* Right — Leave (Zoom red pill button) */}
      <div className="flex items-center">
        <div className="mr-2 hidden items-center gap-1 rounded-full bg-black/25 px-2.5 py-1 text-xs font-bold text-white/80 sm:flex">
          <span>💎</span>
          <span>{gemBalance.toLocaleString()}</span>
        </div>
        <button
          onClick={onEnd}
          className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#cf2020] text-white hover:bg-[#b91c1c] active:bg-[#991b1b] transition-colors"
          title="Quitter"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
          </svg>
        </button>
      </div>
    </div>
  );
}
