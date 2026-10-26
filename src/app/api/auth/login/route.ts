import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { verifyPassword } from "@/lib/auth";
import { setSession, sessionStore } from "@/lib/session";
import { checkRequestOrigin } from "@/lib/api-access";
import { sql } from "drizzle-orm";
import bcrypt from "bcryptjs";

const dummyHash = bcrypt.hashSync("invalid-user-placeholder", 10);

export async function POST(request: NextRequest) {
  const denied = checkRequestOrigin(request);
  if (denied) return denied;
  let body;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 });
  }
  const { username, password } = body || {};
  if (typeof username !== "string" || typeof password !== "string" ||
      !username.trim() || username.length > 254 || !password || Buffer.byteLength(password) > 72) {
    return NextResponse.json({ error: "Credenciales inválidas" }, { status: 400 });
  }
  const identifier = username.trim().toLowerCase();
  const client = request.headers.get("x-real-ip") || "local";
  if (!sessionStore.consumeLimit(`login-ip:${client}`, 200, 15 * 60 * 1000)) {
    return NextResponse.json({ error: "Demasiados intentos. Intenta más tarde." }, { status: 429 });
  }
  if (!sessionStore.consumeLimit(`login:${identifier}`, 10, 15 * 60 * 1000)) {
    return NextResponse.json({ error: "Demasiados intentos. Intenta de nuevo en 15 minutos." },
      { status: 429, headers: { "Retry-After": "900" } });
  }
  const user = db.select().from(users).where(
    sql`lower(${users.username}) = ${identifier} OR lower(${users.email}) = ${identifier}`
  ).get();
  const valid = await verifyPassword(password, user?.passwordHash || dummyHash);
  if (!user || !valid) return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
  if (user.status === "rejected") {
    return NextResponse.json({ error: "Tu cuenta fue rechazada.", reason: user.rejectionReason }, { status: 403 });
  }
  if (!["pending", "approved"].includes(user.status)) {
    return NextResponse.json({ error: "Cuenta no disponible" }, { status: 403 });
  }
  await setSession(user);
  return NextResponse.json({
    message: user.status === "pending" ? "Tu cuenta está pendiente de aprobación." : "Login exitoso",
    pending: user.status === "pending", redirect: user.status === "pending" ? "/pendiente" : "/",
    user: { id: user.id, username: user.username, email: user.email, role: user.role, status: user.status },
  });
}
