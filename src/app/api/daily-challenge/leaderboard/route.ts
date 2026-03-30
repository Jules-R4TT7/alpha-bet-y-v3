import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

function getTodayDate(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const dateStr = searchParams.get("date");
  const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 100);

  const targetDate = dateStr ? new Date(dateStr + "T00:00:00Z") : getTodayDate();

  const challenge = await prisma.dailyChallenge.findUnique({
    where: { date: targetDate },
  });

  if (!challenge) {
    return NextResponse.json({
      date: targetDate.toISOString().slice(0, 10),
      entries: [],
    });
  }

  const entries = await prisma.dailyChallengeEntry.findMany({
    where: { challengeId: challenge.id },
    orderBy: { score: "desc" },
    take: limit,
    include: {
      user: {
        select: { id: true, username: true, name: true, image: true },
      },
    },
  });

  return NextResponse.json({
    date: targetDate.toISOString().slice(0, 10),
    letter: challenge.letter,
    target: challenge.target,
    entries: entries.map((e, i) => ({
      rank: i + 1,
      userId: e.user.id,
      username: e.user.username ?? e.user.name,
      image: e.user.image,
      score: e.score,
      wordsPlayed: e.wordsPlayed,
      completedAt: e.completedAt,
    })),
  });
}
