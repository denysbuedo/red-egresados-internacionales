"use client";
import { useId, useState } from "react";

function Preview({ value }: { value: string }) {
  const [broken, setBroken] = useState(false);
  if (broken) return <p role="status" className="rounded-lg bg-gray-50 p-4 text-sm text-gray-600">No se pudo cargar esta imagen. Puedes subir el archivo desde tu dispositivo.</p>;
  return <img src={value} alt="Vista previa de la imagen adjunta" className="max-h-64 w-full rounded-xl border border-gray-200 object-contain" onError={() => setBroken(true)} />;
}

export function ImageAttachment({ value, onChange, disabled = false, onBusyChange }: {
  value: string; onChange: (url: string) => void; disabled?: boolean; onBusyChange?: (busy: boolean) => void;
}) {
  const id = useId();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const busy = disabled || uploading;
  return <fieldset disabled={busy} className="space-y-3 rounded-xl border border-gray-200 p-4">
    <legend className="px-1 text-sm font-semibold text-gray-800">Imagen (opcional)</legend>
    <label htmlFor={id} className="block text-sm font-medium text-gray-700">Subir desde tu dispositivo</label>
    <input id={id} type="file" accept="image/jpeg,image/png,image/webp" className="block w-full text-xs text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:font-semibold file:text-blue-800" onChange={async (event) => {
      const file = event.target.files?.[0]; event.target.value = "";
      if (!file) return;
      setError("");
      if (file.size > 8 * 1024 * 1024) { setError("La imagen debe pesar como máximo 8 MB."); return; }
      setUploading(true); onBusyChange?.(true);
      try {
        const body = new FormData(); body.set("file", file);
        const response = await fetch("/api/media", { method: "POST", body });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || (response.status === 413 ? "La imagen debe pesar como máximo 8 MB." : "No se pudo subir la imagen. Inténtalo de nuevo."));
        onChange(data.url);
      } catch (reason) { setError(reason instanceof Error ? reason.message : "No se pudo subir la imagen."); }
      finally { setUploading(false); onBusyChange?.(false); }
    }} />
    <p className="text-xs leading-relaxed text-gray-500">JPG, PNG o WebP · Hasta 8 MB. Las imágenes subidas se guardan en CONECTA.</p>
    <label className="block text-xs font-medium text-gray-600">O pegar un enlace de imagen
      <input type="url" value={value.startsWith("/api/media/") ? "" : value} onChange={(event) => { setError(""); onChange(event.target.value); }} placeholder="https://ejemplo.cu/imagen.jpg" className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
    </label>
    {uploading && <p role="status" className="text-sm text-blue-800">Subiendo imagen…</p>}
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    {value && <><Preview key={value} value={value} /><div className="flex items-center justify-between gap-3"><span className="text-xs text-gray-500">{value.startsWith("/api/media/") ? "Imagen guardada en CONECTA" : "La disponibilidad depende del sitio del enlace"}</span><button type="button" onClick={() => { onChange(""); setError(""); }} className="shrink-0 text-xs font-semibold text-blue-800">Quitar imagen</button></div></>}
  </fieldset>;
}
