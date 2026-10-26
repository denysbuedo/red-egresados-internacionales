"use client";

import { useState, useEffect, useRef } from "react";
import { POST_TYPES } from "@/lib/site";
import { useRouter } from "next/navigation";

export function CreatePost() {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [postType, setPostType] = useState("update");
  const [referenceUrl, setReferenceUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [showImageInput, setShowImageInput] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [limitInfo, setLimitInfo] = useState<{
    canPost: boolean;
    postsToday: number;
    dailyLimit: number;
    remaining: number;
  } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  async function fetchLimitInfo() {
    try {
      const response = await fetch("/api/posts/limit");
      if (response.ok) {
        const data = await response.json();
        setLimitInfo(data);
      }
    } catch (error) {
      console.error("Error fetching limit:", error);
    }
  }

  const handleSubmit = async () => {
    if (!content.trim() || content.trim().length < 5) {
      setError("La publicación debe tener al menos 5 caracteres");
      return;
    }

    if (content.length > 2000) {
      setError("La publicación no puede exceder los 2000 caracteres");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: content.trim(),
          postType,
          referenceUrl: referenceUrl || null,
          imageUrl: imageUrl || null,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setContent("");
        setReferenceUrl("");
        setPostType("update");
        setImageUrl("");
        setShowImageInput(false);
        fetchLimitInfo();
        router.refresh();
      } else {
        setError(data.error || "Error al publicar");
      }
    } catch (error) {
      console.error("Error creating post:", error);
      setError("Error de conexión. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleTextareaResize = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 300)}px`;
    }
  };

  useEffect(() => {
    fetchLimitInfo();
  }, []);


  if (!limitInfo) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-4 py-1">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
      {/* Header con límite diario */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Compartir un aporte
        </h3>
        <div className={`text-sm ${limitInfo.remaining === 0 ? 'text-red-600' : 'text-gray-500'}`}>
          {limitInfo.remaining} de {limitInfo.dailyLimit} publicaciones hoy
        </div>
      </div>

      {/* Área de texto */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">Tipo de aporte
          <select value={postType} onChange={(event) => setPostType(event.target.value)} disabled={!limitInfo.canPost || loading}
            className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900">
            {POST_TYPES.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
          </select>
        </label>
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            handleTextareaResize();
          }}
          placeholder="Comparte un resultado, presenta un proyecto, plantea una consulta o invita a colaborar..."
          className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#003f8f] focus:border-transparent transition-all resize-none min-h-[100px]"
          disabled={!limitInfo.canPost || loading}
          maxLength={2000}
        />

        <label className="block text-sm font-medium text-gray-700">Enlace al recurso (opcional)
          <input type="url" value={referenceUrl} onChange={(event) => setReferenceUrl(event.target.value)} maxLength={2000}
            placeholder="https://doi.org/... o enlace al proyecto, convocatoria o documento"
            disabled={!limitInfo.canPost || loading} className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        </label>
        {/* Contador de caracteres */}
        <div className="flex items-center justify-between text-xs">
          <span className={`text-gray-500 ${content.length > 2000 ? 'text-red-600' : ''}`}>
            {content.length} / 2000 caracteres
          </span>
          {content.length < 5 && content.length > 0 && (
            <span className="text-orange-600">
              Mínimo 5 caracteres
            </span>
          )}
        </div>

        {/* Input de imagen */}
        {showImageInput && (
          <div className="space-y-2">
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="URL de la imagen (opcional)"
              className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#003f8f] text-sm"
              disabled={loading}
            />
            {imageUrl && (
              <div className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                <img
                  src={imageUrl}
                  alt="Vista previa"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    const parent = (e.target as HTMLImageElement).parentElement;
                    if (parent) {
                      parent.innerHTML = '<p class="text-gray-400 text-sm flex items-center justify-center h-full">URL no válida</p>';
                    }
                  }}
                />
                <button
                  onClick={() => {
                    setImageUrl("");
                    setShowImageInput(false);
                  }}
                  className="absolute top-2 right-2 bg-white/90 hover:bg-white text-gray-700 rounded-full p-1 shadow"
                  type="button"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Acciones */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-200">
          <button
            type="button"
            onClick={() => setShowImageInput(!showImageInput)}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium transition-colors"
            disabled={!limitInfo.canPost || loading}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {showImageInput ? 'Quitar imagen' : 'Agregar imagen'}
          </button>

          <button
            onClick={handleSubmit}
            disabled={!limitInfo.canPost || loading || !content.trim() || content.length < 5}
            className="px-6 py-2.5 bg-[#003f8f] hover:bg-[#002860] disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-medium text-sm transition-colors"
          >
            {loading ? 'Publicando...' : 'Publicar'}
          </button>
        </div>

        {/* Mensaje si alcanzó el límite */}
        {!limitInfo.canPost && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm font-medium">
              🚫 Has alcanzado el límite de {limitInfo.dailyLimit} publicaciones diarias
            </p>
            <p className="text-red-600 text-xs mt-1">
              Podrás publicar nuevamente mañana después de las 12:00 AM
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
