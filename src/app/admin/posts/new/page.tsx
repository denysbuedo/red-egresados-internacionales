"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NewPostPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    imageUrl: "",
    pinDays: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<{ role: string } | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [previewImage, setPreviewImage] = useState<string>("");

  async function checkAuth() {
    try {
      const response = await fetch("/api/auth/me");
      if (!response.ok) {
        router.push("/login?redirect=/admin/posts/new");
        return;
      }
      const data = await response.json();
      if (!["admin", "editor"].includes(data.user.role)) {
        router.push("/");
        return;
      }
      setUser(data.user);
    } catch (error) {
      console.error("Error checking auth:", error);
      router.push("/login?redirect=/admin/posts/new");
    } finally {
      setCheckingAuth(false);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/admin/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al publicar");
      }

      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al publicar");
    } finally {
      setLoading(false);
    }
  };

  const handleImageUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setFormData({ ...formData, imageUrl: url });
    setPreviewImage(url);
  };

  useEffect(() => {
    checkAuth();
  }, []);


  if (checkingAuth || !user) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Verificando permisos...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Nueva Noticia
            </h1>
            <p className="text-gray-500 mt-1">
              Publicar una noticia en la página de inicio
            </p>
          </div>
          <Link
            href="/"
            className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg text-sm font-medium transition-colors"
          >
            ← Volver al inicio
          </Link>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <div className="mb-6">
              <label
                htmlFor="title"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Título de la Noticia
              </label>
              <input
                type="text"
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Ej: Nueva convocatoria de empleo para egresados"
                required
                minLength={5}
              />
              <p className="mt-1 text-xs text-gray-500">
                Mínimo 5 caracteres
              </p>
            </div>

            <div className="mb-6">
              <label
                htmlFor="imageUrl"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                URL de la Imagen (opcional)
              </label>
              <input
                type="url"
                id="imageUrl"
                value={formData.imageUrl}
                onChange={handleImageUrlChange}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="https://ejemplo.com/imagen.jpg"
              />
              <p className="mt-1 text-xs text-gray-500">
                URL directa de una imagen (jpg, png, webp)
              </p>
              
              {previewImage && (
                <div className="mt-3">
                  <p className="text-xs font-medium text-gray-600 mb-2">Vista previa:</p>
                  <div className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                    <img
                      src={previewImage}
                      alt="Vista previa"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        const parent = (e.target as HTMLImageElement).parentElement;
                        if (parent) {
                          parent.innerHTML = '<p class="text-gray-400 text-sm flex items-center justify-center h-full">URL de imagen no válida</p>';
                        }
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div>
              <label
                htmlFor="content"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Contenido
              </label>
              <textarea
                id="content"
                value={formData.content}
                onChange={(e) =>
                  setFormData({ ...formData, content: e.target.value })
                }
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                placeholder="Escribe el contenido completo de la noticia..."
                required
                minLength={20}
                rows={10}
              />
              <p className="mt-1 text-xs text-gray-500">
                Mínimo 20 caracteres. El texto se mostrará parcialmente con opción &quot;Leer más&quot;.
              </p>
            </div>

            {/* Fijar noticia */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📌 Fijar noticia arriba (opcional)
              </label>
              <select
                value={formData.pinDays}
                onChange={(e) => setFormData({ ...formData, pinDays: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">No fijar</option>
                <option value="1">1 día</option>
                <option value="3">3 días</option>
                <option value="7">7 días</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Las noticias fijadas aparecerán arriba en la página de inicio
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-8 py-3.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white rounded-xl font-semibold text-base transition-colors shadow-lg shadow-blue-600/20"
            >
              {loading ? "Publicando..." : "Publicar Noticia"}
            </button>
            <Link
              href="/"
              className="px-8 py-3.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-xl font-semibold text-base transition-colors"
            >
              Cancelar
            </Link>
          </div>
        </form>

        {/* Preview Info */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">
            ℹ️ Información
          </h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• La noticia aparecerá en la página de inicio para todos los usuarios logueados</li>
            <li>• Se mostrará tu nombre de usuario como autor</li>
            <li>• El contenido se mostrará parcialmente con botón &quot;Leer más&quot;</li>
            <li>• La imagen es opcional pero recomendada para mayor visibilidad</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
