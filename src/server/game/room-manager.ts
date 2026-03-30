import { redis } from "@/lib/redis";
import type { GameRoom, PlayerState } from "@/game/types";
import { GAME_DEFAULTS } from "@/game/constants";
import { randomUUID } from "crypto";

const GAME_KEY = (id: string) => `game:${id}`;
const PLAYER_SESSION_KEY = (userId: string) => `player:session:${userId}`;
const INVITE_KEY = (code: string) => `invite:${code}`;
const GAME_TTL = 3600; // 1 hour
const INVITE_TTL = 300; // 5 minutes
const RECONNECT_WINDOW = 30; // seconds

export async function createRoom(
  mode: "ranked" | "casual",
  player: Omit<PlayerState, "score" | "currentBid" | "wordsThisRound" | "connected" | "disconnectedAt">
): Promise<GameRoom> {
  const room: GameRoom = {
    id: randomUUID(),
    status: "waiting",
    mode,
    players: [
      {
        ...player,
        score: 0,
        currentBid: null,
        wordsThisRound: [],
        connected: true,
        disconnectedAt: null,
      },
    ],
    currentRound: 0,
    totalRounds: GAME_DEFAULTS.totalRounds,
    currentLetter: null,
    roundTimeLimit: GAME_DEFAULTS.roundTimeSeconds,
    roundStartedAt: null,
    roundResults: [],
    inviteCode: null,
    createdAt: Date.now(),
  };

  await saveRoom(room);
  await setPlayerSession(player.userId, room.id, player.socketId);
  return room;
}

export async function getRoom(gameId: string): Promise<GameRoom | null> {
  const data = await redis.get(GAME_KEY(gameId));
  if (!data) return null;
  return JSON.parse(data) as GameRoom;
}

export async function saveRoom(room: GameRoom): Promise<void> {
  await redis.set(GAME_KEY(room.id), JSON.stringify(room), "EX", GAME_TTL);
}

export async function deleteRoom(gameId: string): Promise<void> {
  await redis.del(GAME_KEY(gameId));
}

export async function addPlayerToRoom(
  gameId: string,
  player: Omit<PlayerState, "score" | "currentBid" | "wordsThisRound" | "connected" | "disconnectedAt">
): Promise<GameRoom | null> {
  const room = await getRoom(gameId);
  if (!room) return null;
  if (room.players.length >= 2) return null;
  if (room.status !== "waiting") return null;

  room.players.push({
    ...player,
    score: 0,
    currentBid: null,
    wordsThisRound: [],
    connected: true,
    disconnectedAt: null,
  });

  await saveRoom(room);
  await setPlayerSession(player.userId, room.id, player.socketId);
  return room;
}

export async function removePlayerFromRoom(
  gameId: string,
  userId: string
): Promise<GameRoom | null> {
  const room = await getRoom(gameId);
  if (!room) return null;

  room.players = room.players.filter((p) => p.userId !== userId);
  await clearPlayerSession(userId);

  if (room.players.length === 0) {
    await deleteRoom(gameId);
    return null;
  }

  await saveRoom(room);
  return room;
}

export async function markPlayerDisconnected(
  gameId: string,
  userId: string
): Promise<GameRoom | null> {
  const room = await getRoom(gameId);
  if (!room) return null;

  const player = room.players.find((p) => p.userId === userId);
  if (!player) return null;

  player.connected = false;
  player.disconnectedAt = Date.now();
  await saveRoom(room);
  return room;
}

export async function markPlayerReconnected(
  gameId: string,
  userId: string,
  newSocketId: string
): Promise<GameRoom | null> {
  const room = await getRoom(gameId);
  if (!room) return null;

  const player = room.players.find((p) => p.userId === userId);
  if (!player) return null;

  // Check if reconnect window has passed
  if (
    player.disconnectedAt &&
    Date.now() - player.disconnectedAt > RECONNECT_WINDOW * 1000
  ) {
    return null;
  }

  player.connected = true;
  player.disconnectedAt = null;
  player.socketId = newSocketId;
  await saveRoom(room);
  await setPlayerSession(userId, gameId, newSocketId);
  return room;
}

// Player session tracking for reconnection
export async function setPlayerSession(
  userId: string,
  gameId: string,
  socketId: string
): Promise<void> {
  await redis.set(
    PLAYER_SESSION_KEY(userId),
    JSON.stringify({ gameId, socketId }),
    "EX",
    GAME_TTL
  );
}

export async function getPlayerSession(
  userId: string
): Promise<{ gameId: string; socketId: string } | null> {
  const data = await redis.get(PLAYER_SESSION_KEY(userId));
  if (!data) return null;
  return JSON.parse(data);
}

export async function clearPlayerSession(userId: string): Promise<void> {
  await redis.del(PLAYER_SESSION_KEY(userId));
}

// Invite code management
export function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous chars
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function createInvite(
  gameId: string
): Promise<string> {
  const code = generateInviteCode();
  await redis.set(INVITE_KEY(code), gameId, "EX", INVITE_TTL);
  return code;
}

export async function resolveInvite(code: string): Promise<string | null> {
  const gameId = await redis.get(INVITE_KEY(code.toUpperCase()));
  return gameId;
}

export async function deleteInvite(code: string): Promise<void> {
  await redis.del(INVITE_KEY(code.toUpperCase()));
}

export { RECONNECT_WINDOW };
