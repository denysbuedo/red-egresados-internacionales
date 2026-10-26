"use client";

import { useState, useEffect } from "react";

interface EmailList {
  id: number;
  name: string;
  description: string | null;
  filterUniversity: string | null;
  filterCareer: string | null;
  filterCountry: string | null;
  filterYearFrom: number | null;
  filterYearTo: number | null;
  createdAt: string;
}

interface PreviewResult {
  graduates: { name: string; email: string; country: string }[];
  emails: string;
  count: number;
}

export default function ListasCorreoPage() {
  const [lists, setLists] = useState<EmailList[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [universities, setUniversities] = useState<string[]>([]);
  const [careers, setCareers] = useState<string[]>([]);
  const [countries, setCountries] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/email-lists")
      .then((r) => r.json())
      .then(setLists);

    fetch("/api/members")
      .then((r) => r.json())
      .then((data) => {
        const unis = [...new Set(data.map((g: { university: string }) => g.university))] as string[];
        const crs = [...new Set(data.map((g: { career: string }) => g.career))] as string[];
        const ctrs = [...new Set(data.map((g: { country: string }) => g.country))] as string[];
        setUniversities(unis.sort());
        setCareers(crs.sort());
        setCountries(ctrs.sort());
      });
  }, []);

  async function previewList(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const data = {
      action: "preview",
      filterUniversity: formData.get("filterUniversity") || "",
      filterCareer: formData.get("filterCareer") || "",
      filterCountry: formData.get("filterCountry") || "",
      filterYearFrom: formData.get("filterYearFrom") || "",
      filterYearTo: formData.get("filterYearTo") || "",
    };

    const res = await fetch("/api/email-lists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    setPreview(result);
    setLoading(false);
  }

  async function saveList(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name"),
      description: formData.get("description"),
      filterUniversity: formData.get("filterUniversity") || null,
      filterCareer: formData.get("filterCareer") || null,
      filterCountry: formData.get("filterCountry") || null,
      filterYearFrom: formData.get("filterYearFrom")
        ? parseInt(formData.get("filterYearFrom") as string)
        : null,
      filterYearTo: formData.get("filterYearTo")
        ? parseInt(formData.get("filterYearTo") as string)
        : null,
    };

    await fetch("/api/email-lists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const updated = await fetch("/api/email-lists").then((r) => r.json());
    setLists(updated);
    setShowForm(false);
    setLoading(false);
  }

  function copyEmails() {
    if (preview?.emails) {
      navigator.clipboard.writeText(preview.emails);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <main className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">
              Listas de Correo
            </h1>
            <p className="text-neutral-400 mt-1">
              Crea listas de distribución por criterios de afinidad
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium text-sm transition-colors"
          >
            {showForm ? "Cancelar" : "+ Nueva Lista"}
          </button>
        </div>

        {showForm && (
          <form
            onSubmit={saveList}
            className="mb-8 bg-neutral-800/30 border border-neutral-700/50 rounded-xl p-6"
          >
            <h2 className="text-lg font-semibold text-white mb-4">
              Crear Lista de Correo
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-1.5">
                    Nombre de la Lista *
                  </label>
                  <input
                    name="name"
                    required
                    placeholder="Ej: Personal de Ciencias de la Salud"
                    className="w-full px-3.5 py-2.5 bg-neutral-900 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-1.5">
                    Descripción
                  </label>
                  <input
                    name="description"
                    placeholder="Descripción de la lista..."
                    className="w-full px-3.5 py-2.5 bg-neutral-900 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                <select
                  name="filterUniversity"
                  className="px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                >
                  <option value="">Todas las instituciones</option>
                  {universities.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
                <select
                  name="filterCareer"
                  className="px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                >
                  <option value="">Todas las áreas de conocimiento</option>
                  {careers.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <select
                  name="filterCountry"
                  className="px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                >
                  <option value="">Todos los países</option>
                  {countries.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <input
                  name="filterYearFrom"
                  type="number"
                  placeholder="Año desde"
                  min={1960}
                  max={2030}
                  className="px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                />
                <input
                  name="filterYearTo"
                  type="number"
                  placeholder="Año hasta"
                  min={1960}
                  max={2030}
                  className="px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-neutral-700 text-white rounded-xl font-medium text-sm transition-colors"
              >
                {loading ? "Guardando..." : "Guardar Lista"}
              </button>
            </div>
          </form>
        )}

        <div className="mb-8 bg-neutral-800/30 border border-neutral-700/50 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">
            Vista Previa de Correos
          </h2>
          <form onSubmit={previewList} className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              <select
                name="filterUniversity"
                className="px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="">Todas las instituciones</option>
                {universities.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
              <select
                name="filterCareer"
                className="px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="">Todas las áreas de conocimiento</option>
                {careers.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <select
                name="filterCountry"
                className="px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="">Todos los países</option>
                {countries.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <input
                name="filterYearFrom"
                type="number"
                placeholder="Año desde"
                min={1960}
                max={2030}
                className="px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
              />
              <input
                name="filterYearTo"
                type="number"
                placeholder="Año hasta"
                min={1960}
                max={2030}
                className="px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-neutral-700 hover:bg-neutral-600 text-white rounded-xl font-medium text-sm transition-colors"
            >
              {loading ? "Consultando..." : "Vista Previa"}
            </button>
          </form>

          {preview && (
            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-neutral-300 text-sm">
                  <span className="text-white font-semibold">
                    {preview.count}
                  </span>{" "}
                  miembro{preview.count !== 1 && "s"} encontrado
                  {preview.count !== 1 && "s"}
                </p>
                <button
                  onClick={copyEmails}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-medium transition-colors"
                >
                  {copied ? "Copiado!" : "Copiar Correos"}
                </button>
              </div>
              <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-4 max-h-48 overflow-y-auto">
                <p className="text-neutral-400 text-xs font-mono break-all leading-relaxed">
                  {preview.emails || "No se encontraron correos"}
                </p>
              </div>
            </div>
          )}
        </div>

        {lists.length > 0 && (
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">
              Listas Guardadas
            </h2>
            <div className="space-y-3">
              {lists.map((list) => (
                <div
                  key={list.id}
                  className="bg-neutral-800/50 border border-neutral-700/50 rounded-xl p-5"
                >
                  <h3 className="text-white font-semibold">{list.name}</h3>
                  {list.description && (
                    <p className="text-neutral-400 text-sm mt-1">
                      {list.description}
                    </p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {list.filterUniversity && (
                      <FilterBadge label="Institución" value={list.filterUniversity} />
                    )}
                    {list.filterCareer && (
                      <FilterBadge label="Carrera" value={list.filterCareer} />
                    )}
                    {list.filterCountry && (
                      <FilterBadge label="País" value={list.filterCountry} />
                    )}
                    {(list.filterYearFrom || list.filterYearTo) && (
                      <FilterBadge
                        label="Años"
                        value={`${list.filterYearFrom || "..."} - ${list.filterYearTo || "..."}`}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

function FilterBadge({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs bg-neutral-700/50 text-neutral-300 px-2.5 py-1 rounded-md">
      <span className="text-neutral-500">{label}:</span> {value}
    </span>
  );
}
