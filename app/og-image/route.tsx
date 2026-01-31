import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#ffffff",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            fontSize: 72,
            fontWeight: 700,
            color: "#0052FF",
            marginBottom: 16,
          }}
        >
          Should I?
        </div>
        <div
          style={{
            fontSize: 32,
            color: "#52525b",
            textAlign: "center",
            maxWidth: 800,
          }}
        >
          Ask the crowd. Get a quick Yes / No / Wait / Depends.
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
