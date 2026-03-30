"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";

export default function UpgradePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/auth/upgrade", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, username }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Upgrade failed");
      setLoading(false);
      return;
    }

    setLoading(false);
    router.push("/profile");
    router.refresh();
  }

  if (!session?.user) {
    return (
      <>
        <Navbar />
        <main className="flex min-h-screen flex-col items-center justify-center p-8">
          <p className="text-gray-400">Please sign in first.</p>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="flex min-h-screen flex-col items-center justify-center p-8">
        <div className="w-full max-w-md rounded-xl bg-game-card p-8 shadow-lg">
          <h1 className="mb-2 text-center text-3xl font-bold">Upgrade Account</h1>
          <p className="mb-6 text-center text-sm text-gray-400">
            Save your progress, stats, and appear on leaderboards
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="username" className="mb-1 block text-sm text-gray-300">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                minLength={3}
                maxLength={20}
                pattern="^[a-zA-Z0-9_-]+$"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-gray-500 focus:border-game-accent focus:outline-none"
                placeholder="wordmaster42"
              />
            </div>

            <div>
              <label htmlFor="email" className="mb-1 block text-sm text-gray-300">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-gray-500 focus:border-game-accent focus:outline-none"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1 block text-sm text-gray-300">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-gray-500 focus:border-game-accent focus:outline-none"
                placeholder="Min 8 characters"
              />
            </div>

            {error && (
              <p className="text-sm text-red-400">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-game-gold py-3 font-semibold text-black transition hover:brightness-110 disabled:opacity-50"
            >
              {loading ? "Upgrading..." : "Upgrade to Full Account"}
            </button>
          </form>
        </div>
      </main>
    </>
  );
}
