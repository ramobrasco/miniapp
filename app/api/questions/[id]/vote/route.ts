import { NextRequest, NextResponse } from "next/server";
import { getSessionAddress } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { isQuestionOpen } from "@/lib/questions";

async function getCounts(
  admin: ReturnType<typeof import("@/lib/supabase").supabaseAdmin>,
  questionId: number
) {
  const { data: rows } = await admin.from("votes").select("choice").eq("question_id", questionId);
  const counts = { yes: 0, no: 0, wait: 0, depends: 0 };
  for (const r of rows ?? []) {
    if (r.choice === 0) counts.yes++;
    else if (r.choice === 1) counts.no++;
    else if (r.choice === 2) counts.wait++;
    else counts.depends++;
  }
  return counts;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const address = await getSessionAddress();
  if (!address) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const questionId = Number(id);
  if (Number.isNaN(questionId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const body = await req.json();
  const choice = body?.choice;
  if (typeof choice !== "number" || choice < 0 || choice > 3) {
    return NextResponse.json({ error: "choice must be 0, 1, 2, or 3" }, { status: 400 });
  }

  const admin = supabaseAdmin();

  const { data: question, error: qErr } = await admin
    .from("questions")
    .select("created_at, creator_address")
    .eq("id", questionId)
    .single();
  if (qErr || !question) return NextResponse.json({ error: "Question not found" }, { status: 404 });
  if (!isQuestionOpen(question.created_at)) {
    return NextResponse.json({ error: "Voting closed for this question" }, { status: 400 });
  }

  const voter = address.toLowerCase();
  const creator = (question.creator_address ?? "").toLowerCase();
  if (voter === creator) {
    return NextResponse.json({ error: "You can't vote on your own question" }, { status: 403 });
  }

  await admin.from("votes").upsert(
    { question_id: questionId, voter_address: voter, choice },
    { onConflict: "question_id,voter_address" }
  );

  const counts = await getCounts(admin, questionId);
  await admin.from("vote_results").upsert(
    {
      question_id: questionId,
      yes_count: counts.yes,
      no_count: counts.no,
      wait_count: counts.wait,
      depends_count: counts.depends,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "question_id" }
  );

  const total = counts.yes + counts.no + counts.wait + counts.depends;
  const percentages =
    total === 0
      ? { yes: 0, no: 0, wait: 0, depends: 0 }
      : {
          yes: Math.round((counts.yes / total) * 100),
          no: Math.round((counts.no / total) * 100),
          wait: Math.round((counts.wait / total) * 100),
          depends: Math.round((counts.depends / total) * 100),
        };
  return NextResponse.json({ counts, percentages });
}
