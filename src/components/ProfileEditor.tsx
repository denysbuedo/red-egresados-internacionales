"use client";
import { useId, useState, type InputHTMLAttributes } from "react";
import Link from "next/link";
import { ImageAttachment } from "./ImageAttachment";
import { memberTypeLabel } from "@/lib/site";

export type EditableProfile = {
  id: number; name: string; email: string; country: string; city: string | null;
  currentProfession: string; currentCompany: string | null; career: string; graduationYear: number;
  bio: string | null; phone: string | null; linkedin: string | null; website: string | null;
  skills: string | null; interests: string | null; languages: string | null; photoUrl: string | null;
  university: string; memberType: string;
};
function Field({ label, hint, className, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) {
  const id = useId();
  return <div className={`member-form-field ${className || ""}`}><label htmlFor={id}>{label}</label><input id={id} aria-describedby={hint ? `${id}-hint` : undefined} {...props} />{hint && <small id={`${id}-hint`}>{hint}</small>}</div>;
}
export function ProfileEditor({ initial }: { initial: EditableProfile }) {
  const [photoUrl, setPhotoUrl] = useState(initial.photoUrl || "");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const profileUrl = `/miembros/${initial.id}`;
  return <form className="member-edit-form" onSubmit={async (event) => {
    event.preventDefault(); if (uploading || saving) return;
    setSaving(true); setError("");
    const data = new FormData(event.currentTarget);
    const text = (key: string) => String(data.get(key) || "").trim();
    const payload = {
      name: text("name"), email: text("email"), country: text("country"), city: text("city") || null,
      currentProfession: text("currentProfession"), currentCompany: text("currentCompany") || null,
      career: text("career"), graduationYear: text("graduationYear") ? Number(text("graduationYear")) : null,
      bio: text("bio") || null, phone: text("phone") || null, linkedin: text("linkedin") || null,
      website: text("website") || null, skills: text("skills") || null, interests: text("interests") || null,
      languages: text("languages") || null, photoUrl: photoUrl || null,
    };
    try {
      const response = await fetch(`/api/members/${initial.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "No se pudo guardar el perfil.");
      window.location.assign(`${profileUrl}?actualizado=1`);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "No se pudo guardar el perfil. Revisa tu conexión."); setSaving(false); }
  }}>
    <div className="member-edit-layout"><div className="member-edit-fields"><fieldset disabled={saving}>
      <section id="presentacion" className="member-section"><div className="member-section-heading"><div><p className="workspace-kicker">01 / TU VOZ EN LA COMUNIDAD</p><h2>Presentación</h2></div></div><div className="member-form-grid">
        <Field name="name" label="Nombre completo" defaultValue={initial.name} required maxLength={120} autoComplete="name" />
        <Field name="currentProfession" label="Cargo o actividad profesional" defaultValue={initial.currentProfession} required maxLength={200} />
        <Field name="country" label="País" defaultValue={initial.country} required maxLength={120} autoComplete="country-name" />
        <Field name="city" label="Ciudad" defaultValue={initial.city || ""} maxLength={200} autoComplete="address-level2" />
        <div className="member-form-field member-form-wide"><label htmlFor="profile-bio">Sobre mí</label><textarea id="profile-bio" aria-describedby="profile-bio-hint" name="bio" defaultValue={initial.bio || ""} maxLength={5000} rows={5} placeholder="Presenta tu experiencia, lo que te interesa y lo que puedes aportar a la comunidad." /><small id="profile-bio-hint">Hasta 5000 caracteres. Comparte lo que te gustaría que otras personas conozcan de tu trabajo.</small></div>
      </div></section>
      <section id="trayectoria" className="member-section"><div className="member-section-heading"><div><p className="workspace-kicker">02 / EXPERIENCIA Y FORMACIÓN</p><h2>Trayectoria</h2></div></div><div className="member-form-grid">
        <Field className="member-form-wide" name="currentCompany" label="Centro, departamento o unidad de trabajo" defaultValue={initial.currentCompany || ""} maxLength={200} />
        <div className="member-form-field member-form-wide"><label htmlFor="profile-career">Áreas de conocimiento y formación</label><textarea id="profile-career" name="career" defaultValue={initial.career} maxLength={200} rows={3} aria-describedby="career-hint" /><small id="career-hint">Separa las áreas con comas o escribe una por línea. Hasta 200 caracteres. Las habilidades y los intereses tienen sus propias secciones.</small></div>
        <Field name="graduationYear" label="Año de graduación (opcional)" type="number" min={1900} max={new Date().getFullYear()} defaultValue={initial.graduationYear > 0 ? initial.graduationYear : ""} />
      </div><div className="member-edit-affiliation"><p className="workspace-kicker">VÍNCULO INSTITUCIONAL</p><strong>{initial.university}</strong><p>{memberTypeLabel(initial.memberType)}</p><p>Para cambiar la institución o el tipo de vínculo, utiliza la actualización laboral con validación institucional.</p><Link href="/completar-perfil">Actualizar vínculo laboral →</Link></div></section>
      <section id="conocimientos" className="member-section"><div className="member-section-heading"><div><p className="workspace-kicker">03 / CAPACIDADES E INTERESES</p><h2>Conocimientos y colaboración</h2></div></div><div className="member-form-stack">
        <Field name="skills" label="Conocimientos y habilidades" defaultValue={initial.skills || ""} maxLength={1000} placeholder="Ciencia abierta, análisis de datos, gestión de proyectos" hint="Separa los elementos con comas para mostrarlos como etiquetas." />
        <Field name="interests" label="Intereses de colaboración" defaultValue={initial.interests || ""} maxLength={1000} placeholder="¿Qué temas o iniciativas te gustaría explorar?" hint="Separa los temas con comas." />
        <Field name="languages" label="Idiomas" defaultValue={initial.languages || ""} maxLength={500} placeholder="Español, inglés" hint="Separa los idiomas con comas." />
      </div></section>
      <section id="contacto" className="member-section"><div className="member-section-heading"><div><p className="workspace-kicker">04 / CONTINUEMOS LA CONVERSACIÓN</p><h2>Contacto y enlaces</h2></div></div><div className="member-form-grid">
        <Field name="email" label="Correo de contacto" type="email" defaultValue={initial.email} required maxLength={254} autoComplete="email" hint="No cambia el correo ni el usuario con el que accedes a CONECTA." />
        <Field name="phone" label="Teléfono (opcional)" type="tel" defaultValue={initial.phone || ""} maxLength={100} autoComplete="tel" />
        <Field name="website" label="Sitio web (opcional)" type="url" defaultValue={initial.website || ""} maxLength={2000} placeholder="https://" />
        <Field name="linkedin" label="LinkedIn (opcional)" type="url" defaultValue={initial.linkedin || ""} maxLength={2000} placeholder="https://www.linkedin.com/in/…" />
      </div><p className="member-privacy-note">Los datos de contacto se muestran en el perfil completo, accesible para ti, tus conexiones y la administración.</p></section>
    </fieldset></div><aside className="member-edit-aside"><section id="foto" className="member-section"><div className="member-section-heading"><div><p className="workspace-kicker">TU IDENTIDAD EN LA RED</p><h2>Foto de perfil</h2></div></div><ImageAttachment value={photoUrl} onChange={setPhotoUrl} disabled={saving} onBusyChange={setUploading} /><p className="member-privacy-note">Elige una foto clara para que la comunidad pueda reconocerte. Si la quitas, se mostrarán tus iniciales.</p></section><div className="member-profile-tip"><span aria-hidden="true">◇</span><h2>Tu perfil evoluciona contigo</h2><p>Puedes actualizar tu presentación y conocimientos cuando quieras, sin cambiar tus credenciales de acceso.</p></div></aside></div>
    <div className="member-save-bar">{error && <p role="alert">{error}</p>}<div><span>{uploading ? "Espera a que termine de subir la foto." : "Los cambios se aplican al guardar."}</span><div><Link href={profileUrl} aria-disabled={saving}>Cancelar</Link><button type="submit" disabled={saving || uploading} className="conecta-cta">{saving ? "Guardando…" : "Guardar cambios"}</button></div></div></div>
  </form>;
}
