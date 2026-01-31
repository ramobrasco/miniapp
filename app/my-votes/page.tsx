"use client";

import { useAccount } from "wagmi";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { choiceDisplay } from "@/lib/choices";

type VoteEntry = { question_id: number; choice: number; body: string | null };

export default function MyVotesPage() {
  const { isConnected } = useAccount();

  const { data: votes, isLoading, error } = useQuery({
    queryKey: ["my-votes"],
    queryFn: async () => {
      const res = await fetch("/api/my-votes");
      if (res.status === 401) throw new Error("Sign in to see your votes (ask a question first to sign in).");
      if (!res.ok) throw new Error("Failed to load");
      return res.json() as Promise<VoteEntry[]>;
    },
    enabled: isConnected,
  });

  return (
    <div className="min-h-screen bg-white text-zinc-900">
      <main className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-xl font-semibold mb-4">My votes</h1>
        {!isConnected && (
          <p className="text-[#0052FF]">Connect your wallet to see the questions you voted on.</p>
        )}
        {isConnected && error && (
          <p className="text-amber-600">{error.message}</p>
        )}
        {isConnected && isLoading && <p className="text-zinc-500">Loading…</p>}
        {isConnected && votes && (
          <>
            <p className="text-zinc-500 text-sm mb-4">
              Questions you voted on. Anonymous to others; only you see this list.
            </p>
            <ul className="space-y-2">
              {votes.map((v) => (
                <li key={v.question_id} className="flex items-center gap-2 min-w-0">
                  <Link href={`/questions/${v.question_id}`} className="text-[#0052FF] hover:underline truncate min-w-0 flex-1">
                    {v.body ?? `Question #${v.question_id}`}
                  </Link>
                  <span className="text-zinc-500 shrink-0">→ {choiceDisplay(v.choice)}</span>
                </li>
              ))}
            </ul>
            {votes.length === 0 && (
              <p className="text-zinc-500">You haven’t voted on any question yet. Go have your say!</p>
            )}
          </>
        )}
      </main>
    </div>
  );
}
