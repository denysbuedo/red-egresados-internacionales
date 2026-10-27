import "server-only";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { resolve, join } from "node:path";
import sharp from "sharp";

export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
export const MEDIA_NAME = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.webp$/;
const directory = () => resolve(/*turbopackIgnore: true*/ process.env.UPLOADS_PATH || "uploads");
export class InvalidImage extends Error {}

export async function saveImage(bytes: Buffer) {
  if (!bytes.length || bytes.length > MAX_IMAGE_BYTES) throw new InvalidImage("La imagen debe pesar como máximo 8 MB.");
  const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const isPng = bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
  const isWebp = bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP";
  if (!isJpeg && !isPng && !isWebp) throw new InvalidImage("El archivo no es una imagen JPG, PNG o WebP válida.");
  let output: Buffer;
  try {
    const image = sharp(bytes, { limitInputPixels: 25000000, animated: false, failOn: "warning" });
    const metadata = await image.metadata();
    if (!metadata.format || !["jpeg", "png", "webp"].includes(metadata.format)) throw new Error("format");
    output = await image.rotate().resize({ width: 2048, height: 2048, fit: "inside", withoutEnlargement: true }).webp({ quality: 82 }).toBuffer();
  } catch { throw new InvalidImage("El archivo debe ser una imagen JPG, PNG o WebP válida, de hasta 25 megapíxeles."); }
  const name = `${randomUUID()}.webp`;
  await mkdir(directory(), { recursive: true, mode: 0o700 });
  await writeFile(join(directory(), name), output, { mode: 0o600, flag: "wx" });
  return `/api/media/${name}`;
}

export async function readImage(name: string) {
  if (!MEDIA_NAME.test(name)) return null;
  try { return await readFile(/*turbopackIgnore: true*/ join(/*turbopackIgnore: true*/ directory(), name)); }
  catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return null; throw error; }
}

export function validImageUrl(value: unknown): value is string {
  if (typeof value !== "string" || value.length > 2000) return false;
  if (value.startsWith("/api/media/")) return MEDIA_NAME.test(value.slice("/api/media/".length));
  try { const url = new URL(value); return ["http:", "https:"].includes(url.protocol) && !url.username && !url.password; }
  catch { return false; }
}
