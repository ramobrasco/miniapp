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
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0052FF",
          fontFamily: "system-ui, sans-serif",
          fontSize: 64,
          fontWeight: 700,
          color: "#ffffff",
        }}
      >
        Should I?
      </div>
    ),
    {
      width: 192,
      height: 192,
    }
  );
}
