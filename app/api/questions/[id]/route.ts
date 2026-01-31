import { NextRequest, NextResponse } from "next/server";
import { getSessionAddress } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const numId = Number(id);
  if (Number.isNaN(numId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const admin = supabaseAdmin();
  const { data: question, error } = await admin.from("questions").select("*").eq("id", numId).single();
  if (error || !question) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const address = await getSessionAddress();
  const voter = address?.toLowerCase() ?? null;

  let hasVoted = false;
  let myChoice: number | null = null;
  if (voter) {
    const { data: vote } = await admin
      .from("votes")
      .select("choice")
      .eq("question_id", numId)
      .eq("voter_address", voter)
      .single();
    hasVoted = !!vote;
    myChoice = vote?.choice ?? null;
  }

  const out: Record<string, unknown> = {
    ...question,
    has_voted: hasVoted,
    my_choice: myChoice,
  };

  const isCreator = voter && (question.creator_address ?? "").toLowerCase() === voter;
  if (hasVoted || isCreator) {
    const { data: res } = await admin.from("vote_results").select("*").eq("question_id", numId).single();
    const yes = res?.yes_count ?? 0;
    const no = res?.no_count ?? 0;
    const wait = res?.wait_count ?? 0;
    const depends = res?.depends_count ?? 0;
    const total = yes + no + wait + depends;
    const percentages =
      total === 0
        ? { yes: 0, no: 0, wait: 0, depends: 0 }
        : {
            yes: Math.round((yes / total) * 100),
            no: Math.round((no / total) * 100),
            wait: Math.round((wait / total) * 100),
            depends: Math.round((depends / total) * 100),
          };
    out.results = { counts: { yes, no, wait, depends }, percentages };
  }

  return NextResponse.json(out);
}
