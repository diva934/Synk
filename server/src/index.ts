import express from "express";
import { createServer } from "http";
import { Server, Socket } from "socket.io";
import cors from "cors";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Room {
  users: [string, string]; // [socketId1, socketId2]
}

type Gender = "any" | "female" | "male";
type Country = "any" | "FR" | "BE" | "CH" | "CA" | "US" | "GB" | "DE" | "ES" | "IT" | "MA" | "DZ" | "TN";

interface MatchProfile {
  gender: Exclude<Gender, "any">;
  country: Exclude<Country, "any">;
}

interface MatchFilters {
  gender: Gender;
  country: Country;
}

interface MatchingPreferences {
  profile: MatchProfile;
  filters: MatchFilters;
}

const DEFAULT_MATCHING: MatchingPreferences = {
  profile: { gender: "male", country: "FR" },
  filters: { gender: "any", country: "any" },
};

const PROFILE_GENDERS = new Set<MatchProfile["gender"]>(["female", "male"]);
const FILTER_GENDERS = new Set<Gender>(["any", "female", "male"]);
const PROFILE_COUNTRIES = new Set<MatchProfile["country"]>([
  "FR",
  "BE",
  "CH",
  "CA",
  "US",
  "GB",
  "DE",
  "ES",
  "IT",
  "MA",
  "DZ",
  "TN",
]);
const FILTER_COUNTRIES = new Set<Country>(["any", ...PROFILE_COUNTRIES]);

// ─── App setup ────────────────────────────────────────────────────────────────

const app = express();
app.use(cors());

const httpServer = createServer(app);

const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

const io = new Server(httpServer, {
  cors: {
    origin: CLIENT_URL,
    methods: ["GET", "POST"],
  },
  pingInterval: 25000,
  pingTimeout: 120000,
});

// ─── State ────────────────────────────────────────────────────────────────────

// Queue of socket IDs waiting to be matched
const waitingQueue: string[] = [];

// roomId → Room (holds the two participants)
const rooms = new Map<string, Room>();

// socketId → roomId (reverse lookup)
const socketToRoom = new Map<string, string>();

const socketPreferences = new Map<string, MatchingPreferences>();

let onlineCount = 0;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateRoomId(): string {
  return Math.random().toString(36).slice(2, 11) + Date.now().toString(36);
}

/**
 * Match two users into a room and emit the 'matched' event to both.
 * The user passed as `initiatorId` will be told to create the WebRTC offer.
 * The user passed as `receiverId` will wait for the offer.
 */
function matchUsers(initiatorId: string, receiverId: string): void {
  const roomId = generateRoomId();
  rooms.set(roomId, { users: [initiatorId, receiverId] });
  socketToRoom.set(initiatorId, roomId);
  socketToRoom.set(receiverId, roomId);

  io.to(initiatorId).emit("matched", { roomId, isInitiator: true });
  io.to(receiverId).emit("matched", { roomId, isInitiator: false });
}

/**
 * Remove a socket from its current room, notify the partner,
 * and clean up all room state. Does NOT re-queue either user.
 */
function leaveCurrentRoom(socketId: string): void {
  const roomId = socketToRoom.get(socketId);
  if (!roomId) return;

  const room = rooms.get(roomId);
  if (room) {
    const partner = room.users.find((id) => id !== socketId);
    if (partner) {
      // Notify the partner that their peer has left
      io.to(partner).emit("partner-left");
      socketToRoom.delete(partner);
    }
  }

  rooms.delete(roomId);
  socketToRoom.delete(socketId);
}

/** Remove a socket from the waiting queue (idempotent). */
function removeFromQueue(socketId: string): void {
  const idx = waitingQueue.indexOf(socketId);
  if (idx !== -1) waitingQueue.splice(idx, 1);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function sanitizePreferences(input: unknown): MatchingPreferences {
  if (!isRecord(input)) return DEFAULT_MATCHING;

  const profile = isRecord(input.profile) ? input.profile : {};
  const filters = isRecord(input.filters) ? input.filters : {};

  const profileGender = PROFILE_GENDERS.has(profile.gender as MatchProfile["gender"])
    ? (profile.gender as MatchProfile["gender"])
    : DEFAULT_MATCHING.profile.gender;
  const profileCountry = PROFILE_COUNTRIES.has(profile.country as MatchProfile["country"])
    ? (profile.country as MatchProfile["country"])
    : DEFAULT_MATCHING.profile.country;
  const filterGender = FILTER_GENDERS.has(filters.gender as Gender)
    ? (filters.gender as Gender)
    : DEFAULT_MATCHING.filters.gender;
  const filterCountry = FILTER_COUNTRIES.has(filters.country as Country)
    ? (filters.country as Country)
    : DEFAULT_MATCHING.filters.country;

  return {
    profile: { gender: profileGender, country: profileCountry },
    filters: { gender: filterGender, country: filterCountry },
  };
}

function accepts<T extends string>(filter: T | "any", value: T): boolean {
  return filter === "any" || filter === value;
}

function areCompatible(a: MatchingPreferences, b: MatchingPreferences): boolean {
  return (
    accepts(a.filters.gender, b.profile.gender) &&
    accepts(a.filters.country, b.profile.country) &&
    accepts(b.filters.gender, a.profile.gender) &&
    accepts(b.filters.country, a.profile.country)
  );
}

/**
 * Attempt to match the given socket with someone in the queue,
 * or add them to the queue if nobody is waiting.
 */
function joinQueue(socketId: string, preferences?: unknown): void {
  const sanitizedPreferences = sanitizePreferences(preferences);
  socketPreferences.set(socketId, sanitizedPreferences);
  removeFromQueue(socketId); // avoid duplicates

  const partnerIndex = waitingQueue.findIndex((partnerId) => {
    const partnerPreferences = socketPreferences.get(partnerId) || DEFAULT_MATCHING;
    return areCompatible(sanitizedPreferences, partnerPreferences);
  });

  if (partnerIndex !== -1) {
    const [partnerId] = waitingQueue.splice(partnerIndex, 1);
    // The new joiner becomes the initiator (creates the offer)
    matchUsers(socketId, partnerId);
  } else {
    waitingQueue.push(socketId);
    io.to(socketId).emit("searching");
  }
}

// ─── Socket.IO logic ──────────────────────────────────────────────────────────

io.on("connection", (socket: Socket) => {
  onlineCount++;
  io.emit("online-count", onlineCount);

  // ── Matching ────────────────────────────────────────────────────────────────

  socket.on("join-queue", (preferences: unknown) => {
    joinQueue(socket.id, preferences);
  });

  socket.on("leave-queue", () => {
    removeFromQueue(socket.id);
  });

  /**
   * "Next" flow:
   * 1. Leave current room (partner is notified)
   * 2. Immediately try to find a new partner
   */
  socket.on("next", (preferences: unknown) => {
    leaveCurrentRoom(socket.id);
    joinQueue(socket.id, preferences);
  });

  // ── WebRTC signaling ─────────────────────────────────────────────────────────
  //
  // The signaling server acts as a relay:
  //   Initiator  →  offer    →  Server  →  Receiver
  //   Receiver   →  answer   →  Server  →  Initiator
  //   Both sides →  ice-candidate → Server → peer
  //
  // All messages are forwarded only to the other user in the same room.

  function relayToPartner(roomId: string, event: string, payload: unknown): void {
    const room = rooms.get(roomId);
    if (!room) return;
    const partner = room.users.find((id) => id !== socket.id);
    if (partner) io.to(partner).emit(event, payload);
  }

  // The server treats signaling payloads as opaque blobs — no WebRTC types needed here.
  socket.on("offer", ({ offer, roomId }: { offer: unknown; roomId: string }) => {
    relayToPartner(roomId, "offer", { offer });
  });

  socket.on("answer", ({ answer, roomId }: { answer: unknown; roomId: string }) => {
    relayToPartner(roomId, "answer", { answer });
  });

  socket.on(
    "ice-candidate",
    ({ candidate, roomId }: { candidate: unknown; roomId: string }) => {
      relayToPartner(roomId, "ice-candidate", { candidate });
    }
  );

  // ── Chat ─────────────────────────────────────────────────────────────────────

  socket.on("camera-state", ({ isCameraOff, roomId }: { isCameraOff: unknown; roomId: string }) => {
    const room = rooms.get(roomId);
    if (!room || !room.users.includes(socket.id) || typeof isCameraOff !== "boolean") return;
    relayToPartner(roomId, "camera-state", { isCameraOff });
  });

  socket.on("chat-message", ({ message, roomId }: { message: string; roomId: string }) => {
    // Only relay if the sender is actually in the room
    const room = rooms.get(roomId);
    if (!room || !room.users.includes(socket.id)) return;
    relayToPartner(roomId, "chat-message", { message });
  });

  // ── Disconnect ───────────────────────────────────────────────────────────────

  socket.on("disconnect", () => {
    onlineCount = Math.max(0, onlineCount - 1);
    io.emit("online-count", onlineCount);
    removeFromQueue(socket.id);
    leaveCurrentRoom(socket.id);
    socketPreferences.delete(socket.id);
  });
});

// ─── Health check ─────────────────────────────────────────────────────────────

app.get("/health", (_req, res) => {
  res.json({ status: "ok", online: onlineCount, queued: waitingQueue.length });
});

// ─── Start ────────────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`[server] listening on http://localhost:${PORT}`);
  console.log(`[server] accepting connections from ${CLIENT_URL}`);
});
