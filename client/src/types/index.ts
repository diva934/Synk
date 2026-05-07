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

export interface CameraStatePayload {
  isCameraOff: boolean;
}

export interface ChatMessagePayload {
  message: string;
}

// ─── Media preferences (chosen on home page) ─────────────────────────────────

export interface MediaPreferences {
  video: boolean;
  audio: boolean;
  matching: MatchingPreferences;
}

export type Gender = "any" | "female" | "male";
export type Country = "any" | "FR" | "BE" | "CH" | "CA" | "US" | "GB" | "DE" | "ES" | "IT" | "MA" | "DZ" | "TN";

export interface MatchProfile {
  gender: Exclude<Gender, "any">;
  country: Exclude<Country, "any">;
}

export interface MatchFilters {
  gender: Gender;
  country: Country;
}

export interface MatchingPreferences {
  profile: MatchProfile;
  filters: MatchFilters;
}
