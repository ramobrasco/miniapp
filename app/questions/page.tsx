"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { isQuestionOpen } from "@/lib/questions";

export default function QuestionsPage() {
  const { data: questions, isLoading, error } = useQuery({
    queryKey: ["questions"],
    queryFn: async () => {
      const res = await fetch("/api/questions");
      if (!res.ok) throw new Error("Failed to load");
      return res.json() as Promise<{ id: number; body: string; image_url: string | null; created_at: string }[]>;
    },
  });

  return (
    <div className="min-h-screen bg-white text-zinc-900">
      <main className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-xl font-semibold mb-4">See what others are asking</h1>
        {isLoading && <p className="text-zinc-500">Loading…</p>}
        {error && <p className="text-red-600">Failed to load questions.</p>}
        {questions && (
          <ul className="space-y-4">
            {questions.map((q) => (
              <li key={q.id} className="border border-zinc-200 rounded-xl p-4 hover:border-[#0052FF]/50 transition-colors">
                <Link href={`/questions/${q.id}`} className="block">
                  <p className="text-zinc-800 line-clamp-2">{q.body}</p>
                  <span className="text-zinc-500 text-sm mt-2 inline-block">
                    {isQuestionOpen(q.created_at) ? "Open" : "Closed"} · {new Date(q.created_at).toLocaleString()}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
        {questions?.length === 0 && <p className="text-zinc-500">No questions yet. Be the first to ask the crowd!</p>}
      </main>
    </div>
  );
}
