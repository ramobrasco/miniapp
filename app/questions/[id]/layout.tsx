import type { Metadata, ResolvingMetadata } from "next";
import { supabaseAdmin } from "@/lib/supabase";

const BASE_URL =
  process.env.NEXT_PUBLIC_APP_ORIGIN ?? "https://miniapp-dun-one.vercel.app";

type Props = {
  params: Promise<{ id: string }>;
  children: React.ReactNode;
};

async function getQuestion(id: number) {
  const admin = supabaseAdmin();
  const { data, error } = await admin
    .from("questions")
    .select("id, body, image_url")
    .eq("id", id)
    .single();
  if (error || !data) return null;
  return data;
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { id } = await params;
  const numId = Number(id);
  if (Number.isNaN(numId)) return { title: "Question" };

  const question = await getQuestion(numId);
  if (!question) return { title: "Question not found" };

  const title = `Should I? – "${question.body.slice(0, 60)}${question.body.length > 60 ? "…" : ""}"`;
  const description = `Ask the crowd: "${question.body}"`;
  const imageUrl =
    question.image_url ||
    `${BASE_URL}/og-image`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/questions/${numId}`,
      siteName: "Should I?",
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: question.body,
        },
      ],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
  };
}

export default function QuestionLayout({ children }: Props) {
  return <>{children}</>;
}
