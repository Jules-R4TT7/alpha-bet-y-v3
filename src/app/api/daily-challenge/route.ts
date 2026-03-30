import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { LETTER_TIERS } from "@/game/constants";

function getTodayDate(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

function pickDailyLetter(date: Date): string {
  // Deterministic letter selection based on date
  const all = Object.values(LETTER_TIERS).flatMap((t) => [...t.letters]);
  const daysSinceEpoch = Math.floor(date.getTime() / 86400000);
  return all[daysSinceEpoch % all.length];
}

export async function GET() {
  const today = getTodayDate();

  let challenge = await prisma.dailyChallenge.findUnique({
    where: { date: today },
    include: {
      _count: { select: { entries: true } },
    },
  });

  if (!challenge) {
    challenge = await prisma.dailyChallenge.create({
      data: {
        date: today,
        letter: pickDailyLetter(today),
        target: 10,
      },
      include: {
        _count: { select: { entries: true } },
      },
    });
  }

  return NextResponse.json({
    id: challenge.id,
    date: challenge.date.toISOString().slice(0, 10),
    letter: challenge.letter,
    target: challenge.target,
    participants: challenge._count.entries,
  });
}
