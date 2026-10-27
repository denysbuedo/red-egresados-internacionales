"use client";

import { PageHeader } from "@/components/PageHeader";

import { useState } from "react";
import Link from "next/link";

const COUNTRIES = [
  "Argentina", "Bolivia", "Brasil", "Canadá", "Chile", "Colombia",
  "Costa Rica", "Cuba", "Ecuador", "El Salvador", "España", "Estados Unidos",
  "Francia", "Guatemala", "Honduras", "Italia", "Jamaica", "México",
  "Nicaragua", "Panamá", "Paraguay", "Perú", "República Dominicana",
  "Uruguay", "Venezuela", "Alemania", "Reino Unido", "Angola", "Mozambique",
  "Sudáfrica", "Nigeria", "China", "Japón", "India", "Australia", "Otro",
];

export default function RegistroPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);

    // Combine auth + graduate data in one request
    const data = {
      employmentConfirmed: formData.get("employmentConfirmed") === "on",
      username: formData.get("username"),email:formData.get("email"),password:formData.get("password"),
      name:formData.get("name"),country:formData.get("country"),city:formData.get("city") || null,
    };

    try {
      const res = await fetch("/api/auth/register-complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const body = await res.json();

      if (!res.ok) {
        throw new Error(body.error || "Error al registrarse");
      }

      // Redirect to pending page
      window.location.href = "/pendiente";
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="ui-page min-h-screen bg-gray-50">
      <div className="ui-content max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <PageHeader title="Solicitar acceso a CONECTA" description="Una red profesional y académica para trabajadores del MES y sus instituciones." eyebrow="EMPIEZA A CONECTAR" compact />

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            {error}
          </div>
        )}

        <p className="mb-6 text-sm text-slate-600">Solicita acceso con tus datos personales y de acceso. Una vez aprobada tu cuenta podrás completar tu trayectoria, institución e intereses desde Mi perfil.</p>
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Datos de acceso */}
          <Section title="Datos de Acceso">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InputField label="Username" name="username" required placeholder="Elige un username" />
              <InputField label="Correo Electrónico" name="email" type="email" required placeholder="tu@email.com" />
              <InputField label="Contraseña" name="password" type="password" required minLength={12} maxLength={72} placeholder="Mínimo 12 caracteres" />
            </div>
          </Section>

          {/* Información Personal */}
          <Section title="Información Personal">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InputField label="Nombre Completo" name="name" required placeholder="Juan Pérez García" />
              <SelectField label="País de Residencia" name="country" required options={COUNTRIES} />
              <InputField label="Ciudad" name="city" placeholder="La Habana" />
            </div>
          </Section>

          <label className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-gray-700">
            <input type="checkbox" name="employmentConfirmed" required className="mt-1" />
            <span>Declaro que trabajo en el MES o en una de sus instituciones. La administración revisará mi solicitud de acceso. El registro de estudiantes no está habilitado en esta etapa.</span>
          </label>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-[#102B46] hover:bg-[#0C1D30] disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-colors"
          >
            {loading ? "Registrando..." : "Enviar Registro"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link href="/login" className="text-[#102B46] hover:underline text-sm">
            ← Ya tengo cuenta
          </Link>
        </div>
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">{title}</h2>
      {children}
    </div>
  );
}

function InputField({ label, name, type = "text", required, placeholder, min, max, minLength, maxLength }: any) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}{required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        min={min}
        max={max}
        minLength={minLength}
        maxLength={maxLength}
        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#102B46] focus:border-transparent text-sm"
      />
    </div>
  );
}

function SelectField({ label, name, required, options }: any) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}{required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <select
        name={name}
        required={required}
        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#102B46] focus:border-transparent text-sm"
      >
        <option value="">Seleccionar...</option>
        {options.map((opt: string) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  );
}

function TextAreaField({ label, name, placeholder, rows = 3 }: any) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      <textarea
        name={name}
        placeholder={placeholder}
        rows={rows}
        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#102B46] focus:border-transparent text-sm resize-none"
      />
    </div>
  );
}
