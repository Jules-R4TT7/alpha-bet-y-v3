import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ gameId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { gameId } = await params;

  const game = await prisma.game.findUnique({
    where: { id: gameId },
    include: {
      players: {
        include: {
          user: {
            select: { id: true, username: true, name: true, image: true },
          },
          words: {
            orderBy: { round: "asc" },
          },
        },
      },
    },
  });

  if (!game) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }

  // Only allow players of the game to see full details
  const isPlayer = game.players.some((p) => p.user.id === session.user!.id);
  if (!isPlayer) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  return NextResponse.json({
    id: game.id,
    status: game.status,
    mode: game.mode,
    rounds: game.rounds,
    timeLimit: game.timeLimit,
    startedAt: game.startedAt,
    completedAt: game.completedAt,
    players: game.players.map((p) => ({
      userId: p.user.id,
      username: p.user.username ?? p.user.name,
      image: p.user.image,
      score: p.score,
      result: p.result,
      words: p.words.map((w) => ({
        word: w.word,
        round: w.round,
        points: w.points,
      })),
    })),
  });
}
