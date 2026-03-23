import { NextRequest, NextResponse } from "next/server";

import { readUpstreamError } from "../_lib/upstream";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://127.0.0.1:8000";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const vote = body?.vote;
    const comment = body?.comment ?? "";
    const messageId = body?.messageId ?? "";
    const question = body?.question ?? "";
    const answer = body?.answer ?? "";
    const page = body?.page ?? "web";
    const timestamp = body?.timestamp ?? "";
    const sessionId = req.headers.get("x-session-id");

    if (vote !== "helpful" && vote !== "not_helpful") {
      return NextResponse.json(
        { error: "Invalid payload. 'vote' must be 'helpful' or 'not_helpful'." },
        { status: 400 },
      );
    }

    const upstream = await fetch(`${BACKEND_URL}/feedback`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(sessionId ? { "x-session-id": sessionId } : {}),
      },
      body: JSON.stringify({
        vote,
        comment,
        message_id: messageId,
        question,
        answer,
        page,
        timestamp,
      }),
      cache: "no-store",
    });

    const text = upstream.ok
      ? await upstream.text()
      : await readUpstreamError(upstream, "/feedback");
    return new NextResponse(text, {
      status: upstream.status,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
