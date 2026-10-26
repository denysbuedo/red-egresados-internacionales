"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const UNIVERSITIES = [
  "Universidad de La Habana",
  "Universidad de Oriente",
  "Universidad Central de Las Villas",
  "Universidad de Camagüey",
  "Universidad de Pinar del Río",
  "Universidad de Holguín",
  "Universidad de Granma",
  "Universidad de Matanzas",
  "Instituto Superior Politécnico José Antonio Echeverría (CUJAE)",
  "Universidad de Ciencias Médicas de La Habana",
  "Escuela Internacional de Educación Física y Deportes",
  "Instituto Superior de Arte",
  "Universidad de las Ciencias Informáticas",
  "Otra",
];

const COUNTRIES = [
  "Argentina", "Bolivia", "Brasil", "Canadá", "Chile", "Colombia",
  "Costa Rica", "Cuba", "Ecuador", "El Salvador", "España", "Estados Unidos",
  "Francia", "Guatemala", "Honduras", "Italia", "Jamaica", "México",
  "Nicaragua", "Panamá", "Paraguay", "Perú", "República Dominicana",
  "Uruguay", "Venezuela", "Alemania", "Reino Unido", "Angola", "Mozambique",
  "Sudáfrica", "Nigeria", "China", "Japón", "India", "Australia", "Otro",
];

export default function RegistroPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);

    // Combine auth + graduate data in one request
    const data = {
      username: formData.get("username"),
      email: formData.get("email"),
      password: formData.get("password"),
      university: formData.get("university"),
      name: formData.get("name"),
      country: formData.get("country"),
      career: formData.get("career"),
      graduationYear: parseInt(formData.get("graduationYear") as string),
      currentProfession: formData.get("currentProfession"),
      city: formData.get("city") || null,
      currentCompany: formData.get("currentCompany") || null,
      bio: formData.get("bio") || null,
      phone: formData.get("phone") || null,
      linkedin: formData.get("linkedin") || null,
      website: formData.get("website") || null,
      skills: formData.get("skills") || null,
      languages: formData.get("languages") || null,
      interests: formData.get("interests") || null,
      photoUrl: formData.get("photoUrl") || null,
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
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900">Registro de Egresado</h1>
          <p className="text-gray-600 mt-2">Completa tus datos para unirte a la red</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            {error}
          </div>
        )}

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
              <InputField label="Ciudad" name="city" placeholder="Madrid" />
            </div>
          </Section>

          {/* Formación */}
          <Section title="Formación en Cuba">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <SelectField label="Universidad" name="university" required options={UNIVERSITIES} />
              <InputField label="Carrera Estudiada" name="career" required placeholder="Ingeniería Informática" />
              <InputField label="Año de Graduación" name="graduationYear" type="number" required min={1960} max={2030} placeholder="2020" />
            </div>
          </Section>

          {/* Situación Profesional */}
          <Section title="Situación Profesional Actual">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InputField label="Profesión Actual" name="currentProfession" required placeholder="Desarrollador de Software" />
              <InputField label="Empresa / Organización" name="currentCompany" placeholder="Tech Company S.A." />
            </div>
          </Section>

          {/* Perfil y Enlaces */}
          <Section title="Perfil y Enlaces">
            <div className="space-y-4">
              <TextAreaField label="Biografía" name="bio" placeholder="Cuéntanos sobre tu trayectoria..." rows={4} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InputField label="LinkedIn" name="linkedin" placeholder="https://linkedin.com/in/tuperfil" />
                <InputField label="Sitio Web" name="website" placeholder="https://tusitio.com" />
              </div>
              <InputField label="Habilidades" name="skills" placeholder="JavaScript, Gestión (separadas por coma)" />
              <InputField label="Idiomas" name="languages" placeholder="Español, Inglés (separados por coma)" />
              <InputField label="Intereses" name="interests" placeholder="Tecnología, Salud (separados por coma)" />
            </div>
          </Section>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-[#003f8f] hover:bg-[#002860] disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-colors"
          >
            {loading ? "Registrando..." : "Enviar Registro"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link href="/login" className="text-[#003f8f] hover:underline text-sm">
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
        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#003f8f] focus:border-transparent text-sm"
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
        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#003f8f] focus:border-transparent text-sm"
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
        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#003f8f] focus:border-transparent text-sm resize-none"
      />
    </div>
  );
}
