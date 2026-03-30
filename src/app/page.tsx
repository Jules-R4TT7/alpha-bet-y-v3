"use client";

import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Navbar from "@/components/Navbar";

const FEATURES = [
  {
    title: "Bid & Bluff",
    desc: "Wager points on how many words you can type. Bid high to win big — or crash trying.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-8 w-8 text-game-gold">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
      </svg>
    ),
  },
  {
    title: "Type Fast",
    desc: "Race the clock to submit words starting with a random letter. Longer words score more.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-8 w-8 text-game-accent">
        <path strokeLinecap="round" strokeLinejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" />
      </svg>
    ),
  },
  {
    title: "Climb the Ranks",
    desc: "ELO-rated matchmaking pits you against players at your level. Top the global leaderboard.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-8 w-8 text-game-gold">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-4.5A3.375 3.375 0 0 0 13.125 12h-2.25A3.375 3.375 0 0 0 7.5 14.25v4.5m6-15.75v3.75m0 0L15 5.25m-1.5 1.5L12 5.25" />
      </svg>
    ),
  },
  {
    title: "Daily Challenge",
    desc: "Same letter for everyone, one attempt per day. Compare scores with the whole community.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-8 w-8 text-game-accent">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
      </svg>
    ),
  },
];

const HOW_IT_WORKS = [
  { step: "1", title: "Get a letter", desc: "A random letter is revealed to both players." },
  { step: "2", title: "Place your bid", desc: "Wager how many words you can type. Bids are secret." },
  { step: "3", title: "Type words fast", desc: "Race to submit words starting with that letter." },
  { step: "4", title: "Score & win", desc: "Hit your bid to score big. Fail and you lose the wager." },
];

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

      {/* Hero */}
      <section className="flex min-h-[calc(100vh-57px)] flex-col items-center justify-center px-4 py-12 text-center sm:min-h-[calc(100vh-65px)] sm:px-8 sm:py-16">
        <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-game-accent sm:text-base">
          Free to play &middot; No download
        </p>
        <h1 className="mb-4 text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl lg:text-7xl">
          Bid. Bluff. <span className="text-game-gold">Type fast.</span>
        </h1>
        <p className="mx-auto mb-8 max-w-xl text-base text-gray-300 sm:text-lg lg:text-xl">
          Outsmart your opponent in a real-time word bidding battle. Wager how many words you can type,
          then race the clock to prove it.
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
                {loading ? "Starting..." : "Play Free"}
              </button>
              <a
                href="/register"
                className="w-full rounded-lg border border-white/20 px-8 py-4 text-center text-lg font-semibold transition hover:bg-white/10 sm:w-auto"
              >
                Create Account
              </a>
            </>
          )}
        </div>
        <p className="mt-4 text-xs text-gray-500">
          No sign-up required. Jump in as a guest and upgrade later.
        </p>
      </section>

      {/* How it works */}
      <section className="border-t border-white/5 bg-game-card/50 px-4 py-16 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-10 text-center text-2xl font-bold sm:text-3xl">How It Works</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {HOW_IT_WORKS.map((item) => (
              <div key={item.step} className="text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-game-accent/20 text-xl font-bold text-game-accent">
                  {item.step}
                </div>
                <h3 className="mb-1 text-base font-semibold sm:text-lg">{item.title}</h3>
                <p className="text-sm text-gray-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-4 py-16 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-10 text-center text-2xl font-bold sm:text-3xl">Why Players Love It</h2>
          <div className="grid gap-6 sm:grid-cols-2">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-xl bg-game-card p-5 sm:p-6"
              >
                <div className="mb-3">{f.icon}</div>
                <h3 className="mb-1 text-lg font-semibold">{f.title}</h3>
                <p className="text-sm text-gray-400">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="border-t border-white/5 px-4 py-16 text-center sm:px-8 sm:py-20">
        <h2 className="mb-4 text-2xl font-bold sm:text-3xl">Ready to play?</h2>
        <p className="mx-auto mb-8 max-w-md text-gray-400">
          Jump in with one click. No downloads, no sign-up walls — just words.
        </p>
        {session?.user ? (
          <a
            href="/play"
            className="inline-block rounded-lg bg-game-accent px-10 py-4 text-lg font-semibold transition hover:brightness-110"
          >
            Play Now
          </a>
        ) : (
          <button
            onClick={handleGuestPlay}
            disabled={loading}
            className="rounded-lg bg-game-accent px-10 py-4 text-lg font-semibold transition hover:brightness-110 disabled:opacity-50"
          >
            {loading ? "Starting..." : "Start Playing Free"}
          </button>
        )}
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 px-4 py-6 text-center text-xs text-gray-500 sm:px-8">
        &copy; {new Date().getFullYear()} Alpha-bet-y. All rights reserved.
      </footer>
    </>
  );
}
