import { NextRequest, NextResponse } from "next/server";

// POST /api/webhook/debug — Debug endpoint para ver qué envía Elementor
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const contentType = request.headers.get("content-type") || "";
    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => { headers[key] = value; });

    return NextResponse.json({
      success: true,
      debug: {
        contentType,
        bodyLength: rawBody.length,
        bodyPreview: rawBody.substring(0, 1000),
        headers: {
          contentType: headers["content-type"],
          origin: headers["origin"],
          userAgent: headers["user-agent"],
        }
      }
    }, { status: 200 });

  } catch (err) {
    return NextResponse.json({ error: "Debug error", details: String(err) }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: "ok", message: "Debug endpoint activo" });
}
