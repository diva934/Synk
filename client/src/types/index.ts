// ─── Connection status ────────────────────────────────────────────────────────

export type ConnectionStatus = "searching" | "connected" | "partner-left" | "error";

// ─── Chat ─────────────────────────────────────────────────────────────────────

export interface ChatMessage {
  id: string;
  from: "me" | "partner";
  text: string;
  timestamp: number;
}

// ─── Socket events (client-side types) ───────────────────────────────────────

export interface MatchedPayload {
  roomId: string;
  isInitiator: boolean;
}

export interface OfferPayload {
  offer: RTCSessionDescriptionInit;
}

export interface AnswerPayload {
  answer: RTCSessionDescriptionInit;
}

export interface IceCandidatePayload {
  candidate: RTCIceCandidateInit;
}

export interface ChatMessagePayload {
  message: string;
}

// ─── Media preferences (chosen on home page) ─────────────────────────────────

export interface MediaPreferences {
  video: boolean;
  audio: boolean;
}
