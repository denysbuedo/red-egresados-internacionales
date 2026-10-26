export const SITE_NAME = "Red MES";
export const SITE_FULL_NAME = "Red profesional y académica del Ministerio de Educación Superior";
export const SITE_DESCRIPTION = "Conecta con trabajadores del MES y sus instituciones para compartir conocimiento, resultados científicos y oportunidades de colaboración.";

// The catalogue anticipates later stages; only enabled categories can register.
export const PROFILE_TYPES = [
  { value: "teacher", label: "Docente", registrationEnabled: true },
  { value: "researcher", label: "Investigador/a", registrationEnabled: true },
  { value: "specialist", label: "Especialista", registrationEnabled: true },
  { value: "technician", label: "Técnico/a", registrationEnabled: true },
  { value: "administrative", label: "Personal administrativo", registrationEnabled: true },
  { value: "manager", label: "Directivo/a", registrationEnabled: true },
  { value: "staff", label: "Otro trabajador/a", registrationEnabled: true },
  { value: "student", label: "Estudiante", registrationEnabled: false },
  { value: "graduate", label: "Egresado/a", registrationEnabled: false },
  { value: "collaborator", label: "Colaborador/a", registrationEnabled: false },
  { value: "unspecified", label: "Vínculo laboral por actualizar", registrationEnabled: false },
] as const;
export const MEMBER_TYPES = PROFILE_TYPES.filter((type) => type.registrationEnabled);
export type MemberType = typeof PROFILE_TYPES[number]["value"];
export function memberTypeLabel(value: string | null | undefined) {
  return PROFILE_TYPES.find((type) => type.value === value)?.label || "Miembro";
}

export const POST_TYPES = [
  { value: "update", label: "Actualización profesional" },
  { value: "publication", label: "Publicación científica" },
  { value: "project", label: "Proyecto" },
  { value: "call", label: "Convocatoria" },
  { value: "question", label: "Consulta profesional" },
] as const;
export type PostType = typeof POST_TYPES[number]["value"];
export function postTypeLabel(value: string | null | undefined) {
  return POST_TYPES.find((type) => type.value === value)?.label || "Actualización profesional";
}
