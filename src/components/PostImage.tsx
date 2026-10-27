"use client";
import { useState } from "react";
export function PostImage({ src, alt }: { src: string; alt: string }) {
  const [failedSource, setFailedSource] = useState<string | null>(null);
  if (failedSource === src) return <p role="status" className="rounded-lg bg-gray-50 p-5 text-sm text-gray-500">La imagen no está disponible. El contenido de la publicación sigue visible.</p>;
  return <img src={src} alt={alt} loading="lazy" className="max-h-[560px] w-full bg-gray-50 object-contain" onError={() => setFailedSource(src)} />;
}
