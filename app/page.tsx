"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useAccount } from "wagmi";

const PAGE_SIZE = 10;

type Question = { id: number; body: string; image_url: string | null; created_at: string; creator_address?: string | null };

export default function Home() {
  const [offset, setOffset] = useState(0);
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const { address, isConnected } = useAccount();

  const { data: votedIds } = useQuery({
    queryKey: ["my-votes", "ids"],
    queryFn: async () => {
      const res = await fetch("/api/my-votes");
      if (res.status === 401 || !res.ok) return [];
      const data = (await res.json()) as { question_id: number }[];
      return new Set(data.map((v) => v.question_id));
    },
    enabled: isConnected,
  });
  const votedSet = votedIds instanceof Set ? votedIds : new Set<number>();

  const { data: pageQuestions, isLoading, isFetching, isError, error } = useQuery({
    queryKey: ["questions", "list", offset],
    queryFn: async () => {
      const res = await fetch(`/api/questions?limit=${PAGE_SIZE}&offset=${offset}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? "Failed to load questions");
      }
      return res.json() as Promise<Question[]>;
    },
  });

  useEffect(() => {
    if (pageQuestions == null) return;
    if (offset === 0) setAllQuestions(pageQuestions);
    else setAllQuestions((prev) => [...prev, ...pageQuestions]);
  }, [offset, pageQuestions]);

  const showQuestions = offset === 0 ? (pageQuestions ?? []) : allQuestions;
  const hasMore = (pageQuestions?.length ?? 0) === PAGE_SIZE;
  const loadingMore = offset > 0 && isFetching;

  function loadMore() {
    setOffset(showQuestions.length);
  }

  return (
    <div className="min-h-screen bg-white text-zinc-900 pb-20">
      <main className="max-w-2xl mx-auto px-4 py-6">
        <p className="font-balsamiq text-zinc-600 mb-6 text-base leading-relaxed">
          Ask the crowd.
          <br />
          Get a quick Yes 👍 / No 👎 / Wait ⏳ / Depends 🤷.
        </p>

        {isLoading && <p className="text-zinc-500 mb-6">Loading…</p>}
        {isError && (
          <p className="text-amber-600 mb-6">
            {error?.message ?? "Couldn’t load questions. Check your connection and that the app is configured (see README)."}
          </p>
        )}
        {!isLoading && !isError && showQuestions.length > 0 && (
          <section className="space-y-6 mb-8">
            {showQuestions.map((q) => {
              const isCreator = address && q.creator_address?.toLowerCase() === address.toLowerCase();
              const isAnswered = votedSet.has(q.id);
              const isYourQuestion = isCreator;
              return (
                <article key={q.id} className="rounded-xl border border-zinc-200 p-4 bg-zinc-50/50">
                  <Link href={`/questions/${q.id}`} className="block hover:opacity-90">
                    <p className="text-zinc-800 font-medium line-clamp-2">{q.body}</p>
                    {q.image_url && (
                      <div className="mt-3 aspect-square w-full max-w-sm overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100 flex items-center justify-center p-3">
                        <img
                          src={q.image_url}
                          alt=""
                          className="max-w-full max-h-full object-contain object-center rounded ring-1 ring-zinc-200/80"
                        />
                      </div>
                    )}
                  </Link>
                  <Link
                    href={`/questions/${q.id}`}
                    className={`mt-4 min-h-[44px] rounded-xl px-5 py-2.5 font-medium inline-flex items-center justify-center w-full transition-colors ${
                      isYourQuestion || isAnswered
                        ? "bg-zinc-200 text-zinc-600 border border-zinc-300 cursor-default"
                        : "border-2 border-[#0052FF] text-[#0052FF] bg-transparent hover:bg-[#0052FF]/10"
                    }`}
                  >
                    {isYourQuestion ? "Your question" : isAnswered ? "Answered" : "Vote"}
                  </Link>
                </article>
              );
            })}
          </section>
        )}
        {!isLoading && !isError && showQuestions.length === 0 && (
          <p className="text-zinc-500 mb-6">No questions yet. Be the first to ask the crowd!</p>
        )}

        {!isError && showQuestions.length > 0 && (
          <div className="flex justify-center mt-6">
            <button
              type="button"
              onClick={loadMore}
              disabled={!hasMore || loadingMore}
              className="min-h-[44px] rounded-xl border border-zinc-300 px-5 py-2.5 font-medium text-zinc-700 hover:border-[#0052FF] hover:text-[#0052FF] transition-colors disabled:opacity-50"
            >
              {loadingMore ? "Loading…" : "See more questions"}
            </button>
          </div>
        )}
      </main>

      <div className="fixed bottom-0 left-0 right-0 z-10 px-4 pt-2 pb-1 safe-area-pb bg-white/70 dark:bg-white/50 backdrop-blur-md border-t border-white/40 shadow-[0_-2px_8px_rgba(0,0,0,0.06)]">
        <div className="max-w-2xl mx-auto flex justify-center">
          <Link
            href="/ask"
            className="flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[#0052FF] text-white font-medium hover:bg-[#0046E0] transition-colors shadow-[0_0_0_3px_rgba(255,255,255,0.9),0_0_16px_rgba(0,82,255,0.4)] hover:shadow-[0_0_0_3px_rgba(255,255,255,0.9),0_0_20px_rgba(0,82,255,0.5)]"
          >
            <span className="font-balsamiq text-center text-sm sm:text-base leading-tight">
              Ask
              <br />
              the crowd
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
