"use client";

import { useAccount } from "wagmi";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

type Stats = { questionsCount: number; votesCount: number };

function getLevel(stats: Stats): { label: string; emoji: string } {
  const score = stats.questionsCount * 2 + stats.votesCount;
  if (score >= 40) return { label: "Crowd favorite", emoji: "👑" };
  if (score >= 20) return { label: "Regular", emoji: "⭐" };
  if (score >= 10) return { label: "Contributor", emoji: "👍" };
  if (score >= 4) return { label: "Explorer", emoji: "🔍" };
  return { label: "Newcomer", emoji: "🌱" };
}

export default function ProfilePage() {
  const { address, isConnected } = useAccount();

  const { data: stats, isLoading, error } = useQuery({
    queryKey: ["profile", "stats"],
    queryFn: async () => {
      const res = await fetch("/api/profile/stats");
      if (res.status === 401) throw new Error("Sign in required");
      if (!res.ok) throw new Error("Failed to load");
      return res.json() as Promise<Stats>;
    },
    enabled: isConnected,
  });

  const level = stats ? getLevel(stats) : null;

  return (
    <div className="min-h-screen bg-white text-zinc-900">
      <main className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-xl font-semibold mb-4">Profile</h1>

        {!isConnected && (
          <p className="text-zinc-600 mb-4">
            Connect your wallet to see your profile and stats.
          </p>
        )}

        {isConnected && (
          <>
            <div className="rounded-xl border border-zinc-200 p-4 bg-zinc-50/50 mb-6">
              <p className="text-zinc-500 text-sm mb-1">Your address</p>
              <p className="font-mono text-zinc-800 break-all">
                {address}
              </p>
            </div>

            {isLoading && <p className="text-zinc-500 mb-4">Loading stats…</p>}
            {error && (
              <p className="text-amber-600 mb-4">
                {error.message === "Sign in required"
                  ? "Sign in first: go to Ask the crowd, post a question (you’ll sign with your wallet), then come back here."
                  : String(error.message)}
              </p>
            )}

            {stats && (
              <>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="rounded-xl border border-zinc-200 p-4 bg-white">
                    <p className="text-zinc-500 text-sm mb-1">Questions asked</p>
                    <p className="text-2xl font-semibold text-zinc-900">{stats.questionsCount}</p>
                  </div>
                  <div className="rounded-xl border border-zinc-200 p-4 bg-white">
                    <p className="text-zinc-500 text-sm mb-1">Votes cast</p>
                    <p className="text-2xl font-semibold text-zinc-900">{stats.votesCount}</p>
                  </div>
                </div>

                {level && (
                  <div className="rounded-xl border border-[#0052FF]/30 bg-[#0052FF]/5 p-4">
                    <p className="text-zinc-500 text-sm mb-1">Your level (just for you)</p>
                    <p className="text-lg font-medium text-zinc-900">
                      {level.emoji} {level.label}
                    </p>
                    <p className="text-zinc-500 text-sm mt-1">
                      Based on your questions and votes. Ask and vote more to level up!
                    </p>
                  </div>
                )}
              </>
            )}

            <nav className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/my-questions"
                className="min-h-[44px] rounded-xl border border-zinc-300 px-4 py-2.5 font-medium text-zinc-700 hover:border-[#0052FF] hover:text-[#0052FF] transition-colors"
              >
                My questions
              </Link>
              <Link
                href="/my-votes"
                className="min-h-[44px] rounded-xl border border-zinc-300 px-4 py-2.5 font-medium text-zinc-700 hover:border-[#0052FF] hover:text-[#0052FF] transition-colors"
              >
                My votes
              </Link>
            </nav>
          </>
        )}
      </main>
    </div>
  );
}
