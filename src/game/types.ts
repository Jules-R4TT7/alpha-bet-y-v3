// Shared types for game state — used by both client and server

export interface PlayerState {
  userId: string;
  socketId: string;
  username: string;
  rating: number;
  score: number;
  currentBid: number | null;
  wordsThisRound: WordEntry[];
  connected: boolean;
  disconnectedAt: number | null;
}

export interface WordEntry {
  word: string;
  points: number;
}

export interface RoundResult {
  round: number;
  letter: string;
  players: Record<string, { bid: number; words: WordEntry[]; roundScore: number }>;
}

export interface GameRoom {
  id: string;
  status: "waiting" | "bidding" | "playing" | "completed";
  mode: "ranked" | "casual";
  players: PlayerState[];
  currentRound: number;
  totalRounds: number;
  currentLetter: string | null;
  roundTimeLimit: number;
  roundStartedAt: number | null;
  roundResults: RoundResult[];
  inviteCode: string | null;
  createdAt: number;
}

// Socket.io event maps

export interface ClientToServerEvents {
  "matchmaking:join": (data: { mode: "ranked" | "casual" }) => void;
  "matchmaking:cancel": () => void;
  "matchmaking:invite-create": () => void;
  "matchmaking:invite-join": (data: { code: string }) => void;
  "game:bid": (data: { bid: number }) => void;
  "game:submit-word": (data: { word: string }) => void;
  "game:leave": () => void;
  "auth:identify": (data: { userId: string; token: string }) => void;
}

export interface ServerToClientEvents {
  "matchmaking:searching": () => void;
  "matchmaking:matched": (data: { gameId: string }) => void;
  "matchmaking:invite-created": (data: { code: string }) => void;
  "matchmaking:cancelled": () => void;
  "matchmaking:error": (data: { message: string }) => void;
  "game:state": (data: GameRoom) => void;
  "game:countdown": (data: { phase: string; seconds: number }) => void;
  "game:round-start": (data: {
    round: number;
    letter: string;
    timeLimit: number;
  }) => void;
  "game:bid-received": (data: { userId: string }) => void;
  "game:bids-revealed": (data: { bids: Record<string, number> }) => void;
  "game:word-accepted": (data: {
    userId: string;
    word: string;
    points: number;
  }) => void;
  "game:word-rejected": (data: { word: string; reason: string }) => void;
  "game:timer": (data: { secondsLeft: number }) => void;
  "game:round-end": (data: RoundResult) => void;
  "game:completed": (data: {
    finalScores: Record<string, number>;
    results: Record<string, "win" | "loss" | "draw">;
    ratingChanges: Record<string, number>;
  }) => void;
  "game:player-disconnected": (data: { userId: string }) => void;
  "game:player-reconnected": (data: { userId: string }) => void;
  "game:opponent-left": () => void;
  "game:error": (data: { message: string }) => void;
}
