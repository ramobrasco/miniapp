import { NextResponse } from "next/server";
import { getSessionAddress } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  const address = await getSessionAddress();
  if (!address) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const addr = address.toLowerCase();
  const admin = supabaseAdmin();

  const [qRes, vRes] = await Promise.all([
    admin.from("questions").select("*", { count: "exact", head: true }).eq("creator_address", addr),
    admin.from("votes").select("*", { count: "exact", head: true }).eq("voter_address", addr),
  ]);

  if (qRes.error) return NextResponse.json({ error: qRes.error.message }, { status: 500 });
  if (vRes.error) return NextResponse.json({ error: vRes.error.message }, { status: 500 });

  return NextResponse.json({
    questionsCount: qRes.count ?? 0,
    votesCount: vRes.count ?? 0,
  });
}
