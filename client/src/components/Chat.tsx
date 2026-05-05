import { useEffect, useRef, useState } from "react";
import type { ChatMessage } from "../types";

interface Props {
  messages: ChatMessage[];
  onSend: (text: string) => void;
  disabled?: boolean;
  onClose?: () => void;
}

export default function Chat({ messages, onSend, disabled = false, onClose }: Props) {
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || disabled) return;
    onSend(text);
    setInput("");
  };

  return (
    <div className="flex h-full flex-col" style={{ background: "#1f1f1f", borderLeft: "1px solid #2e2e2e" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid #2e2e2e" }}>
        <span className="text-sm font-semibold text-white">Chat</span>
        {onClose && (
          <button onClick={onClose} className="rounded p-1 text-white/40 hover:text-white transition-colors" aria-label="Fermer">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto scrollbar-hide px-3 py-3 space-y-3">
        {messages.length === 0 && (
          <p className="text-center text-xs text-white/25 mt-6">
            Aucun message pour l'instant
          </p>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col gap-0.5 ${msg.from === "me" ? "items-end" : "items-start"}`}>
            <span className="text-[10px] text-white/30">{msg.from === "me" ? "Vous" : "Partenaire"}</span>
            <div
              className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                msg.from === "me"
                  ? "rounded-br-sm bg-[#2d6ade] text-white"
                  : "rounded-bl-sm bg-[#2e2e2e] text-white/90"
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="px-3 py-3" style={{ borderTop: "1px solid #2e2e2e" }}>
        <div className="flex gap-2 rounded-xl bg-[#2e2e2e] px-3 py-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={disabled}
            placeholder={disabled ? "En attente de connexion…" : "Envoyer un message…"}
            maxLength={500}
            className="flex-1 bg-transparent text-sm text-white placeholder-white/30 outline-none disabled:opacity-40"
          />
          <button
            type="submit"
            disabled={!input.trim() || disabled}
            className="text-white/40 hover:text-white disabled:opacity-30 transition-colors"
            aria-label="Envoyer"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
}
