"use client";

import { PageHeader } from "@/components/PageHeader";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NewEventPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: "",
    time: "18:00",
    location: "",
    type: "virtual" as "virtual" | "in-person",
    link: "",
    maxAttendees: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const dateTime = `${formData.date}T${formData.time}:00`;

      const response = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          date: dateTime,
          location: formData.type === "in-person" ? formData.location : null,
          type: formData.type,
          link: formData.type === "virtual" ? formData.link : null,
          maxAttendees: formData.maxAttendees ? parseInt(formData.maxAttendees) : null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al crear evento");
      }

      router.push("/eventos");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear evento");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ui-surface space-y-6">
      {/* Header */}
      <PageHeader title="Crear Evento" description="Abre un espacio para el encuentro y el intercambio de conocimiento." eyebrow="GESTIÓN · CREAR ENCUENTRO" actions={<Link
          href="/eventos"
          className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg text-sm font-medium transition-colors"
        >
          ← Volver a eventos
        </Link>} compact />

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-6">
          {/* Título */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Título del Evento *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#102B46] focus:border-transparent"
              placeholder="Ej: Webinar sobre Inteligencia Artificial"
              required
              minLength={5}
            />
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descripción *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#102B46] focus:border-transparent resize-none"
              placeholder="Describe el evento, temática, objetivos..."
              required
              minLength={20}
              rows={5}
            />
          </div>

          {/* Tipo de Evento */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Evento *
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, type: "virtual" })}
                className={`p-4 border-2 rounded-lg text-center transition-all ${
                  formData.type === "virtual"
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="text-2xl mb-2">🖥️</div>
                <div className="font-medium text-gray-900">Virtual</div>
                <div className="text-xs text-gray-500">Zoom, Meet, etc.</div>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, type: "in-person" })}
                className={`p-4 border-2 rounded-lg text-center transition-all ${
                  formData.type === "in-person"
                    ? "border-green-500 bg-green-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="text-2xl mb-2">📍</div>
                <div className="font-medium text-gray-900">Presencial</div>
                <div className="text-xs text-gray-500">Lugar físico</div>
              </button>
            </div>
          </div>

          {/* Fecha y Hora */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha *
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#102B46]"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hora *
              </label>
              <input
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#102B46]"
                required
              />
            </div>
          </div>

          {/* Ubicación o Enlace */}
          {formData.type === "in-person" ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ubicación Física *
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#102B46]"
                placeholder="Ej: Auditorio Principal, Universidad de La Habana"
                required={formData.type === "in-person"}
              />
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enlace del Evento (Zoom, Meet, etc.) *
              </label>
              <input
                type="url"
                value={formData.link}
                onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#102B46]"
                placeholder="https://meet.google.com/xxx-xxxx-xxx"
                required={formData.type === "virtual"}
              />
            </div>
          )}

          {/* Máximo de asistentes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Máximo de Asistentes (opcional)
            </label>
            <input
              type="number"
              value={formData.maxAttendees}
              onChange={(e) => setFormData({ ...formData, maxAttendees: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#102B46]"
              placeholder="Dejar vacío para sin límite"
              min={1}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-8 py-3.5 bg-[#102B46] hover:bg-[#0C1D30] disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-xl font-semibold text-base transition-colors"
          >
            {loading ? "Creando..." : "Crear Evento"}
          </button>
          <Link
            href="/eventos"
            className="px-8 py-3.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-xl font-semibold text-base transition-colors"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}
