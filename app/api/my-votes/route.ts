import { NextResponse } from "next/server";
import { getSessionAddress } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  const address = await getSessionAddress();
  if (!address) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const voter = address.toLowerCase();
  const admin = supabaseAdmin();
  const { data: votes, error } = await admin
    .from("votes")
    .select("question_id, choice")
    .eq("voter_address", voter)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const list = votes ?? [];
  if (list.length === 0) return NextResponse.json(list);

  const ids = [...new Set(list.map((v) => v.question_id))];
  const { data: questions } = await admin
    .from("questions")
    .select("id, body")
    .in("id", ids);
  const bodyById = new Map((questions ?? []).map((q) => [q.id, q.body]));

  const out = list.map((v) => ({
    question_id: v.question_id,
    choice: v.choice,
    body: bodyById.get(v.question_id) ?? null,
  }));
  return NextResponse.json(out);
}
