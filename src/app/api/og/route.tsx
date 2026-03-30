import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const title = searchParams.get("title") || "Alpha-bet-y";
  const subtitle =
    searchParams.get("subtitle") || "The Competitive Word Bidding Game";

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
          fontFamily: "system-ui, sans-serif",
          padding: "60px",
        }}
      >
        {/* Letter tiles decoration */}
        <div
          style={{
            display: "flex",
            gap: "16px",
            marginBottom: "40px",
          }}
        >
          {["A", "L", "P", "H", "A"].map((letter, i) => (
            <div
              key={i}
              style={{
                width: "72px",
                height: "72px",
                borderRadius: "12px",
                background:
                  i === 2 ? "#e94560" : "rgba(255, 255, 255, 0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "36px",
                fontWeight: 800,
                color: i === 2 ? "white" : "#f5c518",
                border: `2px solid ${i === 2 ? "#e94560" : "rgba(255,255,255,0.15)"}`,
              }}
            >
              {letter}
            </div>
          ))}
        </div>

        <div
          style={{
            fontSize: "64px",
            fontWeight: 800,
            color: "white",
            textAlign: "center",
            lineHeight: 1.1,
            marginBottom: "16px",
          }}
        >
          {title}
        </div>

        <div
          style={{
            fontSize: "28px",
            color: "rgba(255, 255, 255, 0.7)",
            textAlign: "center",
            maxWidth: "800px",
          }}
        >
          {subtitle}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginTop: "40px",
            background: "#e94560",
            padding: "14px 40px",
            borderRadius: "12px",
            fontSize: "24px",
            fontWeight: 700,
            color: "white",
          }}
        >
          Play Free — No Download
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
