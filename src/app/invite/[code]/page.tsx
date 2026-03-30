"use client";

import { useSession, signIn } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import Navbar from "@/components/Navbar";

export default function InvitePage() {
  const { data: session } = useSession();
  const params = useParams();
  const router = useRouter();
  const code = params.code as string;
  const [loading, setLoading] = useState(false);

  async function handleGuestPlay() {
    setLoading(true);
    const res = await fetch("/api/auth/guest", { method: "POST" });
    const { id } = await res.json();
    await signIn("guest", { guestId: id, redirect: false });
    router.push("/play");
    router.refresh();
  }

  return (
    <>
      <Navbar />
      <main className="flex min-h-[calc(100vh-65px)] flex-col items-center justify-center p-8">
        <div className="mx-auto max-w-md text-center">
          <h1 className="mb-4 text-5xl font-bold tracking-tight">
            Alpha-bet-y
          </h1>
          <p className="mb-2 text-xl text-gray-300">
            You&apos;ve been invited to play!
          </p>
          <p className="mb-8 text-sm text-gray-400">
            Invite code: <span className="font-mono text-game-gold">{code}</span>
          </p>

          <div className="space-y-4">
            {session?.user ? (
              <a
                href="/play"
                className="block rounded-lg bg-game-accent px-8 py-4 text-lg font-semibold transition hover:brightness-110"
              >
                Play Now
              </a>
            ) : (
              <>
                <a
                  href="/register"
                  className="block rounded-lg bg-game-accent px-8 py-4 text-lg font-semibold transition hover:brightness-110"
                >
                  Sign Up & Play
                </a>
                <button
                  onClick={handleGuestPlay}
                  disabled={loading}
                  className="block w-full rounded-lg border border-white/20 px-8 py-4 text-lg font-semibold transition hover:bg-white/10 disabled:opacity-50"
                >
                  {loading ? "Starting..." : "Play as Guest"}
                </button>
                <a
                  href="/login"
                  className="block text-sm text-gray-400 hover:text-white"
                >
                  Already have an account? Sign in
                </a>
              </>
            )}
          </div>

          {/* Game info */}
          <div className="mt-12 grid grid-cols-3 gap-4 text-center">
            <div className="rounded-lg bg-game-card p-4">
              <p className="text-2xl font-bold text-game-gold">60s</p>
              <p className="mt-1 text-xs text-gray-400">Per round</p>
            </div>
            <div className="rounded-lg bg-game-card p-4">
              <p className="text-2xl font-bold text-game-gold">1v1</p>
              <p className="mt-1 text-xs text-gray-400">Real-time</p>
            </div>
            <div className="rounded-lg bg-game-card p-4">
              <p className="text-2xl font-bold text-game-gold">26</p>
              <p className="mt-1 text-xs text-gray-400">Letters</p>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
