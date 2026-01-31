"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAccount, useChainId, useSignMessage } from "wagmi";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CHOICE, choiceDisplay } from "@/lib/choices";
import { isQuestionOpen, closesAt } from "@/lib/questions";

const MIN_VOTES_TO_SHARE_RESULTS = 5;

type QuestionData = {
  id: number;
  body: string;
  image_url: string | null;
  created_at: string;
  creator_address: string;
  has_voted: boolean;
  my_choice: number | null;
  results?: {
    counts: { yes: number; no: number; wait: number; depends: number };
    percentages: { yes: number; no: number; wait: number; depends: number };
  };
};

export default function QuestionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { signMessageAsync } = useSignMessage();
  const queryClient = useQueryClient();
  const [shareCopied, setShareCopied] = useState(false);
  const [resultsCopied, setResultsCopied] = useState(false);
  const [signInBusy, setSignInBusy] = useState(false);
  const [signInError, setSignInError] = useState("");

  const { data: question, isLoading: qLoading } = useQuery({
    queryKey: ["question", id],
    queryFn: async () => {
      const res = await fetch(`/api/questions/${id}`);
      if (!res.ok) throw new Error("Not found");
      return res.json() as Promise<QuestionData>;
    },
    enabled: !Number.isNaN(id),
    refetchInterval: (query) => {
      const data = query.state.data;
      return data != null && address && (data.creator_address ?? "").toLowerCase() === address.toLowerCase()
        ? 5000
        : false;
    },
  });

  const voteMutation = useMutation({
    mutationFn: async (choice: number) => {
      const res = await fetch(`/api/questions/${id}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ choice }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Vote failed");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["question", id] });
    },
  });

  const open = question ? isQuestionOpen(question.created_at) : false;
  const isCreator =
    question && address && question.creator_address?.toLowerCase() === address.toLowerCase();
  const showVoteSection = isConnected && open && !isCreator;

  function handleVote(choice: number) {
    setSignInError("");
    voteMutation.mutate(choice);
  }

  async function handleSignIn() {
    if (!address || !isConnected) return;
    setSignInError("");
    setSignInBusy(true);
    try {
      const nonceRes = await fetch("/api/auth/nonce");
      const { nonce } = await nonceRes.json();
      const { createSiweMessage } = await import("@/lib/siwe");
      const origin = typeof window !== "undefined" ? window.location.origin : undefined;
      const message = createSiweMessage(address, nonce, chainId, origin);
      const messageStr = message.prepareMessage();
      const signature = await signMessageAsync({ message: messageStr });
      const verifyRes = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: messageStr, signature }),
        credentials: "include",
      });
      if (!verifyRes.ok) {
        const data = await verifyRes.json().catch(() => ({}));
        throw new Error(data.error ?? "Sign-in failed");
      }
      voteMutation.reset();
    } catch (e) {
      setSignInError(e instanceof Error ? e.message : "Sign-in failed. Try again.");
    } finally {
      setSignInBusy(false);
    }
  }

  async function handleShareQuestion() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    const shareText = question?.body
      ? isCreator
        ? `I asked: "${question.body}"`
        : `Someone asked: "${question.body}"`
      : "";
    let shareFiles: File[] | undefined;
    if (question?.image_url) {
      try {
        const res = await fetch(question.image_url);
        if (res.ok) {
          const blob = await res.blob();
          const type = blob.type || "image/jpeg";
          const ext = type.includes("png") ? "png" : "jpg";
          shareFiles = [new File([blob], `question-image.${ext}`, { type })];
        }
      } catch {
        // CORS or network: share without image
      }
    }
    if (navigator.share) {
      try {
        const payload: { title: string; text: string; url: string; files?: File[] } = {
          title: "Should I?",
          text: shareText,
          url,
        };
        if (shareFiles?.length) payload.files = shareFiles;
        await navigator.share(payload);
      } catch {
        try {
          await navigator.share({ title: "Should I?", text: shareText, url });
        } catch {
          await copyToClipboard(shareText ? `${shareText}\n${url}` : url);
          setShareCopied(true);
          setTimeout(() => setShareCopied(false), 2000);
        }
      }
    } else {
      await copyToClipboard(shareText ? `${shareText}\n${url}` : url);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    }
  }

  function buildResultsShareText() {
    if (!question?.body || !question?.results) return "";
    const p = question.results.percentages;
    const url = typeof window !== "undefined" ? window.location.href : "";
    return `${question.body}\n\nThe crowd said: Yes ${p.yes}% · No ${p.no}% · Wait ${p.wait}% · Depends ${p.depends}%\n${url}`;
  }

  async function handleShareResults() {
    const text = buildResultsShareText();
    if (!text) return;
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Should I? – Crowd results",
          text,
          url,
        });
      } catch {
        await copyToClipboard(text);
        setResultsCopied(true);
        setTimeout(() => setResultsCopied(false), 2000);
      }
    } else {
      await copyToClipboard(text);
      setResultsCopied(true);
      setTimeout(() => setResultsCopied(false), 2000);
    }
  }

  async function copyToClipboard(text: string) {
    await navigator.clipboard.writeText(text);
  }

  const totalVotes =
    question?.results?.counts
      ? question.results.counts.yes +
        question.results.counts.no +
        question.results.counts.wait +
        question.results.counts.depends
      : 0;
  const canShareResults = (question?.has_voted || isCreator) && question?.results && totalVotes >= MIN_VOTES_TO_SHARE_RESULTS;

  if (Number.isNaN(id) || (question === undefined && !qLoading)) {
    return (
      <div className="min-h-screen bg-white text-zinc-900 px-4 py-8">
        <button type="button" onClick={() => router.back()} className="text-[#0052FF] hover:underline">← Back</button>
        <p className="mt-4">Question not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-zinc-900">
      <main className="max-w-2xl mx-auto px-4 py-8">
        <button type="button" onClick={() => router.back()} className="text-[#0052FF] text-sm hover:underline">← Back</button>
        {qLoading && <p className="mt-4 text-zinc-500">Loading…</p>}
        {question && (
          <>
            <h1 className="text-xl font-semibold mt-4 text-zinc-900">{question.body}</h1>
            {question.image_url && (
              <div className="mt-4 w-full aspect-square max-w-lg mx-auto overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100 flex items-center justify-center p-4">
                <img src={question.image_url} alt="" className="max-w-full max-h-full object-contain object-center rounded-lg ring-1 ring-zinc-200/80" />
              </div>
            )}
            <p className="text-zinc-500 text-sm mt-2">
              {open ? "Open for votes" : "Closed"} · Closes {closesAt(question.created_at).toLocaleString()}
            </p>

            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={handleShareQuestion}
                className="min-h-[44px] rounded-xl border border-zinc-300 px-4 py-2 text-sm text-zinc-700 hover:border-[#0052FF] hover:text-[#0052FF] transition-colors"
              >
                {shareCopied ? "Link copied!" : "Share question"}
              </button>
              {canShareResults && (
                <button
                  type="button"
                  onClick={handleShareResults}
                  className="min-h-[44px] rounded-xl border border-zinc-300 px-4 py-2 text-sm text-zinc-700 hover:border-[#0052FF] hover:text-[#0052FF] transition-colors"
                >
                  {resultsCopied ? "Copied!" : "Share results"}
                </button>
              )}
            </div>

            {showVoteSection && (
              <section className="mt-6">
                <h2 className="text-sm font-medium text-zinc-600 mb-2">
                  {question.results ? "What do you say? · The crowd said" : "What do you say?"}
                </h2>
                <div className="flex flex-col gap-2">
                  {([CHOICE.Yes, CHOICE.No, CHOICE.Wait, CHOICE.Depends] as const).map((c) => {
                    const isCurrentChoice = question.my_choice === c;
                    const pctKey = (["yes", "no", "wait", "depends"] as const)[c];
                    const pct = question.results?.percentages[pctKey] ?? null;
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => handleVote(c)}
                        disabled={voteMutation.isPending}
                        className={`min-h-[44px] rounded-xl border px-4 py-3 text-left text-base transition-colors disabled:opacity-50 flex justify-between items-center w-full ${
                          isCurrentChoice
                            ? "border-[#0052FF] bg-[#0052FF]/10 text-[#0052FF]"
                            : "border-zinc-300 text-zinc-700 hover:border-[#0052FF] hover:text-[#0052FF]"
                        }`}
                      >
                        <span>{choiceDisplay(c)}{isCurrentChoice ? " ✓" : ""}</span>
                        {pct !== null && <span className="font-medium tabular-nums">{pct}%</span>}
                      </button>
                    );
                  })}
                </div>
                {question.my_choice !== null && (
                  <p className="mt-3 text-zinc-500 text-sm">You voted: {choiceDisplay(question.my_choice)}</p>
                )}
                {voteMutation.isPending && <p className="text-zinc-500 text-sm mt-2">Submitting…</p>}
                {voteMutation.isError && (
                  <div className="mt-2 space-y-2">
                    <p className="text-red-600 text-sm">
                      {voteMutation.error?.message === "Unauthorized"
                        ? "Your wallet is connected but you haven’t signed in yet. Sign the message with your wallet to vote."
                        : voteMutation.error?.message === "You can't vote on your own question"
                          ? "You asked this question. Only others can vote."
                          : voteMutation.error?.message}
                    </p>
                    {voteMutation.error?.message === "Unauthorized" && (
                      <button
                        type="button"
                        onClick={handleSignIn}
                        disabled={signInBusy}
                        className="min-h-[44px] rounded-xl bg-[#0052FF] text-white px-4 py-2 text-sm font-medium hover:bg-[#0046E0] disabled:opacity-50 transition-colors"
                      >
                        {signInBusy ? "Signing…" : "Sign in with wallet"}
                      </button>
                    )}
                    {signInError && <p className="text-red-600 text-sm">{signInError}</p>}
                  </div>
                )}
              </section>
            )}

            {!question.has_voted && open && !isConnected && (
              <p className="mt-4 text-[#0052FF] text-sm">Connect your wallet to vote and see what the crowd said.</p>
            )}

            {isCreator && open && (
              <p className="mt-4 text-zinc-500 text-sm">You asked this question. Only others can vote.</p>
            )}

            {isCreator && question.results && (
              <section className="mt-6">
                <h2 className="text-sm font-medium text-zinc-600 mb-2">Here’s what the crowd said.</h2>
                <ul className="space-y-2">
                  {([0, 1, 2, 3] as const).map((c) => {
                    const pctKey = (["yes", "no", "wait", "depends"] as const)[c];
                    const pct = question.results!.percentages[pctKey];
                    return (
                      <li
                        key={c}
                        className="flex justify-between items-center rounded-xl border border-zinc-200 px-4 py-3 text-zinc-700"
                      >
                        <span>{choiceDisplay(c)}</span>
                        <span className="font-medium tabular-nums">{pct}%</span>
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}

            {question.has_voted && !question.results && !isCreator && (
              <p className="mt-4 text-zinc-500 text-sm">You voted. Results will appear above when ready.</p>
            )}
          </>
        )}
      </main>
    </div>
  );
}
