import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 50);
  const cursor = searchParams.get("cursor");

  const games = await prisma.gamePlayer.findMany({
    where: { userId: session.user.id },
    orderBy: { game: { completedAt: "desc" } },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    include: {
      game: {
        include: {
          players: {
            include: {
              user: {
                select: { id: true, username: true, name: true, image: true },
              },
            },
          },
        },
      },
    },
  });

  const hasMore = games.length > limit;
  const items = hasMore ? games.slice(0, limit) : games;
  const nextCursor = hasMore ? items[items.length - 1].id : null;

  return NextResponse.json({
    games: items.map((gp) => ({
      id: gp.game.id,
      mode: gp.game.mode,
      result: gp.result,
      score: gp.score,
      rounds: gp.game.rounds,
      completedAt: gp.game.completedAt,
      players: gp.game.players.map((p) => ({
        userId: p.user.id,
        username: p.user.username ?? p.user.name,
        image: p.user.image,
        score: p.score,
        result: p.result,
      })),
    })),
    nextCursor,
  });
}
