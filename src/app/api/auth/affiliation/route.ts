import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { graduates, users } from "@/db/schema";
import { getSession } from "@/lib/session";
import { checkRequestOrigin } from "@/lib/api-access";
import { MEMBER_TYPES, type MemberType } from "@/lib/site";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  const denied = checkRequestOrigin(request);
  if (denied) return denied;
  const session = await getSession({ allowPending: true });
  if (!session) return NextResponse.json({ error: "Debes iniciar sesión" }, { status: 401 });
  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Datos inválidos" }, { status: 400 }); }
  if (!body || !MEMBER_TYPES.some((type) => type.value === body.memberType) || body.employmentConfirmed !== true ||
      typeof body.institution !== "string" || !body.institution.trim() || body.institution.length > 200 ||
      typeof body.currentProfession !== "string" || !body.currentProfession.trim() || body.currentProfession.length > 200 ||
      (body.currentCompany != null && (typeof body.currentCompany !== "string" || body.currentCompany.length > 200))) {
    return NextResponse.json({ error: "Indica tu institución, perfil profesional y cargo, y confirma tu vínculo laboral" }, { status: 400 });
  }
  const profile = db.select({ id: graduates.id }).from(graduates).where(eq(graduates.userId, session.id)).get();
  if (!profile) return NextResponse.json({ error: "Primero debes crear tu perfil profesional", redirect: "/miembros/registro" }, { status: 400 });
  // A user's new affiliation needs institutional validation. Operational roles
  // remain assigned by administrators and cannot be changed through this route.
  const nextStatus = session.role === "user" ? "pending" : session.status;
  db.transaction((tx) => {
    tx.update(graduates).set({ memberType: body.memberType as MemberType,
      university: body.institution.trim(), currentProfession: body.currentProfession.trim(),
      currentCompany: body.currentCompany?.trim() || null, employmentConfirmed: true, updatedAt: new Date() })
      .where(eq(graduates.id, profile.id)).run();
    tx.update(users).set({ pendingUniversity: body.institution.trim(), status: nextStatus,
      rejectionReason: null, updatedAt: new Date() }).where(eq(users.id, session.id)).run();
  });
  return NextResponse.json({ message: "Vínculo laboral enviado para validación", redirect: nextStatus === "pending" ? "/pendiente" : `/miembros/${profile.id}` });
}
