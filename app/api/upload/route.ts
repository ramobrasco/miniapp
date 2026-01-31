import { NextRequest, NextResponse } from "next/server";
import { getSessionAddress } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

const MAX_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export async function POST(req: NextRequest) {
  const address = await getSessionAddress();
  if (!address) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file || !file.size) return NextResponse.json({ error: "No file" }, { status: 400 });
  if (file.size > MAX_SIZE) return NextResponse.json({ error: "File too large (max 2MB)" }, { status: 400 });
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Invalid type (use jpeg, png, webp, gif)" }, { status: 400 });
  }

  const ext = file.name.split(".").pop() || "jpg";
  const name = `${address.slice(0, 10)}-${Date.now()}.${ext}`.replace(/[^a-zA-Z0-9.-]/g, "_");

  const admin = supabaseAdmin();
  const { data: upload, error } = await admin.storage
    .from("question-images")
    .upload(name, file, { upsert: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: urlData } = admin.storage.from("question-images").getPublicUrl(upload.path);
  return NextResponse.json({ url: urlData.publicUrl });
}
