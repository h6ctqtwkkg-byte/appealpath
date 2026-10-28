// AppealPath Worker. Static files in public/ are served before this runs; only /api/* reaches it.
// POST /api/read takes a photo of a letter and returns what the AI read. Nothing is stored: not the photo, not the answer.
import { readError, readLetter } from "./read";
import type { ReadResponse } from "./shared/types";

export interface Env {
  AI: Ai;
  /** Optional so tests and odd local setups still run without it. */
  READ_LIMIT?: RateLimit;
}

/** A 1600px JPEG from the browser is about 300 KB, or 400 KB as base64. This leaves room for a bigger phone photo. */
const MAX_BODY = 3_000_000;

function json(body: ReadResponse, status = 200): Response {
  return Response.json(body, { status, headers: { "cache-control": "no-store" } });
}

async function handleRead(request: Request, env: Env): Promise<Response> {
  if (Number(request.headers.get("content-length") ?? 0) > MAX_BODY) return json({ ok: false, error: "too_large" }, 413);
  // No accounts, so the visitor's IP is the only key there is. Shared networks share the limit.
  const visitor = request.headers.get("cf-connecting-ip") ?? "local";
  if (env.READ_LIMIT && !(await env.READ_LIMIT.limit({ key: visitor })).success) {
    console.log(JSON.stringify({ event: "read", ok: false, error: "rate_limited" }));
    return json({ ok: false, error: "rate_limited" }, 429);
  }
  const raw = await request.text();
  if (raw.length > MAX_BODY) return json({ ok: false, error: "too_large" }, 413);

  let image: unknown;
  try {
    image = (JSON.parse(raw) as { image?: unknown }).image;
  } catch {
    return json({ ok: false, error: "bad_request" }, 400);
  }
  if (typeof image !== "string" || image.length < 1000 || !/^[A-Za-z0-9+/=]+$/.test(image.slice(0, 200))) {
    return json({ ok: false, error: "bad_request" }, 400);
  }

  const started = Date.now();
  try {
    const { reading, model, neurons } = await readLetter(env.AI, image);
    const ms = Date.now() - started;
    console.log(JSON.stringify({ event: "read", ok: true, model, neurons, ms }));
    return json({ ok: true, reading, model, neurons, ms });
  } catch (err) {
    const e = readError(err);
    console.log(JSON.stringify({ event: "read", ok: false, error: e.kind, ms: Date.now() - started }));
    const status = e.kind === "quota" ? 429 : e.kind === "busy" ? 503 : 502;
    return json({ ok: false, error: e.kind }, status);
  }
}

export default {
  async fetch(request, env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === "/api/read") {
      if (request.method !== "POST") return new Response("Method not allowed", { status: 405, headers: { allow: "POST" } });
      return handleRead(request, env);
    }
    return new Response("Not found", { status: 404 });
  },
} satisfies ExportedHandler<Env>;
