import type { Server as SocketIOServer, Socket } from "socket.io";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from "@/game/types";
import * as roomManager from "./room-manager";
import * as matchmaking from "./matchmaking";
import * as engine from "./game-engine";
import { prisma } from "@/lib/db";

type GameServer = SocketIOServer<ClientToServerEvents, ServerToClientEvents>;
type GameSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

// Map socket IDs to authenticated user info
const socketUsers = new Map<
  string,
  { userId: string; username: string; rating: number }
>();

// Map socket IDs to their current game room
const socketGames = new Map<string, string>();

export function registerHandlers(io: GameServer): void {
  io.on("connection", (socket) => {
    console.log(`Player connected: ${socket.id}`);

    socket.on("auth:identify", async (data) => {
      await handleIdentify(socket, data);
    });

    socket.on("matchmaking:join", async (data) => {
      await handleMatchmakingJoin(io, socket, data);
    });

    socket.on("matchmaking:cancel", async () => {
      await handleMatchmakingCancel(socket);
    });

    socket.on("matchmaking:invite-create", async () => {
      await handleInviteCreate(io, socket);
    });

    socket.on("matchmaking:invite-join", async (data) => {
      await handleInviteJoin(io, socket, data);
    });

    socket.on("game:bid", async (data) => {
      await handleBid(io, socket, data);
    });

    socket.on("game:submit-word", async (data) => {
      await handleWordSubmit(io, socket, data);
    });

    socket.on("game:leave", async () => {
      await handleLeave(io, socket);
    });

    socket.on("disconnect", async (reason) => {
      console.log(`Player disconnected: ${socket.id} (${reason})`);
      await handleDisconnect(io, socket);
    });
  });
}

async function handleIdentify(
  socket: GameSocket,
  data: { userId: string; token: string }
): Promise<void> {
  try {
    // Look up user in database to validate
    const user = await prisma.user.findUnique({
      where: { id: data.userId },
      select: { id: true, username: true, name: true, rating: true },
    });

    if (!user) {
      socket.emit("game:error", { message: "User not found" });
      return;
    }

    socketUsers.set(socket.id, {
      userId: user.id,
      username: user.username ?? user.name ?? "Player",
      rating: user.rating,
    });

    // Check for existing game session (reconnection)
    const session = await roomManager.getPlayerSession(user.id);
    if (session) {
      const room = await roomManager.markPlayerReconnected(
        session.gameId,
        user.id,
        socket.id
      );
      if (room && room.status !== "completed") {
        socket.join(room.id);
        socketGames.set(socket.id, room.id);
        engine.cancelReconnectTimer(room.id, user.id);
        socket.emit("game:state", room);
        socket.to(room.id).emit("game:player-reconnected", { userId: user.id });
        return;
      }
    }
  } catch (err) {
    console.error("Identify error:", err);
    socket.emit("game:error", { message: "Authentication failed" });
  }
}

async function handleMatchmakingJoin(
  io: GameServer,
  socket: GameSocket,
  data: { mode: "ranked" | "casual" }
): Promise<void> {
  const user = socketUsers.get(socket.id);
  if (!user) {
    socket.emit("matchmaking:error", { message: "Not authenticated" });
    return;
  }

  // Check if already in a game
  if (socketGames.has(socket.id)) {
    socket.emit("matchmaking:error", { message: "Already in a game" });
    return;
  }

  const entry: matchmaking.QueueEntry = {
    userId: user.userId,
    socketId: socket.id,
    username: user.username,
    rating: user.rating,
    joinedAt: Date.now(),
  };

  // Try to find a match
  const match =
    data.mode === "ranked"
      ? await matchmaking.findRankedMatch(user.userId, user.rating)
      : await matchmaking.findCasualMatch(user.userId);

  if (match) {
    // Found a match — create game room
    const room = await roomManager.createRoom(data.mode, {
      userId: user.userId,
      socketId: socket.id,
      username: user.username,
      rating: user.rating,
    });

    await roomManager.addPlayerToRoom(room.id, {
      userId: match.userId,
      socketId: match.socketId,
      username: match.username,
      rating: match.rating,
    });

    // Join socket.io room
    socket.join(room.id);
    const matchSocket = io.sockets.sockets.get(match.socketId);
    if (matchSocket) {
      matchSocket.join(room.id);
      socketGames.set(match.socketId, room.id);
    }
    socketGames.set(socket.id, room.id);

    // Notify both players
    io.to(room.id).emit("matchmaking:matched", { gameId: room.id });

    // Reload room with both players and start
    const fullRoom = await roomManager.getRoom(room.id);
    if (fullRoom) {
      await engine.startGame(io, fullRoom);
    }
  } else {
    // No match found — join the queue
    if (data.mode === "ranked") {
      await matchmaking.joinRankedQueue(entry);
    } else {
      await matchmaking.joinCasualQueue(entry);
    }
    socket.emit("matchmaking:searching");
  }
}

async function handleMatchmakingCancel(socket: GameSocket): Promise<void> {
  const user = socketUsers.get(socket.id);
  if (!user) return;

  await matchmaking.leaveQueue(user.userId);
  socket.emit("matchmaking:cancelled");
}

async function handleInviteCreate(
  io: GameServer,
  socket: GameSocket
): Promise<void> {
  const user = socketUsers.get(socket.id);
  if (!user) {
    socket.emit("matchmaking:error", { message: "Not authenticated" });
    return;
  }

  if (socketGames.has(socket.id)) {
    socket.emit("matchmaking:error", { message: "Already in a game" });
    return;
  }

  // Create a waiting room
  const room = await roomManager.createRoom("casual", {
    userId: user.userId,
    socketId: socket.id,
    username: user.username,
    rating: user.rating,
  });

  // Generate invite code
  const code = await roomManager.createInvite(room.id);
  room.inviteCode = code;
  await roomManager.saveRoom(room);

  socket.join(room.id);
  socketGames.set(socket.id, room.id);
  socket.emit("matchmaking:invite-created", { code });
}

async function handleInviteJoin(
  io: GameServer,
  socket: GameSocket,
  data: { code: string }
): Promise<void> {
  const user = socketUsers.get(socket.id);
  if (!user) {
    socket.emit("matchmaking:error", { message: "Not authenticated" });
    return;
  }

  if (socketGames.has(socket.id)) {
    socket.emit("matchmaking:error", { message: "Already in a game" });
    return;
  }

  const gameId = await roomManager.resolveInvite(data.code);
  if (!gameId) {
    socket.emit("matchmaking:error", {
      message: "Invalid or expired invite code",
    });
    return;
  }

  const room = await roomManager.addPlayerToRoom(gameId, {
    userId: user.userId,
    socketId: socket.id,
    username: user.username,
    rating: user.rating,
  });

  if (!room) {
    socket.emit("matchmaking:error", { message: "Game room is full or closed" });
    return;
  }

  // Clean up invite code
  await roomManager.deleteInvite(data.code);

  socket.join(room.id);
  socketGames.set(socket.id, room.id);

  io.to(room.id).emit("matchmaking:matched", { gameId: room.id });

  // Start the game
  await engine.startGame(io, room);
}

async function handleBid(
  io: GameServer,
  socket: GameSocket,
  data: { bid: number }
): Promise<void> {
  const user = socketUsers.get(socket.id);
  if (!user) return;

  const gameId = socketGames.get(socket.id);
  if (!gameId) return;

  await engine.handleBid(io, gameId, user.userId, data.bid);
}

async function handleWordSubmit(
  io: GameServer,
  socket: GameSocket,
  data: { word: string }
): Promise<void> {
  const user = socketUsers.get(socket.id);
  if (!user) return;

  const gameId = socketGames.get(socket.id);
  if (!gameId) return;

  await engine.handleWordSubmission(io, socket, gameId, user.userId, data.word);
}

async function handleLeave(
  io: GameServer,
  socket: GameSocket
): Promise<void> {
  const user = socketUsers.get(socket.id);
  if (!user) return;

  const gameId = socketGames.get(socket.id);
  if (!gameId) return;

  const room = await roomManager.getRoom(gameId);
  if (!room) return;

  // If game is in progress, treat as forfeit
  if (room.status !== "waiting" && room.status !== "completed") {
    socket.to(room.id).emit("game:opponent-left");
  }

  await roomManager.removePlayerFromRoom(gameId, user.userId);
  socket.leave(gameId);
  socketGames.delete(socket.id);
}

async function handleDisconnect(
  io: GameServer,
  socket: GameSocket
): Promise<void> {
  const user = socketUsers.get(socket.id);
  if (!user) {
    socketUsers.delete(socket.id);
    return;
  }

  // Remove from matchmaking queue
  await matchmaking.leaveQueue(user.userId);

  const gameId = socketGames.get(socket.id);
  if (gameId) {
    const room = await roomManager.getRoom(gameId);
    if (room && room.status !== "completed") {
      if (room.status === "waiting") {
        // Game hasn't started — just remove them
        await roomManager.removePlayerFromRoom(gameId, user.userId);
      } else {
        // Game in progress — mark disconnected and start reconnect timer
        await roomManager.markPlayerDisconnected(gameId, user.userId);
        socket
          .to(gameId)
          .emit("game:player-disconnected", { userId: user.userId });
        engine.startReconnectTimer(io, gameId, user.userId);
      }
    }
  }

  socketGames.delete(socket.id);
  socketUsers.delete(socket.id);
}
