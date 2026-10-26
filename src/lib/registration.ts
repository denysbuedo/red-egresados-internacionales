import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, graduates } from "@/db/schema";
import { hashPassword } from "./auth";
import { setSession, sessionStore } from "./session";
import { checkRequestOrigin } from "./api-access";
import { sql, eq } from "drizzle-orm";

export async function registerAccount(request: NextRequest) {
  const denied = checkRequestOrigin(request);
  if (denied) return denied;
  let body: Record<string, unknown>;
  try {
    body = await request.json();
    if (!body || Array.isArray(body) || typeof body !== "object") throw new Error("body");
  } catch { return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 }); }
  const text = (key: string, max: number, required = false) => {
    const value = body[key];
    if (value == null && !required) return null;
    if (typeof value !== "string" || value.length > max || (required && !value.trim())) throw new Error(`Campo inválido: ${key}`);
    return value.trim();
  };
  let account;
  let profile;
  try {
    const username = text("username", 40, true)!;
    const email = text("email", 254, true)!.toLowerCase();
    const password = body.password;
    if (!/^[a-zA-Z0-9_.-]{3,40}$/.test(username)) throw new Error("El username debe tener entre 3 y 40 letras, números, puntos, guiones o guiones bajos");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Correo electrónico inválido");
    if (typeof password !== "string" || password.length < 12 || Buffer.byteLength(password) > 72) throw new Error("La contraseña debe tener al menos 12 caracteres y como máximo 72 bytes");
    const university = text("university", 200, true)!;
    const graduationYear = Number(body.graduationYear);
    if (!Number.isInteger(graduationYear) || graduationYear < 1900 || graduationYear > new Date().getFullYear()) throw new Error("Año de graduación inválido");
    account = { username, email, password, university };
    const safeLink = (key: string) => {
      const value = text(key, 2000);
      if (value && !/^https?:\/\//i.test(value)) throw new Error(`Enlace inválido: ${key}`);
      return value;
    };
    profile = {
      name: text("name", 150, true)!, email, country: text("country", 100, true)!,
      university, career: text("career", 200, true)!, graduationYear,
      currentProfession: text("currentProfession", 200, true)!, city: text("city", 150),
      currentCompany: text("currentCompany", 200), bio: text("bio", 5000), phone: text("phone", 50),
      linkedin: safeLink("linkedin"), website: safeLink("website"), photoUrl: safeLink("photoUrl"),
      skills: text("skills", 2000), languages: text("languages", 1000), interests: text("interests", 2000),
    };
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Datos inválidos" }, { status: 400 });
  }
  // Nginx supplies X-Real-IP; direct access is restricted to loopback.
  const client = request.headers.get("x-real-ip") || "local";
  if (!sessionStore.consumeLimit(`register:${client}`, 20, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Demasiados registros. Intenta más tarde." }, { status: 429 });
  }
  const existing = db.select({ id: users.id }).from(users).where(
    sql`lower(${users.username}) = ${account.username.toLowerCase()} OR lower(${users.email}) = ${account.email}`
  ).get();
  if (existing) return NextResponse.json({ error: "El username o correo ya está registrado" }, { status: 409 });
  const passwordHash = await hashPassword(account.password);
  try {
    const newUser = db.transaction((tx) => {
      const user = tx.insert(users).values({ username: account.username, email: account.email, passwordHash,
        role: "user", status: "pending", pendingUniversity: account.university }).returning().get();
      const graduate = tx.insert(graduates).values({ ...profile, userId: user.id }).returning({ id: graduates.id }).get();
      tx.update(users).set({ graduateId: graduate.id }).where(eq(users.id, user.id)).run();
      return user;
    });
    await setSession(newUser);
    return NextResponse.json({ message: "Registro recibido. Tu universidad revisará la solicitud.",
      pending: true, redirect: "/pendiente", user: { id: newUser.id, username: newUser.username, status: "pending" } }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && /UNIQUE constraint failed/.test(error.message)) {
      return NextResponse.json({ error: "El username o correo ya está registrado" }, { status: 409 });
    }
    console.error("No se pudo completar el registro");
    return NextResponse.json({ error: "No se pudo completar el registro" }, { status: 500 });
  }
}
