import { NextRequest, NextResponse } from "next/server";

import { readUpstreamError } from "../../_lib/upstream";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://127.0.0.1:8000";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const message = body?.message;
    const history = body?.history;
    const sessionId = req.headers.get("x-session-id");

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Invalid payload. Expected: { message: string }" },
        { status: 400 },
      );
    }

    if (history !== undefined && !Array.isArray(history)) {
      return NextResponse.json(
        { error: "Invalid payload. 'history' must be an array." },
        { status: 400 },
      );
    }

    const upstream = await fetch(`${BACKEND_URL}/chat/stream`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(sessionId ? { "x-session-id": sessionId } : {}),
      },
      body: JSON.stringify({ message, history: history ?? [] }),
      cache: "no-store",
    });

    if (!upstream.ok || !upstream.body) {
      const text = await readUpstreamError(upstream, "/chat/stream");
      return new NextResponse(text, {
        status: upstream.status,
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
        },
      });
    }

    return new NextResponse(upstream.body, {
      status: upstream.status,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
