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
      <main className="flex min-h-[calc(100vh-57px)] flex-col items-center justify-center px-4 py-8 sm:min-h-[calc(100vh-65px)] sm:p-8">
        <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-6xl">Alpha-bet-y</h1>
        <p className="mb-8 text-lg text-gray-300 sm:text-xl">
          The competitive word bidding game
        </p>
        <div className="flex w-full max-w-sm flex-col items-center gap-3 sm:w-auto sm:max-w-none sm:flex-row sm:gap-4">
          {session?.user ? (
            <a
              href="/play"
              className="w-full rounded-lg bg-game-accent px-8 py-4 text-center text-lg font-semibold transition hover:brightness-110 sm:w-auto"
            >
              Play Now
            </a>
          ) : (
            <>
              <button
                onClick={handleGuestPlay}
                disabled={loading}
                className="w-full rounded-lg bg-game-accent px-8 py-4 text-lg font-semibold transition hover:brightness-110 disabled:opacity-50 sm:w-auto"
              >
                {loading ? "Starting..." : "Play as Guest"}
              </button>
              <a
                href="/login"
                className="w-full rounded-lg border border-white/20 px-8 py-4 text-center text-lg font-semibold transition hover:bg-white/10 sm:w-auto"
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
