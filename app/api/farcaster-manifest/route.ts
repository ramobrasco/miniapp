import { NextResponse } from "next/server";

const BASE_URL =
  process.env.NEXT_PUBLIC_APP_ORIGIN ?? "https://miniapp-dun-one.vercel.app";

function withValidProperties(
  properties: Record<string, undefined | string | string[]>
) {
  return Object.fromEntries(
    Object.entries(properties).filter(([_, value]) =>
      Array.isArray(value) ? value.length > 0 : !!value
    )
  );
}

export async function GET() {
  const miniapp = withValidProperties({
    version: "1",
    name: "Should I? – Ask the crowd",
    homeUrl: BASE_URL,
    iconUrl: `${BASE_URL}/icons/icon-512x512`,
    splashImageUrl: `${BASE_URL}/og-image`,
    splashBackgroundColor: "#ffffff",
    webhookUrl: `${BASE_URL}/api/webhook`,
    subtitle: "Ask the crowd",
    description:
      'A fun, lightweight decision app. Ask "Should I…?" and get a quick Yes / No / Wait / Depends from the crowd.',
    screenshotUrls: [
      `${BASE_URL}/og-image`,
    ],
    primaryCategory: "social",
    tags: ["decision", "voting", "social", "baseapp", "shouldi"],
    heroImageUrl: `${BASE_URL}/og-image`,
    tagline: "Ask the crowd",
    ogTitle: "Should I? – Ask the crowd",
    ogDescription:
      'Ask "Should I…?" and get a quick Yes / No / Wait / Depends from the crowd.',
    ogImageUrl: `${BASE_URL}/og-image`,
    noindex: "true",
  });

  const accountAssociation = {
    header: process.env.FARCASTER_ACCOUNT_ASSOCIATION_HEADER ?? "",
    payload: process.env.FARCASTER_ACCOUNT_ASSOCIATION_PAYLOAD ?? "",
    signature: process.env.FARCASTER_ACCOUNT_ASSOCIATION_SIGNATURE ?? "",
  };

  const body = {
    accountAssociation,
    miniapp,
  };

  return NextResponse.json(body);
}
