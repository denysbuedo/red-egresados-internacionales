"use client";
import { useState } from "react";
import { MEMBER_TYPES } from "@/lib/site";

export function AffiliationForm({ initial }: { initial: { institution: string; memberType: string; currentProfession: string; currentCompany: string } }) {
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  return <form className="mt-6 space-y-5" onSubmit={async (event) => {
    event.preventDefault(); setSaving(true); setError("");
    const data = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/auth/affiliation", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
        institution: data.get("institution"), memberType: data.get("memberType"),
        currentProfession: data.get("currentProfession"), currentCompany: data.get("currentCompany"),
        employmentConfirmed: data.get("employmentConfirmed") === "on",
      }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "No se pudo actualizar el vínculo");
      window.location.assign(result.redirect);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Error de conexión"); }
    finally { setSaving(false); }
  }}>
    <label className="block text-sm font-medium">Institución donde trabajas *
      <input name="institution" required maxLength={200} defaultValue={initial.institution} className="mt-2 block w-full rounded-lg border border-gray-300 p-3" />
    </label>
    <label className="block text-sm font-medium">Perfil profesional *
      <select name="memberType" required defaultValue={MEMBER_TYPES.some((type) => type.value === initial.memberType) ? initial.memberType : ""} className="mt-2 block w-full rounded-lg border border-gray-300 p-3">
        <option value="" disabled>Selecciona tu perfil</option>
        {MEMBER_TYPES.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
      </select>
    </label>
    <label className="block text-sm font-medium">Cargo o actividad laboral *
      <input name="currentProfession" required maxLength={200} defaultValue={initial.currentProfession} className="mt-2 block w-full rounded-lg border border-gray-300 p-3" />
    </label>
    <label className="block text-sm font-medium">Unidad, centro o departamento
      <input name="currentCompany" maxLength={200} defaultValue={initial.currentCompany} className="mt-2 block w-full rounded-lg border border-gray-300 p-3" />
    </label>
    <label className="flex items-start gap-3 text-sm text-gray-600"><input type="checkbox" name="employmentConfirmed" required className="mt-1" /><span>Confirmo que trabajo en el MES o en una de sus instituciones. Mi información será revisada por los responsables de la red.</span></label>
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    <button disabled={saving} className="rounded-lg bg-blue-800 px-5 py-3 font-semibold text-white disabled:opacity-50">{saving ? "Enviando..." : "Enviar vínculo para validar"}</button>
  </form>;
}
