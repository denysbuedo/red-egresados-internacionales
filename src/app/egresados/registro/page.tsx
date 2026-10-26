"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MemberTypeSelect } from "@/components/MemberTypeSelect";
import { InstitutionField } from "@/components/InstitutionField";

const COUNTRIES = [
  "Argentina", "Bolivia", "Brasil", "Canadá", "Chile", "Colombia",
  "Costa Rica", "Cuba", "Ecuador", "El Salvador", "España", "Estados Unidos",
  "Francia", "Guatemala", "Guyana", "Haití", "Honduras", "Italia",
  "Jamaica", "México", "Nicaragua", "Panamá", "Paraguay", "Perú",
  "Puerto Rico", "República Dominicana", "Suriname", "Trinidad y Tobago",
  "Uruguay", "Venezuela", "Alemania", "Reino Unido", "Angola", "Mozambique",
  "Sudáfrica", "Nigeria", "Argelia", "China", "Japón", "India",
  "Australia", "Otro",
];

interface User {
  id: number;
  username: string;
  email: string;
  status?: string;
}

export default function RegistroPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  async function checkAuth() {
    try {
      const response = await fetch("/api/auth/me");
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);

        // Si ya tiene perfil de miembro, redirigir
        if (data.graduate) {
          router.push(`/miembros/${data.graduate.id}`);
        }
      } else {
        // No autenticado, redirigir a login
        router.push("/login?redirect=/miembros/registro");
      }
    } catch (error) {
      console.error("Error checking auth:", error);
      router.push("/login?redirect=/miembros/registro");
    } finally {
      setCheckingAuth(false);
    }
  }

  const isPending = user?.status === "pending";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const data = {
      memberType: formData.get("memberType"),
      employmentConfirmed: formData.get("employmentConfirmed") === "on",
      name: formData.get("name") as string,
      email: user?.email || (formData.get("email") as string),
      country: formData.get("country") as string,
      city: (formData.get("city") as string) || null,
      institution: formData.get("institution") as string,
      career: formData.get("career") as string,
      graduationYear: formData.get("graduationYear") ? Number(formData.get("graduationYear")) : null,
      currentProfession: formData.get("currentProfession") as string,
      currentCompany:
        (formData.get("currentCompany") as string) || null,
      bio: (formData.get("bio") as string) || null,
      phone: (formData.get("phone") as string) || null,
      linkedin: (formData.get("linkedin") as string) || null,
      website: (formData.get("website") as string) || null,
      skills: (formData.get("skills") as string) || null,
      languages: (formData.get("languages") as string) || null,
      interests: (formData.get("interests") as string) || null,
      photoUrl: (formData.get("photoUrl") as string) || null,
    };

    try {
      const res = await fetch("/api/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || "Error al registrarse");
      }

      // Redirigir a página de pendiente después de completar perfil
      window.location.href = "/pendiente";
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    checkAuth();
  }, []);


  if (checkingAuth) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-[#003f8f] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando autenticación...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900">
            Únete a Red MES
          </h1>
          <p className="text-gray-600 mt-2">
            Completa tu perfil profesional
          </p>
          {user && (
            <p className="text-[#003f8f] mt-2 text-sm">
              Registrando como: <span className="font-medium">{user.username}</span> ({user.email})
            </p>
          )}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            {error}
          </div>
        )}

        {isPending && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
            <p className="text-yellow-800 font-medium text-sm">⏳ Tu cuenta está pendiente de aprobación</p>
            <p className="text-yellow-600 text-xs mt-1">Completa tu perfil para que tu institución pueda revisarlo.</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          <Section title="Información Personal">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InputField
                label="Nombre Completo"
                name="name"
                required
                placeholder="Juan Pérez García"
              />
              <InputField
                label="Correo Electrónico"
                name="email"
                type="email"
                required
                placeholder="juan@ejemplo.com"
                defaultValue={user?.email}
                disabled
              />
              <SelectField
                label="País de Residencia"
                name="country"
                required
                options={COUNTRIES}
              />
              <InputField
                label="Ciudad"
                name="city"
                placeholder="La Habana"
              />
              <InputField
                label="Teléfono"
                name="phone"
                placeholder="+34 600 000 000"
              />
              <InputField
                label="URL de Foto de Perfil"
                name="photoUrl"
                placeholder="https://ejemplo.com/foto.jpg"
              />
            </div>
          </Section>

          <Section title="Vinculación institucional y formación">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InstitutionField />
              <MemberTypeSelect />
              <InputField
                label="Área de conocimiento o formación (opcional)"
                name="career"
                placeholder="Ingeniería Informática"
              />
              <InputField
                label="Año de graduación (opcional)"
                name="graduationYear"
                type="number"
                min={1900}
                max={new Date().getFullYear()}
                placeholder="2020"
              />
            </div>
          </Section>

          <Section title="Actividad en la comunidad">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InputField
                label="Cargo o actividad actual"
                name="currentProfession"
                required
                placeholder="Docente, especialista, investigador, técnico..."
              />
              <InputField
                label="Unidad, centro o departamento"
                name="currentCompany"
                placeholder="Facultad, dirección, centro o departamento"
              />
            </div>
          </Section>

          <Section title="Perfil y Enlaces">
            <div className="space-y-4">
              <TextAreaField
                label="Biografía"
                name="bio"
                placeholder="Cuéntanos sobre tu trayectoria profesional y tus logros..."
                rows={4}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InputField
                  label="LinkedIn"
                  name="linkedin"
                  placeholder="https://linkedin.com/in/tuperfil"
                />
                <InputField
                  label="Sitio Web / Portafolio"
                  name="website"
                  placeholder="https://tusitio.com"
                />
              </div>
              <InputField
                label="Habilidades"
                name="skills"
                placeholder="JavaScript, Gestión de Proyectos, Investigación (separadas por coma)"
              />
              <InputField
                label="Idiomas"
                name="languages"
                placeholder="Español, Inglés, Francés (separados por coma)"
              />
              <InputField
                label="Intereses"
                name="interests"
                placeholder="Tecnología, Salud, Educación, Cultura (separados por coma)"
              />
            </div>
          </Section>

          <label className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-gray-700">
            <input type="checkbox" name="employmentConfirmed" required className="mt-1" />
            <span>Confirmo que trabajo en el MES o en una de sus instituciones y solicito la validación de mi vínculo laboral.</span>
          </label>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-[#003f8f] hover:bg-[#002860] disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-colors"
          >
            {loading ? "Registrando..." : "Completar Registro"}
          </button>
        </form>
      </div>
    </main>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">{title}</h2>
      {children}
    </div>
  );
}

function InputField({
  label,
  name,
  type = "text",
  required,
  placeholder,
  min,
  max,
  defaultValue,
  disabled,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  min?: number;
  max?: number;
  defaultValue?: string;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        min={min}
        max={max}
        defaultValue={defaultValue}
        disabled={disabled}
        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#003f8f] focus:border-transparent transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
      />
    </div>
  );
}

function SelectField({
  label,
  name,
  required,
  options,
}: {
  label: string;
  name: string;
  required?: boolean;
  options: string[];
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <select
        name={name}
        required={required}
        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#003f8f] focus:border-transparent transition-colors text-sm"
      >
        <option value="">Seleccionar...</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}

function TextAreaField({
  label,
  name,
  placeholder,
  rows = 3,
}: {
  label: string;
  name: string;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}
      </label>
      <textarea
        name={name}
        placeholder={placeholder}
        rows={rows}
        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#003f8f] focus:border-transparent transition-colors text-sm resize-none"
      />
    </div>
  );
}
