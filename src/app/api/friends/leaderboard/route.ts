import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "rating";

  // Get IDs of users I follow
  const follows = await prisma.follow.findMany({
    where: { followerId: session.user.id },
    select: { followingId: true },
  });

  // Include self in the friends leaderboard
  const friendIds = [session.user.id, ...follows.map((f) => f.followingId)];

  const orderBy =
    type === "streak"
      ? { bestStreak: "desc" as const }
      : { rating: "desc" as const };

  const friends = await prisma.user.findMany({
    where: { id: { in: friendIds }, isGuest: false },
    orderBy,
    select: {
      id: true,
      username: true,
      name: true,
      image: true,
      rating: true,
      gamesPlayed: true,
      gamesWon: true,
      streak: true,
      bestStreak: true,
    },
  });

  return NextResponse.json({
    type,
    entries: friends.map((p, i) => ({
      rank: i + 1,
      userId: p.id,
      username: p.username ?? p.name,
      image: p.image,
      rating: p.rating,
      gamesPlayed: p.gamesPlayed,
      gamesWon: p.gamesWon,
      streak: p.streak,
      bestStreak: p.bestStreak,
      winRate:
        p.gamesPlayed > 0
          ? Math.round((p.gamesWon / p.gamesPlayed) * 100)
          : 0,
      isYou: p.id === session.user!.id,
    })),
  });
}
