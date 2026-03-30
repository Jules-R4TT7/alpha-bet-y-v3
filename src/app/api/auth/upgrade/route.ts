import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { upgradeGuestSchema } from "@/lib/validations";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (!user?.isGuest) {
    return NextResponse.json(
      { error: "Account is already a full account" },
      { status: 400 }
    );
  }

  const body = await request.json();
  const parsed = upgradeGuestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const { email, password, username } = parsed.data;

  const existingEmail = await prisma.user.findUnique({ where: { email } });
  if (existingEmail) {
    return NextResponse.json(
      { error: "An account with this email already exists" },
      { status: 409 }
    );
  }

  const existingUsername = await prisma.user.findUnique({ where: { username } });
  if (existingUsername && existingUsername.id !== user.id) {
    return NextResponse.json(
      { error: "This username is already taken" },
      { status: 409 }
    );
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      email,
      username,
      name: username,
      password: hashedPassword,
      isGuest: false,
    },
  });

  return NextResponse.json({ success: true });
}
