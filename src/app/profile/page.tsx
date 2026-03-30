"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";

interface UserProfile {
  id: string;
  name: string | null;
  email: string | null;
  username: string | null;
  image: string | null;
  rating: number;
  gamesPlayed: number;
  gamesWon: number;
  totalScore: number;
  streak: number;
  bestStreak: number;
  isGuest: boolean;
  createdAt: string;
}

export default function ProfilePage() {
  const { data: session } = useSession();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [editing, setEditing] = useState(false);
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (session?.user) {
      fetch("/api/user/profile")
        .then((res) => res.json())
        .then((data) => {
          setProfile(data);
          setUsername(data.username || "");
        });
    }
  }, [session]);

  async function handleSaveUsername() {
    setError("");
    setSaving(true);
    const res = await fetch("/api/user/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error);
      setSaving(false);
      return;
    }

    const updated = await res.json();
    setProfile((prev) => (prev ? { ...prev, ...updated } : prev));
    setEditing(false);
    setSaving(false);
  }

  const winRate =
    profile && profile.gamesPlayed > 0
      ? Math.round((profile.gamesWon / profile.gamesPlayed) * 100)
      : 0;

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-2xl px-4 py-6 sm:p-8">
        <h1 className="mb-6 text-2xl font-bold sm:mb-8 sm:text-3xl">Profile</h1>

        {!profile ? (
          <p className="text-gray-400">Loading...</p>
        ) : (
          <div className="space-y-6">
            {profile.isGuest && (
              <div className="rounded-lg border border-game-gold/30 bg-game-gold/10 p-4">
                <p className="font-semibold text-game-gold">Guest Account</p>
                <p className="mt-1 text-sm text-gray-300">
                  Create a full account to save your progress and appear on leaderboards.
                </p>
                <a
                  href="/upgrade"
                  className="mt-3 inline-block rounded-lg bg-game-gold px-4 py-2 text-sm font-semibold text-black transition hover:brightness-110"
                >
                  Upgrade Account
                </a>
              </div>
            )}

            <div className="rounded-xl bg-game-card p-4 sm:p-6">
              <div className="flex items-start justify-between gap-3 sm:items-center">
                <div className="min-w-0 flex-1">
                  {editing ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white focus:border-game-accent focus:outline-none sm:w-auto"
                        minLength={3}
                        maxLength={20}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleSaveUsername}
                          disabled={saving}
                          className="rounded-lg bg-game-accent px-3 py-2 text-sm font-semibold"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setEditing(false);
                            setUsername(profile.username || "");
                            setError("");
                          }}
                          className="rounded-lg border border-white/10 px-3 py-2 text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 sm:gap-3">
                      <h2 className="truncate text-xl font-bold sm:text-2xl">
                        {profile.username || profile.name || "Anonymous"}
                      </h2>
                      <button
                        onClick={() => setEditing(true)}
                        className="shrink-0 text-sm text-gray-400 hover:text-white"
                      >
                        Edit
                      </button>
                    </div>
                  )}
                  {error && <p className="mt-1 text-sm text-red-400">{error}</p>}
                  <p className="mt-1 truncate text-sm text-gray-400">{profile.email}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-2xl font-bold text-game-gold sm:text-3xl">{profile.rating}</p>
                  <p className="text-xs text-gray-400 sm:text-sm">Rating</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
              <StatCard label="Games Played" value={profile.gamesPlayed} />
              <StatCard label="Games Won" value={profile.gamesWon} />
              <StatCard label="Win Rate" value={`${winRate}%`} />
              <StatCard label="Total Score" value={profile.totalScore} />
              <StatCard label="Current Streak" value={profile.streak} />
              <StatCard label="Best Streak" value={profile.bestStreak} />
            </div>

            {/* Invite friends */}
            <div className="rounded-xl bg-game-card p-4 sm:p-6">
              <h3 className="mb-2 text-base font-bold sm:mb-3 sm:text-lg">Invite Friends</h3>
              <p className="mb-3 text-sm text-gray-400 sm:mb-4">
                Share your invite link and compete with friends!
              </p>
              <InviteButton />
            </div>

            <p className="text-sm text-gray-500">
              Member since {new Date(profile.createdAt).toLocaleDateString()}
            </p>
          </div>
        )}
      </main>
    </>
  );
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-lg bg-game-card p-3 text-center sm:p-4">
      <p className="text-xl font-bold sm:text-2xl">{value}</p>
      <p className="mt-1 text-[11px] text-gray-400 sm:text-xs">{label}</p>
    </div>
  );
}

function InviteButton() {
  const [copied, setCopied] = useState(false);
  const [inviteUrl, setInviteUrl] = useState("");
  const [shareText, setShareText] = useState("");

  useEffect(() => {
    fetch("/api/invite")
      .then((r) => r.json())
      .then((data) => {
        setInviteUrl(data.inviteUrl ?? "");
        setShareText(data.shareText ?? "");
      })
      .catch(() => {});
  }, []);

  function handleCopy() {
    const text = `${shareText}\n${inviteUrl}`;
    if (navigator.share) {
      navigator.share({ text, url: inviteUrl });
    } else {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  if (!inviteUrl) return null;

  return (
    <div className="flex items-center gap-2">
      <input
        readOnly
        value={inviteUrl}
        className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-gray-300"
      />
      <button
        onClick={handleCopy}
        className="rounded-lg bg-game-accent px-4 py-2 text-sm font-semibold transition hover:brightness-110"
      >
        {copied ? "Copied!" : "Share"}
      </button>
    </div>
  );
}
