import { validImageUrl } from "./media";
import { MEMBER_TYPES } from "./site";
import { NextResponse } from "next/server";

export function validateProfileInput(input: unknown) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }
  const body = input as Record<string, unknown>;
  if (body.memberType !== undefined && !MEMBER_TYPES.some((type) => type.value === body.memberType)) {
    return NextResponse.json({ error: "Tipo de miembro inválido" }, { status: 400 });
  }
  if (body.graduationYear !== undefined && body.graduationYear !== null && body.graduationYear !== "" &&
      (!Number.isInteger(Number(body.graduationYear)) || Number(body.graduationYear) < 1900 || Number(body.graduationYear) > new Date().getFullYear())) {
    return NextResponse.json({ error: "Año de graduación inválido" }, { status: 400 });
  }
  for (const key of ["name", "email", "country", "city", "university", "career", "currentProfession", "currentCompany", "phone", "bio", "skills", "languages", "interests"]) {
    const value = body[key];
    if (value !== undefined && value !== null && (typeof value !== "string" || value.length > 5000)) {
      return NextResponse.json({ error: `Campo inválido: ${key}` }, { status: 400 });
    }
  }
  for (const key of ["name", "email", "country", "currentProfession"]) {
    if (body[key] !== undefined && (typeof body[key] !== "string" || !(body[key] as string).trim())) return NextResponse.json({ error: `Completa el campo: ${key}` }, { status: 400 });
  }
  if (body.email !== undefined && (typeof body.email !== "string" || body.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email))) return NextResponse.json({ error: "Indica un correo de contacto válido" }, { status: 400 });
  if (body.photoUrl !== undefined && body.photoUrl !== null && body.photoUrl !== "" && !validImageUrl(body.photoUrl)) return NextResponse.json({ error: "Indica una foto subida a CONECTA o un enlace http/https válido" }, { status: 400 });
  for (const key of ["website", "linkedin"]) {
    const value = body[key];
    if (value !== undefined && value !== null && value !== "" &&
        (typeof value !== "string" || value.length > 2000 || !/^https?:\/\//i.test(value))) {
      return NextResponse.json({ error: `Enlace inválido: ${key}` }, { status: 400 });
    }
  }
  return null;
}
