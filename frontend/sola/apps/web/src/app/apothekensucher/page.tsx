"use client";

import React, { useMemo, useState } from "react";
import { Bot, RotateCcw, SendHorizontal, User } from "lucide-react";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type SurveyVote = "helpful" | "not_helpful";
const STREAM_META_START = "\n[[SOLA_META:";
const STREAM_META_END = "]]";
const SESSION_IDLE_TIMEOUT_MS = 10 * 60 * 1000;

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function getAnonSessionId(): string {
  const g = globalThis as unknown as {
    __helpsolaSessionId?: string;
    __helpsolaSessionLastSeenAt?: number;
  };
  const now = Date.now();
  const lastSeenAt = g.__helpsolaSessionLastSeenAt ?? 0;
  const expired = !lastSeenAt || now - lastSeenAt > SESSION_IDLE_TIMEOUT_MS;

  if (!g.__helpsolaSessionId || expired) {
    g.__helpsolaSessionId =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `anon-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }
  g.__helpsolaSessionLastSeenAt = now;
  return g.__helpsolaSessionId;
}

function normalizeAnswer(input: unknown): string {
  if (typeof input !== "string") return "Keine Antwort erhalten.";

  const match = input.match(/AIMessage\(content='([\s\S]*?)', additional_kwargs=/);
  const value = match?.[1] ?? input;

  return value
    .replace(/\\n/g, "\n")
    .replace(/Ã¤/g, "ä")
    .replace(/Ã¶/g, "ö")
    .replace(/Ã¼/g, "ü")
    .replace(/ÃŸ/g, "ß")
    .replace(/Ã„/g, "Ä")
    .replace(/Ã–/g, "Ö")
    .replace(/Ãœ/g, "Ü")
    .replace(/ÃƒÆ’Ã‚Â¤/g, "ä")
    .replace(/ÃƒÆ’Ã‚Â¶/g, "ö")
    .replace(/ÃƒÆ’Ã‚Â¼/g, "ü")
    .replace(/ÃƒÆ’Ã…Â¸/g, "ß");
}

function parseStreamPayload(raw: string): { text: string; toolUsed: boolean; status: string } {
  let toolUsed = false;
  let text = raw;
  let status = "";

  while (true) {
    const metaStart = text.indexOf(STREAM_META_START);
    if (metaStart < 0) break;
    const metaEnd = text.indexOf(STREAM_META_END, metaStart + STREAM_META_START.length);
    if (metaEnd >= 0) {
      const metaJson = text.slice(metaStart + STREAM_META_START.length, metaEnd);
      try {
        const parsed = JSON.parse(metaJson) as { tool_used?: boolean; status?: string };
        toolUsed = !!parsed.tool_used;
        if (typeof parsed.status === "string") status = parsed.status;
      } catch {
        // ignore malformed stream meta
      }
      text = text.slice(0, metaStart) + text.slice(metaEnd + STREAM_META_END.length);
    } else {
      text = text.slice(0, metaStart);
      break;
    }
  }

  return { text: normalizeAnswer(text), toolUsed, status };
}

export default function ApothekensucherPage() {
  const safetyNotice =
    "Hinweis: Dies ist eine Demo und kann Fehler enthalten. Bei akuten medizinischen Notfällen rufe bitte 112 an.";
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingSurveyMessageId, setPendingSurveyMessageId] = useState<string | null>(null);
  const [surveyVote, setSurveyVote] = useState<SurveyVote | null>(null);
  const [surveyComment, setSurveyComment] = useState("");
  const [surveyThanksVisible, setSurveyThanksVisible] = useState(false);
  const [surveySubmitting, setSurveySubmitting] = useState(false);
  const [surveyError, setSurveyError] = useState("");
  const [loadingStatus, setLoadingStatus] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const canSend = useMemo(() => input.trim().length > 0 && !loading, [input, loading]);
  const canSubmitSurvey = !!pendingSurveyMessageId && !!surveyVote;
  const activeAssistantMessage = [...messages].reverse().find((m) => m.role === "assistant");
  const showLoadingBubble = loading && !(activeAssistantMessage?.content?.trim());

  function closeSurvey() {
    setPendingSurveyMessageId(null);
    setSurveyVote(null);
    setSurveyComment("");
    setSurveyError("");
  }

  async function submitSurvey() {
    if (!pendingSurveyMessageId || !surveyVote) return;

    const assistantIndex = messages.findIndex((m) => m.id === pendingSurveyMessageId);
    const answer = assistantIndex >= 0 ? messages[assistantIndex]?.content ?? "" : "";
    const question =
      assistantIndex > 0
        ? [...messages.slice(0, assistantIndex)]
            .reverse()
            .find((m) => m.role === "user")?.content ?? ""
        : "";

    try {
      setSurveySubmitting(true);
      setSurveyError("");

      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-session-id": getAnonSessionId(),
        },
        body: JSON.stringify({
          vote: surveyVote,
          comment: surveyComment.trim(),
          messageId: pendingSurveyMessageId,
          question,
          answer,
          page: "web-chat",
          timestamp: new Date().toISOString(),
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || "Feedback request failed");
      }

      closeSurvey();
      setSurveyThanksVisible(true);
      setTimeout(() => setSurveyThanksVisible(false), 2500);
    } catch (error) {
      const errMsg =
        error instanceof Error ? error.message : "Feedback konnte nicht gesendet werden.";
      setSurveyError(errMsg);
    } finally {
      setSurveySubmitting(false);
    }
  }

  async function onSend() {
    const message = input.trim();
    if (!message || loading) return;
    const historyForRequest = messages.slice(-12).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    setInput("");
    setLoading(true);
    setLoadingStatus("Ich bearbeite deine Anfrage...");
    setMessages((prev) => [...prev, { id: makeId(), role: "user", content: message }]);

    try {
      const assistantId = makeId();
      setMessages((prev) => [...prev, { id: assistantId, role: "assistant", content: "" }]);

      const res = await fetch("/api/chat/stream", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-session-id": getAnonSessionId(),
        },
        body: JSON.stringify({ message, history: historyForRequest }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Request failed");
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No stream body available");

      const decoder = new TextDecoder();
      let fullAnswer = "";
      let toolUsed = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        fullAnswer += decoder.decode(value, { stream: true });
        const parsed = parseStreamPayload(fullAnswer);
        toolUsed = toolUsed || parsed.toolUsed;
        setLoadingStatus(parsed.status);
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, content: parsed.text } : m)),
        );
      }

      const parsedFinal = parseStreamPayload(fullAnswer);
      fullAnswer = parsedFinal.text;
      toolUsed = toolUsed || parsedFinal.toolUsed;
      setLoadingStatus(parsedFinal.status);
      setMessages((prev) =>
        prev.map((m) => (m.id === assistantId ? { ...m, content: fullAnswer } : m)),
      );

      if (toolUsed && fullAnswer.trim() && !fullAnswer.startsWith("Fehler:")) {
        setPendingSurveyMessageId(assistantId);
        setSurveyVote(null);
        setSurveyComment("");
        setSurveyError("");
      } else {
        setPendingSurveyMessageId(null);
      }
    } catch (error) {
      setLoadingStatus("");
      const err = error instanceof Error ? error.message : "Unbekannter Fehler";
      setMessages((prev) => {
        const copy = [...prev];
        const lastAssistantIndex = copy
          .map((m, idx) => ({ m, idx }))
          .filter((x) => x.m.role === "assistant")
          .pop()?.idx;

        if (lastAssistantIndex !== undefined && !copy[lastAssistantIndex].content) {
          copy[lastAssistantIndex] = {
            ...copy[lastAssistantIndex],
            content: `Fehler: ${err}`,
          };
          return copy;
        }

        return [...copy, { id: makeId(), role: "assistant", content: `Fehler: ${err}` }];
      });
    } finally {
      setLoading(false);
      setLoadingStatus("");
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f5f0] px-4 py-5 text-slate-950 sm:px-6">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -right-24 -top-24 h-[30rem] w-[30rem] rounded-full bg-[rgba(26,63,168,0.08)] blur-3xl" />
        <div className="absolute -left-20 bottom-28 h-[22rem] w-[22rem] rounded-full bg-[rgba(14,140,130,0.08)] blur-3xl" />
      </div>

      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <header className="flex items-center justify-between py-2">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Sola Logo" className="h-8 w-8 rounded-md object-contain" />
            <p className="text-sm font-semibold tracking-[0.12em] text-[#0d2870]">HELPSOLA</p>
          </div>
        </header>

        <div className="sticky top-3 z-20 mx-auto w-full max-w-3xl rounded-2xl border border-[#c96b10]/25 bg-[#fff1e6] px-4 py-3 text-center text-sm font-medium text-[#8b4a0b] shadow-[0_10px_30px_rgba(201,107,16,0.08)] backdrop-blur-sm">
          {safetyNotice}
        </div>

        <section className="text-center">
          <h1 className="font-serif text-4xl tracking-tight text-slate-950 sm:text-5xl">
            Wo suchst du eine Notdienst-Apotheke?
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-base text-slate-600 sm:text-lg">
            Nenne deinen Ort oder deine Postleitzahl, und ich suche passende
            Notdienst-Apotheken in deiner Nähe.
          </p>
        </section>

        <section className="flex min-h-[68vh] flex-col rounded-[30px] border border-slate-900/10 bg-white/90 p-4 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:p-6">
          <div className="flex-1 space-y-6 overflow-y-auto pr-1">
            {messages.map((msg) => (
              <div key={msg.id} className="space-y-2">
                <div
                  className={`flex items-center gap-2 text-xs font-semibold tracking-[0.12em] ${
                    msg.role === "user" ? "justify-end text-slate-500" : "text-slate-600"
                  }`}
                >
                  {msg.role === "assistant" ? (
                    <>
                      <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#e6ecff] text-[#1a3fa8]">
                        <Bot className="h-4 w-4" />
                      </span>
                      <span>SOLA</span>
                    </>
                  ) : (
                    <>
                      <span>YOU</span>
                      <span className="grid h-8 w-8 place-items-center rounded-lg bg-slate-100 text-slate-700">
                        <User className="h-4 w-4" />
                      </span>
                    </>
                  )}
                </div>

                <div
                  className={`max-w-[90%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-base leading-relaxed sm:text-[1.06rem] ${
                    msg.role === "user"
                      ? "ml-auto border border-[#1a3fa8]/15 bg-[#0d2870] text-white"
                      : "mr-auto border border-slate-900/10 bg-[#f7f5f0] text-slate-900"
                  }`}
                >
                  {msg.content}
                </div>

                {pendingSurveyMessageId === msg.id && !loading && (
                  <div className="mr-auto max-w-[90%] rounded-2xl border border-slate-900/10 bg-white p-3 text-sm text-slate-700 shadow-[0_12px_28px_rgba(15,23,42,0.06)]">
                    <p className="font-medium text-slate-950">War diese Antwort hilfreich?</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setSurveyVote("helpful")}
                        className={`rounded-lg border px-3 py-1.5 transition ${
                          surveyVote === "helpful"
                            ? "border-emerald-300/80 bg-emerald-500/20 text-emerald-800"
                            : "border-slate-300 bg-[#f7f5f0] text-slate-800 hover:bg-slate-100"
                        }`}
                      >
                        Ja
                      </button>
                      <button
                        type="button"
                        onClick={() => setSurveyVote("not_helpful")}
                        className={`rounded-lg border px-3 py-1.5 transition ${
                          surveyVote === "not_helpful"
                            ? "border-rose-300/80 bg-rose-500/20 text-rose-800"
                            : "border-slate-300 bg-[#f7f5f0] text-slate-800 hover:bg-slate-100"
                        }`}
                      >
                        Nein
                      </button>
                    </div>
                    <textarea
                      className="mt-2 min-h-16 w-full resize-none rounded-lg border border-slate-300 bg-[#f7f5f0] px-3 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-500"
                      placeholder="Optional: Was sollen wir verbessern?"
                      value={surveyComment}
                      onChange={(e) => setSurveyComment(e.target.value)}
                    />
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => void submitSurvey()}
                        disabled={!canSubmitSurvey || surveySubmitting}
                        className="rounded-lg bg-[#0d2870] px-3 py-1.5 text-sm text-white transition hover:bg-[#1a3fa8] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
                      >
                        {surveySubmitting ? "Sende..." : "Feedback senden"}
                      </button>
                      <button
                        type="button"
                        onClick={closeSurvey}
                        disabled={surveySubmitting}
                        className="rounded-lg border border-slate-300 bg-transparent px-3 py-1.5 text-sm text-slate-700 transition hover:bg-slate-100"
                      >
                        Überspringen
                      </button>
                    </div>
                    {surveyError && <p className="mt-2 text-xs text-rose-600">{surveyError}</p>}
                  </div>
                )}
              </div>
            ))}

            {showLoadingBubble && (
              <div className="mr-auto flex items-center gap-3 rounded-xl border border-slate-900/10 bg-[#f7f5f0] px-4 py-2 text-sm text-slate-700">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#bfd0ff] border-t-[#1a3fa8]" />
                <div className="flex flex-col">
                  <span>Sola arbeitet gerade...</span>
                  {loadingStatus && <span className="text-xs text-slate-500">{loadingStatus}</span>}
                </div>
              </div>
            )}
          </div>

          <div className="mt-5 flex items-end gap-2 rounded-2xl border border-slate-900/10 bg-[#f7f5f0] p-2">
            <textarea
              className="min-h-12 w-full resize-none bg-transparent px-2 py-2 text-sm text-slate-950 outline-none placeholder:text-slate-500 sm:text-base"
              placeholder="Zum Beispiel: Ich suche eine Notdienst-Apotheke in Bonn"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void onSend();
                }
              }}
            />
            <button
              type="button"
              onClick={() => void onSend()}
              disabled={!canSend}
              className="grid h-10 w-10 place-items-center rounded-xl bg-[#0d2870] text-white transition hover:bg-[#1a3fa8] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
            >
              <SendHorizontal className="h-4 w-4" />
            </button>
          </div>

          {surveyThanksVisible && (
            <p className="mt-2 text-xs text-emerald-700">Danke, dein Feedback wurde erfasst.</p>
          )}

          <p className="mt-4 flex items-center gap-2 text-xs text-slate-500">
            <RotateCcw className="h-3.5 w-3.5" />
            Enter zum Senden, Shift+Enter für neue Zeile
          </p>
        </section>
      </div>
    </main>
  );
}
