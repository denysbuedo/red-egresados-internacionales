import { validateProfileInput } from "@/lib/profile-input";
import { authorizeApi } from "@/lib/api-access";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { graduates, connections, posts, users } from "@/db/schema";
import { getSession } from "@/lib/session";
import { eq, and } from "drizzle-orm";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await authorizeApi(request);
  if (denied) return denied;
  try {
    const { id } = await params;
    const graduateId = parseInt(id);

    const graduate = await db
      .select()
      .from(graduates)
      .where(eq(graduates.id, graduateId));

    if (!graduate.length) {
      return NextResponse.json(
        { error: "Miembro no encontrado" },
        { status: 404 }
      );
    }

    const graduateConnections = await db
      .select()
      .from(connections)
      .where(
        and(
          eq(connections.status, "accepted"),
          eq(connections.senderId, graduateId)
        )
      );

    const receivedConnections = await db
      .select()
      .from(connections)
      .where(
        and(
          eq(connections.status, "accepted"),
          eq(connections.receiverId, graduateId)
        )
      );

    const graduatePosts = await db
      .select()
      .from(posts)
      .where(eq(posts.graduateId, graduateId))
      .orderBy(posts.createdAt);

    const session = (await getSession())!;
    const targetUser = db.select({ status: users.status }).from(users).where(eq(users.id, graduate[0].userId ?? -1)).get();
    if (session.role !== "admin" && graduate[0].userId !== session.id && targetUser?.status !== "approved") {
      return NextResponse.json({ error: "Miembro no encontrado" }, { status: 404 });
    }
    const { email, phone, userId, linkedin, website, ...publicProfile } = graduate[0];
    const contact = session.role === "admin" || userId === session.id ? { email, phone, linkedin, website } : {};
    return NextResponse.json({
      ...publicProfile, ...contact, graduationYear: publicProfile.graduationYear || null, institution: publicProfile.university,
      connectionsCount:
        graduateConnections.length + receivedConnections.length,
      postsCount: graduatePosts.length,
      posts: graduatePosts,
    });
  } catch (error) {
    console.error("Error fetching graduate:", error);
    return NextResponse.json(
      { error: "Error al obtener miembro" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await authorizeApi(request);
  if (denied) return denied;
  try {
    const { id } = await params;
    const graduateId = parseInt(id);
    const session = (await getSession())!;
    const target = db.select().from(graduates).where(eq(graduates.id, graduateId)).get();
    if (!target) return NextResponse.json({ error: "Miembro no encontrado" }, { status: 404 });
    if (session.role !== "admin" && target.userId !== session.id) {
      return NextResponse.json({ error: "No puedes modificar otro perfil" }, { status: 403 });
    }

    const body = await request.json();
    const invalid = validateProfileInput(body);
    if (invalid) return invalid;
    const institution = body.institution ?? body.university;
    if ((institution !== undefined && institution !== target.university) || (body.memberType !== undefined && body.memberType !== target.memberType)) {
      return NextResponse.json({ error: "Los cambios de vínculo laboral requieren validación", redirect: "/completar-perfil" }, { status: 409 });
    }

    const updated = await db
      .update(graduates)
      .set({
        memberType: body.memberType,
        name: body.name,
        email: body.email,
        country: body.country,
        city: body.city,
        university: body.institution || body.university,
        career: body.career,
        graduationYear: body.graduationYear === undefined ? undefined : (body.graduationYear ? Number(body.graduationYear) : 0),
        currentProfession: body.currentProfession,
        currentCompany: body.currentCompany,
        bio: body.bio,
        photoUrl: body.photoUrl,
        phone: body.phone,
        linkedin: body.linkedin,
        skills: body.skills,
        languages: body.languages,
        interests: body.interests,
        website: body.website,
        updatedAt: new Date(),
      })
      .where(eq(graduates.id, graduateId))
      .returning();

    if (!updated.length) {
      return NextResponse.json(
        { error: "Miembro no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(updated[0]);
  } catch (error) {
    if (error instanceof SyntaxError) return NextResponse.json({ error: "Datos de perfil inválidos" }, { status: 400 });
    if ((error as { code?: string }).code === "SQLITE_CONSTRAINT_UNIQUE") return NextResponse.json({ error: "Ese correo de contacto ya está asociado a otro perfil" }, { status: 409 });
    console.error("Error updating graduate:", error);
    return NextResponse.json(
      { error: "Error al actualizar perfil" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await authorizeApi(request);
  if (denied) return denied;
  try {
    const { id } = await params;
    const graduateId = parseInt(id);
    const session = (await getSession())!;
    const target = db.select().from(graduates).where(eq(graduates.id, graduateId)).get();
    if (!target) return NextResponse.json({ error: "Miembro no encontrado" }, { status: 404 });
    if (session.role !== "admin" && target.userId !== session.id) {
      return NextResponse.json({ error: "No puedes modificar otro perfil" }, { status: 403 });
    }


    await db.delete(graduates).where(eq(graduates.id, graduateId));

    return NextResponse.json({ message: "Perfil eliminado" });
  } catch (error) {
    console.error("Error deleting graduate:", error);
    return NextResponse.json(
      { error: "Error al eliminar perfil" },
      { status: 500 }
    );
  }
}
