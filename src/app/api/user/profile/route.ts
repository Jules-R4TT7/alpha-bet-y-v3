import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      username: true,
      image: true,
      rating: true,
      gamesPlayed: true,
      gamesWon: true,
      totalScore: true,
      streak: true,
      bestStreak: true,
      isGuest: true,
      createdAt: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json(user);
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { username } = body;

  if (username !== undefined) {
    if (typeof username !== "string" || username.length < 3 || username.length > 20) {
      return NextResponse.json(
        { error: "Username must be 3-20 characters" },
        { status: 400 }
      );
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      return NextResponse.json(
        { error: "Username can only contain letters, numbers, hyphens, and underscores" },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing && existing.id !== session.user.id) {
      return NextResponse.json(
        { error: "Username already taken" },
        { status: 409 }
      );
    }
  }

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: { ...(username !== undefined && { username, name: username }) },
    select: {
      id: true,
      name: true,
      username: true,
      rating: true,
      gamesPlayed: true,
      gamesWon: true,
      totalScore: true,
      streak: true,
      bestStreak: true,
    },
  });

  return NextResponse.json(user);
}
