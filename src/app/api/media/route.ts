import { NextResponse } from "next/server";
import { authorizeApi } from "@/lib/api-access";
import { getSession, sessionStore } from "@/lib/session";
import { InvalidImage, MAX_IMAGE_BYTES, saveImage } from "@/lib/media";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const denied = await authorizeApi(request);
  if (denied) return denied;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Debes iniciar sesión" }, { status: 401 });
  if (!sessionStore.consumeLimit(`upload:${session.id}`, 20, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Has alcanzado el límite de imágenes por hora. Inténtalo más tarde." }, { status: 429 });
  }
  if (Number(request.headers.get("content-length")) > MAX_IMAGE_BYTES + 65536) {
    return NextResponse.json({ error: "La imagen debe pesar como máximo 8 MB." }, { status: 413 });
  }
  if (!request.headers.get("content-type")?.startsWith("multipart/form-data")) {
    return NextResponse.json({ error: "Selecciona una imagen para subir." }, { status: 400 });
  }
  try {
    // Bound the stream even when the caller omits Content-Length.
    const reader = request.body?.getReader();
    if (!reader) return NextResponse.json({ error: "Falta la imagen." }, { status: 400 });
    const chunks: Uint8Array[] = []; let size = 0;
    while (true) {
      const { done, value } = await reader.read(); if (done) break;
      size += value.byteLength;
      if (size > MAX_IMAGE_BYTES + 65536) { await reader.cancel(); return NextResponse.json({ error: "La imagen debe pesar como máximo 8 MB." }, { status: 413 }); }
      chunks.push(value);
    }
    let form: FormData;
    try { form = await new Response(Buffer.concat(chunks), { headers: { "Content-Type": request.headers.get("content-type")! } }).formData(); }
    catch { return NextResponse.json({ error: "El archivo recibido no es válido." }, { status: 400 }); }
    const file = form.get("file");
    if (!(file instanceof File) || !file.size) return NextResponse.json({ error: "Selecciona una imagen." }, { status: 400 });
    if (file.size > MAX_IMAGE_BYTES) return NextResponse.json({ error: "La imagen debe pesar como máximo 8 MB." }, { status: 413 });
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) return NextResponse.json({ error: "Usa una imagen JPG, PNG o WebP." }, { status: 400 });
    const url = await saveImage(Buffer.from(await file.arrayBuffer()));
    return NextResponse.json({ url }, { status: 201 });
  } catch (error) {
    if (error instanceof InvalidImage) return NextResponse.json({ error: error.message }, { status: 400 });
    console.error("Image storage failed", error instanceof Error ? error.name : "unknown");
    return NextResponse.json({ error: "No se pudo guardar la imagen. Inténtalo de nuevo." }, { status: 500 });
  }
}
