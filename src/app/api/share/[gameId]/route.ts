import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { trackEvent } from "@/lib/analytics";

// GET /api/share/[gameId] — get shareable game result data
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ gameId: string }> }
) {
  const { gameId } = await params;

  const game = await prisma.game.findUnique({
    where: { id: gameId },
    include: {
      players: {
        include: {
          user: {
            select: { id: true, username: true, name: true },
          },
          words: { orderBy: { round: "asc" } },
        },
      },
    },
  });

  if (!game || game.status !== "COMPLETED") {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }

  const players = game.players.map((p) => ({
    username: p.user.username ?? p.user.name ?? "Player",
    score: p.score,
    result: p.result,
    wordCount: p.words.length,
  }));

  // Generate share text
  const winner = players.find((p) => p.result === "WIN");
  const shareText = winner
    ? `I scored ${winner.score} pts on Alpha-bet-y! Can you beat me? 🎯`
    : `It was a draw at ${players[0]?.score} pts on Alpha-bet-y! 🤝`;

  trackEvent(gameId, "share_clicked", {
    gameId: game.id,
    mode: game.mode,
  });

  return NextResponse.json({
    gameId: game.id,
    mode: game.mode,
    rounds: game.rounds,
    completedAt: game.completedAt,
    players,
    shareText,
  });
}
