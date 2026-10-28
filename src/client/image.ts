// Shrinks a phone photo in the browser before upload: the Worker never decodes images.
const MAX_EDGE = 1600;
const QUALITY = 0.85;

export interface Photo {
  /** Object URL or path for showing the letter on screen. */
  preview: string;
  /** JPEG as base64 without the data: prefix; null for a sample letter, which is never sent. */
  base64: string | null;
  sampleId?: string;
}

export async function prepare(file: File): Promise<Photo> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no canvas");
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("encode failed"))), "image/jpeg", QUALITY),
  );
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
  return { preview: URL.createObjectURL(blob), base64: dataUrl.slice(dataUrl.indexOf(",") + 1) };
}
