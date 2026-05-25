import { ImageResponse } from "next/og";
import { type NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ size: string }> },
) {
  const { size: sizeParam } = await params;
  const size = sizeParam === "512" ? 512 : 192;
  const radius = size === 512 ? 100 : 40;
  const fontSize = size === 512 ? 256 : 96;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
          borderRadius: `${radius}px`,
        }}
      >
        <div
          style={{
            fontSize,
            fontWeight: 900,
            color: "white",
            fontFamily: "sans-serif",
          }}
        >
          B
        </div>
      </div>
    ),
    { width: size, height: size },
  );
}
