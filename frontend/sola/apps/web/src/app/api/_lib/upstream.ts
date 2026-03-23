const HTML_DOCTYPE_RE = /^\s*<!DOCTYPE html/i;

function extractHtmlTitle(html: string): string | null {
  const match = html.match(/<title>([^<]+)<\/title>/i);
  return match?.[1]?.trim() || null;
}

export async function readUpstreamError(
  upstream: Response,
  path: string,
): Promise<string> {
  const contentType = upstream.headers.get("content-type") || "";
  const text = await upstream.text();
  const looksLikeHtml =
    contentType.includes("text/html") || HTML_DOCTYPE_RE.test(text);

  if (looksLikeHtml) {
    const title = extractHtmlTitle(text);
    const titleSuffix = title ? ` (${title})` : "";
    return (
      `Das konfigurierte Backend unter BACKEND_URL antwortet fuer ${path} ` +
      `mit HTML statt mit einer API-Antwort${titleSuffix}. ` +
      `Pruefe, ob BACKEND_URL wirklich auf das FastAPI-Backend zeigt ` +
      `und die Route ${path} dort erreichbar ist.`
    );
  }

  return text || `Upstream request to ${path} failed with HTTP ${upstream.status}.`;
}
