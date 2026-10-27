"use client";

import { PageHeader } from "@/components/PageHeader";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ImageAttachment } from "@/components/ImageAttachment";

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
  const [uploading, setUploading] = useState(false);

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
    if (uploading) return;
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

  useEffect(() => {
    checkAuth();
  }, []);


  if (checkingAuth || !user) {
    return (
      <main className="ui-page min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Verificando permisos...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="ui-page min-h-screen bg-gray-50">
      <div className="ui-content max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <PageHeader title="Nueva Noticia" description="Comparte una convocatoria, un resultado o una novedad institucional." eyebrow="GESTIÓN · CREAR NOTICIA" actions={<Link
            href="/"
            className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg text-sm font-medium transition-colors"
          >
            ← Volver al inicio
          </Link>} compact />

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
                placeholder="Ej: Convocatoria de colaboración para la comunidad"
                required
                minLength={5}
              />
              <p className="mt-1 text-xs text-gray-500">
                Mínimo 5 caracteres
              </p>
            </div>

            <div className="mb-6"><ImageAttachment value={formData.imageUrl} onChange={(url) => setFormData((previous) => ({ ...previous, imageUrl: url }))} disabled={loading} onBusyChange={setUploading} /></div>

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
              disabled={loading || uploading}
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
