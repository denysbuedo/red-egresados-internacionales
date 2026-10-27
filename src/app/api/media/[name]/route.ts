import { NextResponse } from "next/server";
import { authorizeApi } from "@/lib/api-access";
import { readImage } from "@/lib/media";
export const runtime = "nodejs";
export async function GET(request: Request, { params }: { params: Promise<{ name: string }> }) {
  const denied = await authorizeApi(request);
  if (denied) return denied;
  const { name } = await params;
  const image = await readImage(name);
  if (!image) return NextResponse.json({ error: "Imagen no encontrada" }, { status: 404 });
  return new Response(new Uint8Array(image), { headers: {
    "Content-Type": "image/webp", "Content-Length": String(image.length),
    "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff",
    "Content-Disposition": 'inline; filename="imagen.webp"',
  } });
}
