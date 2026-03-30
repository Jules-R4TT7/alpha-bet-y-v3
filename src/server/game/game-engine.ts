import type { Server as SocketIOServer, Socket } from "socket.io";
import type {
  GameRoom,
  RoundResult,
  ClientToServerEvents,
  ServerToClientEvents,
} from "@/game/types";
import { LETTER_TIERS, GAME_DEFAULTS, scoreWord } from "@/game/constants";
import { validateWord } from "./word-validator";
import * as roomManager from "./room-manager";
import { prisma } from "@/lib/db";

type GameServer = SocketIOServer<ClientToServerEvents, ServerToClientEvents>;

// Active timers for games (in-memory, tied to this server process)
const gameTimers = new Map<string, NodeJS.Timeout>();
const reconnectTimers = new Map<string, NodeJS.Timeout>();

function getAllLetters(): string[] {
  const letters: string[] = [];
  for (const tier of Object.values(LETTER_TIERS)) {
    letters.push(...tier.letters);
  }
  return letters;
}

function pickRandomLetter(usedLetters: string[]): string {
  const all = getAllLetters();
  const available = all.filter((l) => !usedLetters.includes(l));
  if (available.length === 0) {
    // All letters used; allow repeats
    return all[Math.floor(Math.random() * all.length)];
  }
  return available[Math.floor(Math.random() * available.length)];
}

export async function startGame(
  io: GameServer,
  room: GameRoom
): Promise<void> {
  room.status = "bidding";
  room.currentRound = 1;

  const usedLetters = room.roundResults.map((r) => r.letter);
  room.currentLetter = pickRandomLetter(usedLetters);

  // Reset per-round state
  for (const player of room.players) {
    player.currentBid = null;
    player.wordsThisRound = [];
  }

  await roomManager.saveRoom(room);

  // Notify players: round starting with bidding phase
  io.to(room.id).emit("game:state", room);
  io.to(room.id).emit("game:round-start", {
    round: room.currentRound,
    letter: room.currentLetter,
    timeLimit: room.roundTimeLimit,
  });

  // Auto-advance from bidding after 15 seconds if not all bids received
  const biddingTimer = setTimeout(() => {
    autoBid(io, room.id);
  }, 15000);
  gameTimers.set(`${room.id}:bid`, biddingTimer);
}

async function autoBid(io: GameServer, gameId: string): Promise<void> {
  const room = await roomManager.getRoom(gameId);
  if (!room || room.status !== "bidding") return;

  // Auto-assign default bid to players who haven't bid
  for (const player of room.players) {
    if (player.currentBid === null) {
      player.currentBid = GAME_DEFAULTS.defaultBid;
    }
  }

  await transitionToPlaying(io, room);
}

export async function handleBid(
  io: GameServer,
  gameId: string,
  userId: string,
  bid: number
): Promise<void> {
  const room = await roomManager.getRoom(gameId);
  if (!room || room.status !== "bidding") return;

  const player = room.players.find((p) => p.userId === userId);
  if (!player || player.currentBid !== null) return;

  // Clamp bid to valid range
  player.currentBid = Math.max(
    GAME_DEFAULTS.minBid,
    Math.min(GAME_DEFAULTS.maxBid, Math.round(bid))
  );
  await roomManager.saveRoom(room);

  // Notify that a bid was received (don't reveal the value)
  io.to(room.id).emit("game:bid-received", { userId });

  // Check if all players have bid
  if (room.players.every((p) => p.currentBid !== null)) {
    clearGameTimer(`${gameId}:bid`);
    await transitionToPlaying(io, room);
  }
}

async function transitionToPlaying(
  io: GameServer,
  room: GameRoom
): Promise<void> {
  room.status = "playing";
  room.roundStartedAt = Date.now();
  await roomManager.saveRoom(room);

  // Reveal all bids
  const bids: Record<string, number> = {};
  for (const p of room.players) {
    bids[p.userId] = p.currentBid ?? GAME_DEFAULTS.defaultBid;
  }
  io.to(room.id).emit("game:bids-revealed", { bids });
  io.to(room.id).emit("game:state", room);

  // Start round timer
  let secondsLeft = room.roundTimeLimit;
  const timerInterval = setInterval(() => {
    secondsLeft--;
    io.to(room.id).emit("game:timer", { secondsLeft });
    if (secondsLeft <= 0) {
      clearInterval(timerInterval);
      endRound(io, room.id);
    }
  }, 1000);
  gameTimers.set(`${room.id}:round`, timerInterval);
}

export async function handleWordSubmission(
  io: GameServer,
  socket: Socket<ClientToServerEvents, ServerToClientEvents>,
  gameId: string,
  userId: string,
  word: string
): Promise<void> {
  const room = await roomManager.getRoom(gameId);
  if (!room || room.status !== "playing" || !room.currentLetter) return;

  const player = room.players.find((p) => p.userId === userId);
  if (!player) return;

  // Collect all words played in this round by ALL players (for duplicate checking across players)
  const allWordsThisRound = room.players.flatMap((p) => p.wordsThisRound);

  const result = validateWord(word, room.currentLetter, allWordsThisRound);

  if (!result.valid) {
    socket.emit("game:word-rejected", {
      word,
      reason: result.reason ?? "Invalid word",
    });
    return;
  }

  const cleaned = word.trim().toLowerCase();
  const points = scoreWord(cleaned);
  player.wordsThisRound.push({ word: cleaned, points });
  await roomManager.saveRoom(room);

  // Broadcast accepted word to all players
  io.to(room.id).emit("game:word-accepted", {
    userId,
    word: cleaned,
    points,
  });
}

async function endRound(io: GameServer, gameId: string): Promise<void> {
  clearGameTimer(`${gameId}:round`);

  const room = await roomManager.getRoom(gameId);
  if (!room) return;

  // Calculate round scores
  const roundResult: RoundResult = {
    round: room.currentRound,
    letter: room.currentLetter!,
    players: {},
  };

  for (const player of room.players) {
    const wordPoints = player.wordsThisRound.reduce(
      (sum, w) => sum + w.points,
      0
    );
    const bid = player.currentBid ?? GAME_DEFAULTS.defaultBid;

    // Bidding scoring: if you meet/exceed your bid, you get bid + word points.
    // If you fall short, you only get the word points (no bid bonus).
    const metBid = wordPoints >= bid;
    const roundScore = metBid ? bid + wordPoints : wordPoints;

    player.score += roundScore;
    roundResult.players[player.userId] = {
      bid,
      words: [...player.wordsThisRound],
      roundScore,
    };
  }

  room.roundResults.push(roundResult);
  io.to(room.id).emit("game:round-end", roundResult);

  // Check if game is complete
  if (room.currentRound >= room.totalRounds) {
    await completeGame(io, room);
  } else {
    // Start next round after a brief pause
    room.currentRound++;
    room.status = "bidding";
    room.roundStartedAt = null;

    const usedLetters = room.roundResults.map((r) => r.letter);
    room.currentLetter = pickRandomLetter(usedLetters);

    for (const player of room.players) {
      player.currentBid = null;
      player.wordsThisRound = [];
    }

    await roomManager.saveRoom(room);

    // Brief pause before next round
    setTimeout(() => {
      io.to(room.id).emit("game:round-start", {
        round: room.currentRound,
        letter: room.currentLetter!,
        timeLimit: room.roundTimeLimit,
      });
      io.to(room.id).emit("game:state", room);

      // Start bidding timer for next round
      const biddingTimer = setTimeout(() => {
        autoBid(io, room.id);
      }, 15000);
      gameTimers.set(`${room.id}:bid`, biddingTimer);
    }, 3000);
  }
}

async function completeGame(
  io: GameServer,
  room: GameRoom
): Promise<void> {
  room.status = "completed";
  await roomManager.saveRoom(room);

  const finalScores: Record<string, number> = {};
  const results: Record<string, "win" | "loss" | "draw"> = {};
  const ratingChanges: Record<string, number> = {};

  for (const p of room.players) {
    finalScores[p.userId] = p.score;
  }

  // Determine winner
  const sorted = [...room.players].sort((a, b) => b.score - a.score);
  if (sorted.length === 2) {
    if (sorted[0].score > sorted[1].score) {
      results[sorted[0].userId] = "win";
      results[sorted[1].userId] = "loss";
    } else {
      results[sorted[0].userId] = "draw";
      results[sorted[1].userId] = "draw";
    }
  }

  // Calculate ELO-style rating changes for ranked games
  if (room.mode === "ranked" && sorted.length === 2) {
    const K = 32;
    const rA = sorted[0].rating;
    const rB = sorted[1].rating;
    const expectedA = 1 / (1 + Math.pow(10, (rB - rA) / 400));
    const expectedB = 1 - expectedA;

    const scoreA = results[sorted[0].userId] === "win" ? 1 : results[sorted[0].userId] === "draw" ? 0.5 : 0;
    const scoreB = 1 - scoreA;

    ratingChanges[sorted[0].userId] = Math.round(K * (scoreA - expectedA));
    ratingChanges[sorted[1].userId] = Math.round(K * (scoreB - expectedB));
  }

  io.to(room.id).emit("game:completed", {
    finalScores,
    results,
    ratingChanges,
  });

  // Persist to database
  await persistGameResults(room, results, ratingChanges);

  // Clean up
  for (const p of room.players) {
    await roomManager.clearPlayerSession(p.userId);
  }
  clearAllGameTimers(room.id);
}

async function persistGameResults(
  room: GameRoom,
  results: Record<string, "win" | "loss" | "draw">,
  ratingChanges: Record<string, number>
): Promise<void> {
  try {
    const resultMap = { win: "WIN", loss: "LOSS", draw: "DRAW" } as const;

    await prisma.$transaction(async (tx) => {
      // Create the game record
      const game = await tx.game.create({
        data: {
          status: "COMPLETED",
          mode: room.mode === "ranked" ? "RANKED" : "CASUAL",
          rounds: room.totalRounds,
          timeLimit: room.roundTimeLimit,
          currentRound: room.totalRounds,
          startedAt: new Date(room.createdAt),
          completedAt: new Date(),
        },
      });

      // Create player records and words
      for (const player of room.players) {
        const gamePlayer = await tx.gamePlayer.create({
          data: {
            gameId: game.id,
            userId: player.userId,
            score: player.score,
            result: resultMap[results[player.userId]] ?? "DRAW",
          },
        });

        // Create word records for each round
        for (const roundResult of room.roundResults) {
          const playerRound = roundResult.players[player.userId];
          if (!playerRound) continue;
          for (const wordEntry of playerRound.words) {
            await tx.gameWord.create({
              data: {
                gamePlayerId: gamePlayer.id,
                word: wordEntry.word,
                round: roundResult.round,
                points: wordEntry.points,
              },
            });
          }
        }

        // Update user stats
        const isWin = results[player.userId] === "win";
        const ratingChange = ratingChanges[player.userId] ?? 0;

        await tx.user.update({
          where: { id: player.userId },
          data: {
            gamesPlayed: { increment: 1 },
            gamesWon: isWin ? { increment: 1 } : undefined,
            totalScore: { increment: player.score },
            rating: { increment: ratingChange },
            streak: isWin ? { increment: 1 } : 0,
            bestStreak: isWin
              ? {
                  // Update bestStreak only if current streak+1 exceeds it
                  // We handle this with a raw query below
                  increment: 0,
                }
              : undefined,
          },
        });

        // Update best streak if needed
        if (isWin) {
          await tx.$executeRaw`
            UPDATE "User"
            SET "bestStreak" = GREATEST("bestStreak", "streak")
            WHERE id = ${player.userId}
          `;
        }
      }
    });
  } catch (err) {
    console.error("Failed to persist game results:", err);
  }
}

// Disconnect handling
export function startReconnectTimer(
  io: GameServer,
  gameId: string,
  userId: string
): void {
  const timerId = setTimeout(async () => {
    reconnectTimers.delete(`${gameId}:${userId}`);
    const room = await roomManager.getRoom(gameId);
    if (!room) return;

    const player = room.players.find((p) => p.userId === userId);
    if (!player || player.connected) return;

    // Player didn't reconnect — forfeit the game
    // Remove disconnected player and award win to opponent
    const opponent = room.players.find((p) => p.userId !== userId);
    if (opponent) {
      const results: Record<string, "win" | "loss" | "draw"> = {
        [opponent.userId]: "win",
        [userId]: "loss",
      };
      const ratingChanges: Record<string, number> = {};
      if (room.mode === "ranked") {
        const K = 32;
        const rA = opponent.rating;
        const rB = player.rating;
        const expectedA = 1 / (1 + Math.pow(10, (rB - rA) / 400));
        ratingChanges[opponent.userId] = Math.round(K * (1 - expectedA));
        ratingChanges[userId] = Math.round(K * (0 - (1 - expectedA)));
      }

      room.status = "completed";
      await roomManager.saveRoom(room);

      io.to(room.id).emit("game:completed", {
        finalScores: {
          [opponent.userId]: opponent.score,
          [userId]: player.score,
        },
        results,
        ratingChanges,
      });

      await persistGameResults(room, results, ratingChanges);
    }

    clearAllGameTimers(gameId);
    for (const p of room.players) {
      await roomManager.clearPlayerSession(p.userId);
    }
  }, roomManager.RECONNECT_WINDOW * 1000);

  reconnectTimers.set(`${gameId}:${userId}`, timerId);
}

export function cancelReconnectTimer(
  gameId: string,
  userId: string
): void {
  const key = `${gameId}:${userId}`;
  const timer = reconnectTimers.get(key);
  if (timer) {
    clearTimeout(timer);
    reconnectTimers.delete(key);
  }
}

function clearGameTimer(key: string): void {
  const timer = gameTimers.get(key);
  if (timer) {
    clearTimeout(timer);
    clearInterval(timer);
    gameTimers.delete(key);
  }
}

function clearAllGameTimers(gameId: string): void {
  for (const [key, timer] of gameTimers.entries()) {
    if (key.startsWith(gameId)) {
      clearTimeout(timer);
      clearInterval(timer);
      gameTimers.delete(key);
    }
  }
}
