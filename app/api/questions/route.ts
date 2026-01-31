import { NextRequest, NextResponse } from "next/server";
import { getSessionAddress } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const creator = searchParams.get("creator");
  const limitParam = searchParams.get("limit");
  const offsetParam = searchParams.get("offset");
  const limit = limitParam ? Math.min(Math.max(1, parseInt(limitParam, 10)), 100) : undefined;
  const offset = offsetParam ? Math.max(0, parseInt(offsetParam, 10)) : 0;
  const admin = supabaseAdmin();

  if (creator) {
    const creatorNorm = creator.toLowerCase();
    let q = admin
      .from("questions")
      .select("*")
      .eq("creator_address", creatorNorm)
      .order("created_at", { ascending: false });
    if (limit != null) q = q.range(offset, offset + limit - 1);
    const { data, error } = await q;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  let q = admin.from("questions").select("*").order("created_at", { ascending: false });
  if (limit != null) q = q.range(offset, offset + limit - 1);
  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const address = await getSessionAddress();
  if (!address) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { body: questionBody, image_url: imageUrl } = body;
  if (!questionBody || typeof questionBody !== "string") {
    return NextResponse.json({ error: "body is required" }, { status: 400 });
  }
  const trimmed = questionBody.trim();
  if (!/^Should I\s/i.test(trimmed)) {
    return NextResponse.json(
      { error: 'Questions must start with "Should I" (e.g. "Should I buy this?")' },
      { status: 400 }
    );
  }

  const admin = supabaseAdmin();
  const { data, error } = await admin
    .from("questions")
    .insert({
      creator_address: address.toLowerCase(),
      body: trimmed.slice(0, 2000),
      image_url: imageUrl && typeof imageUrl === "string" ? imageUrl : null,
    })
    .select("id, creator_address, body, image_url, created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
