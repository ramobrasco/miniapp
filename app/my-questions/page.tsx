"use client";

import { useAccount } from "wagmi";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { isQuestionOpen } from "@/lib/questions";

export default function MyQuestionsPage() {
  const { address, isConnected } = useAccount();

  const { data: questions, isLoading } = useQuery({
    queryKey: ["questions", "creator", address],
    queryFn: async () => {
      const res = await fetch(`/api/questions?creator=${address?.toLowerCase() ?? ""}`);
      if (!res.ok) throw new Error("Failed to load");
      return res.json() as Promise<{ id: number; body: string; image_url: string | null; created_at: string }[]>;
    },
    enabled: !!address,
  });

  return (
    <div className="min-h-screen bg-white text-zinc-900">
      <main className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-xl font-semibold mb-4">My questions</h1>
        {!isConnected && <p className="text-[#0052FF]">Connect your wallet to see the questions you asked.</p>}
        {isConnected && isLoading && <p className="text-zinc-500">Loading…</p>}
        {isConnected && questions && (
          <ul className="space-y-4">
            {questions.map((q) => (
              <li key={q.id} className="border border-zinc-200 rounded-xl p-4 hover:border-[#0052FF]/50 transition-colors">
                <Link href={`/questions/${q.id}`} className="flex gap-4 items-start">
                  {q.image_url ? (
                    <div className="shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden border border-zinc-200 bg-zinc-100 flex items-center justify-center">
                      <img src={q.image_url} alt="" className="w-full h-full object-contain object-center" />
                    </div>
                  ) : (
                    <div className="shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-lg border border-zinc-200 bg-zinc-100 flex items-center justify-center text-zinc-400 text-xs" aria-hidden>
                      —
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-zinc-800 font-medium">{q.body}</p>
                    <span className="text-zinc-500 text-sm mt-1 inline-block">
                      {isQuestionOpen(q.created_at) ? "Open" : "Closed"} · {new Date(q.created_at).toLocaleString()}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
        {isConnected && questions?.length === 0 && <p className="text-zinc-500">You haven’t asked the crowd anything yet. Give it a try!</p>}
      </main>
    </div>
  );
}
