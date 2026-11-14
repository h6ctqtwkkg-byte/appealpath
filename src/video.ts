// GET /demo.mp4: the demo video, answered in byte ranges. Static assets come back whole, and Safari (so every iPhone)
// won't play a video from a server that can't answer a range. The bytes pass through in chunks, so it costs little CPU.

/** The first byte and the last (inclusive) of a "bytes=a-b" Range header; null means send the whole file. */
export function byteRange(header: string | null, size: number): { start: number; end: number } | null | "unsatisfiable" {
  const m = /^bytes=(\d*)-(\d*)$/.exec(header?.trim() ?? "");
  if (!m || (!m[1] && !m[2])) return null;
  const start = m[1] ? Number(m[1]) : Math.max(size - Number(m[2]), 0);
  const end = m[1] && m[2] ? Math.min(Number(m[2]), size - 1) : size - 1;
  return start >= size || start > end ? "unsatisfiable" : { start, end };
}

/** The bytes from `from` up to (not including) `to` of a stream, without reading past `to`. */
export function slice(body: ReadableStream<Uint8Array>, from: number, to: number): ReadableStream<Uint8Array> {
  let pos = 0;
  return body.pipeThrough(
    new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, out) {
        const a = Math.max(from - pos, 0);
        const b = Math.min(to - pos, chunk.length);
        pos += chunk.length;
        if (b > a) out.enqueue(chunk.subarray(a, b));
        if (pos >= to) out.terminate();
      },
    }),
  );
}

/** The asset comes back without a content-length, so the first request in each isolate counts the bytes once. */
let knownSize = 0;
async function countBytes(assets: Fetcher, url: URL): Promise<number> {
  const body = (await assets.fetch(url)).body;
  if (!body) return 0;
  let n = 0;
  for (const reader = body.getReader(); ; ) {
    const { done, value } = await reader.read();
    if (done) return n;
    n += value.length;
  }
}

export async function serveVideo(request: Request, assets: Fetcher): Promise<Response> {
  const url = new URL("/demo.mp4", request.url);
  const file = await assets.fetch(url);
  if (!file.ok || !file.body) return file;
  const size = (knownSize ||= Number(file.headers.get("content-length")) || (await countBytes(assets, url)));
  if (!size) return file;
  const headers = new Headers({ "content-type": "video/mp4", "accept-ranges": "bytes", "cache-control": "public, max-age=3600" });
  const range = byteRange(request.headers.get("range"), size);
  if (range === "unsatisfiable") {
    await file.body.cancel();
    return new Response(null, { status: 416, headers: { "content-range": `bytes */${size}` } });
  }
  if (!range) {
    headers.set("content-length", String(size));
    return new Response(request.method === "HEAD" ? null : file.body.pipeThrough(new FixedLengthStream(size)), { headers });
  }
  headers.set("content-range", `bytes ${range.start}-${range.end}/${size}`);
  headers.set("content-length", String(range.end - range.start + 1));
  const bytes = slice(file.body, range.start, range.end + 1).pipeThrough(new FixedLengthStream(range.end - range.start + 1));
  return new Response(request.method === "HEAD" ? null : bytes, { status: 206, headers });
}
