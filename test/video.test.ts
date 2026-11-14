// The demo video's byte ranges: Safari asks for "bytes=0-1" first, then larger pieces as the video plays and seeks.
import { describe, expect, it } from "vitest";
import { byteRange, slice } from "../src/video";

describe("byteRange", () => {
  it("reads the ranges browsers send", () => {
    expect(byteRange("bytes=0-1", 100)).toEqual({ start: 0, end: 1 });
    expect(byteRange("bytes=50-", 100)).toEqual({ start: 50, end: 99 });
    expect(byteRange("bytes=-10", 100)).toEqual({ start: 90, end: 99 });
    expect(byteRange("bytes=90-500", 100)).toEqual({ start: 90, end: 99 });
  });

  it("sends the whole file without a range, and refuses ranges past the end", () => {
    expect(byteRange(null, 100)).toBeNull();
    expect(byteRange("bytes=0-1,5-6", 100)).toBeNull();
    expect(byteRange("bytes=100-", 100)).toBe("unsatisfiable");
    expect(byteRange("bytes=9-3", 100)).toBe("unsatisfiable");
  });
});

describe("slice", () => {
  it("cuts the bytes out of a stream that arrives in chunks", async () => {
    const bytes = Uint8Array.from({ length: 100 }, (_, i) => i);
    const chunks = [bytes.subarray(0, 30), bytes.subarray(30, 64), bytes.subarray(64)];
    const stream = new ReadableStream<Uint8Array>({ start: (c) => (chunks.forEach((x) => c.enqueue(x)), c.close()) });
    const out = new Uint8Array(await new Response(slice(stream, 25, 70)).arrayBuffer());
    expect([...out]).toEqual([...bytes.subarray(25, 70)]);
  });
});
