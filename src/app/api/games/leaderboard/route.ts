import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "rating";
  const limit = Math.min(parseInt(searchParams.get("limit") || "25", 10), 100);

  if (type === "rating") {
    const players = await prisma.user.findMany({
      where: { gamesPlayed: { gte: 5 }, isGuest: false },
      orderBy: { rating: "desc" },
      take: limit,
      select: {
        id: true,
        username: true,
        name: true,
        image: true,
        rating: true,
        gamesPlayed: true,
        gamesWon: true,
      },
    });

    return NextResponse.json({
      type: "rating",
      entries: players.map((p, i) => ({
        rank: i + 1,
        userId: p.id,
        username: p.username ?? p.name,
        image: p.image,
        rating: p.rating,
        gamesPlayed: p.gamesPlayed,
        gamesWon: p.gamesWon,
        winRate:
          p.gamesPlayed > 0
            ? Math.round((p.gamesWon / p.gamesPlayed) * 100)
            : 0,
      })),
    });
  }

  if (type === "streak") {
    const players = await prisma.user.findMany({
      where: { bestStreak: { gte: 2 }, isGuest: false },
      orderBy: { bestStreak: "desc" },
      take: limit,
      select: {
        id: true,
        username: true,
        name: true,
        image: true,
        bestStreak: true,
        gamesPlayed: true,
      },
    });

    return NextResponse.json({
      type: "streak",
      entries: players.map((p, i) => ({
        rank: i + 1,
        userId: p.id,
        username: p.username ?? p.name,
        image: p.image,
        bestStreak: p.bestStreak,
        gamesPlayed: p.gamesPlayed,
      })),
    });
  }

  return NextResponse.json({ error: "Invalid leaderboard type" }, { status: 400 });
}
