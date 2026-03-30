"use client";

import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Navbar from "@/components/Navbar";

export default function Home() {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleGuestPlay() {
    setLoading(true);
    const res = await fetch("/api/auth/guest", { method: "POST" });
    const { id } = await res.json();

    await signIn("guest", { guestId: id, redirect: false });
    router.push("/play");
    router.refresh();
    setLoading(false);
  }

  return (
    <>
      <Navbar />
      <main className="flex min-h-[calc(100vh-65px)] flex-col items-center justify-center p-8">
        <h1 className="mb-4 text-6xl font-bold tracking-tight">Alpha-bet-y</h1>
        <p className="mb-8 text-xl text-gray-300">
          The competitive word bidding game
        </p>
        <div className="flex flex-col items-center gap-4 sm:flex-row">
          {session?.user ? (
            <a
              href="/play"
              className="rounded-lg bg-game-accent px-8 py-4 text-lg font-semibold transition hover:brightness-110"
            >
              Play Now
            </a>
          ) : (
            <>
              <button
                onClick={handleGuestPlay}
                disabled={loading}
                className="rounded-lg bg-game-accent px-8 py-4 text-lg font-semibold transition hover:brightness-110 disabled:opacity-50"
              >
                {loading ? "Starting..." : "Play as Guest"}
              </button>
              <a
                href="/login"
                className="rounded-lg border border-white/20 px-8 py-4 text-lg font-semibold transition hover:bg-white/10"
              >
                Sign In
              </a>
            </>
          )}
        </div>
      </main>
    </>
  );
}
