import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const submitSchema = z.object({
  challengeId: z.string(),
  score: z.number().int().min(0),
  wordsPlayed: z.number().int().min(0),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = submitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const { challengeId, score, wordsPlayed } = parsed.data;

  // Verify challenge exists
  const challenge = await prisma.dailyChallenge.findUnique({
    where: { id: challengeId },
  });
  if (!challenge) {
    return NextResponse.json({ error: "Challenge not found" }, { status: 404 });
  }

  // Check if user already submitted today
  const existing = await prisma.dailyChallengeEntry.findUnique({
    where: {
      challengeId_userId: { challengeId, userId: session.user.id },
    },
  });

  if (existing) {
    // Update if higher score
    if (score > existing.score) {
      const updated = await prisma.dailyChallengeEntry.update({
        where: { id: existing.id },
        data: { score, wordsPlayed },
      });
      return NextResponse.json({ entry: updated, improved: true });
    }
    return NextResponse.json({ entry: existing, improved: false });
  }

  const entry = await prisma.dailyChallengeEntry.create({
    data: {
      challengeId,
      userId: session.user.id,
      score,
      wordsPlayed,
    },
  });

  // Check for streak-based notifications
  await checkStreakNotification(session.user.id);

  return NextResponse.json({ entry, improved: true }, { status: 201 });
}

async function checkStreakNotification(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { streak: true, bestStreak: true, username: true },
  });
  if (!user) return;

  const milestones = [3, 5, 10, 25, 50, 100];
  if (milestones.includes(user.streak)) {
    await prisma.notification.create({
      data: {
        userId,
        type: "STREAK_MILESTONE",
        title: `${user.streak}-win streak!`,
        body: `You're on fire with ${user.streak} wins in a row!`,
        data: { streak: user.streak },
      },
    });
  }
}
