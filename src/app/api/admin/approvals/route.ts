import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, graduates } from "@/db/schema";
import { getSession, sessionStore } from "@/lib/session";
import { authorizeApi } from "@/lib/api-access";
import { eq, and, desc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const denied = await authorizeApi(request, ["admin", "institution"]);
  if (denied) return denied;
  const session = (await getSession())!;
  const status = new URL(request.url).searchParams.get("status") || "pending";
  if (status !== "pending" && status !== "approved" && status !== "rejected") {
    return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
  }
  if (session.role === "institution" && !session.institutionName) {
    return NextResponse.json({ error: "Tu cuenta no tiene una universidad asignada" }, { status: 403 });
  }
  const conditions = [eq(users.status, status), eq(users.role, "user")];
  if (session.role === "institution") conditions.push(eq(users.pendingUniversity, session.institutionName!));
  const pendingUsers = db.select({
    id: users.id, username: users.username, email: users.email, role: users.role,
    status: users.status, rejectionReason: users.rejectionReason, createdAt: users.createdAt,
    graduateId: users.graduateId, graduateName: graduates.name,
    graduateUniversity: users.pendingUniversity, graduateCountry: graduates.country,
  }).from(users).leftJoin(graduates, eq(users.id, graduates.userId))
    .where(and(...conditions)).orderBy(desc(users.createdAt)).all();
  return NextResponse.json(pendingUsers);
}

export async function PUT(request: NextRequest) {
  const denied = await authorizeApi(request, ["admin", "institution"]);
  if (denied) return denied;
  const session = (await getSession())!;
  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Datos inválidos" }, { status: 400 }); }
  const { userId, action, reason } = body || {};
  const id = Number(userId);
  if (!Number.isSafeInteger(id) || id <= 0 || !["approve", "reject"].includes(action) ||
      (action === "reject" && (typeof reason !== "string" || !reason.trim() || reason.length > 2000))) {
    return NextResponse.json({ error: "Datos inválidos o falta el motivo de rechazo" }, { status: 400 });
  }
  const target = db.select().from(users).where(eq(users.id, id)).get();
  if (!target) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  if (target.id === session.id || target.role !== "user" ||
      (session.role === "institution" && (!session.institutionName || target.pendingUniversity !== session.institutionName))) {
    return NextResponse.json({ error: "No puedes gestionar esta solicitud" }, { status: 403 });
  }
  if (target.status !== "pending") return NextResponse.json({ error: "La solicitud ya fue resuelta" }, { status: 409 });
  const updated = db.transaction((tx) => {
    const result = tx.update(users).set({ status: action === "approve" ? "approved" : "rejected",
      rejectionReason: action === "reject" ? reason.trim() : null, updatedAt: new Date() })
      .where(and(eq(users.id, id), eq(users.status, "pending"))).returning({ id: users.id }).get();
    if (result && action === "reject") sessionStore.revokeUser(id);
    return result;
  });
  if (!updated) return NextResponse.json({ error: "La solicitud ya fue resuelta" }, { status: 409 });
  return NextResponse.json({ success: true, message: action === "approve" ? "Usuario aprobado" : "Usuario rechazado" });
}
