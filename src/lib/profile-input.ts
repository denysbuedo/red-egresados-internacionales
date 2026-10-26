import { NextResponse } from "next/server";

export function validateProfileInput(input: unknown) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }
  const body = input as Record<string, unknown>;
  for (const key of ["name", "email", "country", "city", "university", "career", "currentProfession", "currentCompany", "phone", "bio", "skills", "languages", "interests"]) {
    const value = body[key];
    if (value !== undefined && value !== null && (typeof value !== "string" || value.length > 5000)) {
      return NextResponse.json({ error: `Campo inválido: ${key}` }, { status: 400 });
    }
  }
  for (const key of ["website", "linkedin", "photoUrl"]) {
    const value = body[key];
    if (value !== undefined && value !== null && value !== "" &&
        (typeof value !== "string" || value.length > 2000 || !/^https?:\/\//i.test(value))) {
      return NextResponse.json({ error: `Enlace inválido: ${key}` }, { status: 400 });
    }
  }
  return null;
}
