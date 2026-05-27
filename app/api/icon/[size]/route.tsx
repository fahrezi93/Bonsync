import { type NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ size: string }> },
) {
  const { size: sizeParam } = await params;
  const validSizes = ["192", "512"];
  const size = validSizes.includes(sizeParam) ? sizeParam : "192";

  try {
    const iconPath = path.join(process.cwd(), "public", "Bonsyncicon.png");
    const fileBuffer = await readFile(iconPath);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=86400, immutable",
        "Content-Length": fileBuffer.byteLength.toString(),
      },
    });
  } catch {
    // Fallback: return a simple colored square if file not found
    return new NextResponse(null, { status: 404 });
  }
}
