import { authorizeApi } from "@/lib/api-access";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { groups, groupMembers, groupPosts, graduates, users } from "@/db/schema";
import { getSession } from "@/lib/session";
import { eq, and, desc, sql } from "drizzle-orm";

// GET - Obtener grupos
export async function GET(request: NextRequest) {
  const denied = await authorizeApi(request);
  if (denied) return denied;
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const groupId = searchParams.get("id");

    if (groupId) {
      // Obtener grupo específico con miembros y posts
      const groupData = await db
        .select()
        .from(groups)
        .where(eq(groups.id, parseInt(groupId)))
        .limit(1);

      if (groupData.length === 0) {
        return NextResponse.json(
          { error: "Grupo no encontrado" },
          { status: 404 }
        );
      }

      const members = await db
        .select({
          id: groupMembers.id,
          graduateId: graduates.id,
          graduateName: graduates.name,
          graduatePhoto: graduates.photoUrl,
          graduateProfession: graduates.currentProfession,
          role: groupMembers.role,
          joinedAt: groupMembers.joinedAt,
        })
        .from(groupMembers)
        .leftJoin(graduates, eq(groupMembers.graduateId, graduates.id))
        .where(eq(groupMembers.groupId, parseInt(groupId)))
        .orderBy(groupMembers.joinedAt);

      const posts = await db
        .select({
          id: groupPosts.id,
          content: groupPosts.content,
          createdAt: groupPosts.createdAt,
          graduateId: graduates.id,
          graduateName: graduates.name,
          graduatePhoto: graduates.photoUrl,
          graduateProfession: graduates.currentProfession,
        })
        .from(groupPosts)
        .leftJoin(graduates, eq(groupPosts.graduateId, graduates.id))
        .where(eq(groupPosts.groupId, parseInt(groupId)))
        .orderBy(desc(groupPosts.createdAt))
        .limit(20);

      return NextResponse.json({
        ...groupData[0],
        members,
        memberCount: members.length,
        posts,
      });
    }

    // Lista de grupos
    let groupsList;
    
    if (type) {
      groupsList = await db
        .select({
          id: groups.id,
          name: groups.name,
          description: groups.description,
          type: groups.type,
          category: groups.category,
          createdAt: groups.createdAt,
          creatorId: groups.creatorId,
          creatorName: graduates.name,
        })
        .from(groups)
        .leftJoin(graduates, eq(groups.creatorId, graduates.id))
        .where(eq(groups.type, type as any))
        .orderBy(desc(groups.createdAt));
    } else {
      groupsList = await db
        .select({
          id: groups.id,
          name: groups.name,
          description: groups.description,
          type: groups.type,
          category: groups.category,
          createdAt: groups.createdAt,
          creatorId: groups.creatorId,
          creatorName: graduates.name,
        })
        .from(groups)
        .leftJoin(graduates, eq(groups.creatorId, graduates.id))
        .orderBy(desc(groups.createdAt));
    }

    // Agregar contador de miembros
    const groupsWithCount = await Promise.all(
      groupsList.map(async (group) => {
        const count = await db
          .select({ count: sql<number>`count(*)` })
          .from(groupMembers)
          .where(eq(groupMembers.groupId, group.id));

        return {
          ...group,
          memberCount: count[0]?.count || 0,
        };
      })
    );

    return NextResponse.json(groupsWithCount);
  } catch (error) {
    console.error("Error fetching groups:", error);
    return NextResponse.json(
      { error: "Error al obtener grupos" },
      { status: 500 }
    );
  }
}

// POST - Crear grupo
export async function POST(request: NextRequest) {
  const denied = await authorizeApi(request);
  if (denied) return denied;
  try {
    const session = await getSession();

    console.log("Session:", session);

    if (!session) {
      return NextResponse.json(
        { error: "Debes iniciar sesión" },
        { status: 401 }
      );
    }

    const body = await request.json();
    console.log("Request body:", body);
    const { name, description, type, category } = body;

    if (!name || !description || !type) {
      return NextResponse.json(
        { error: "Nombre, descripción y tipo son requeridos" },
        { status: 400 }
      );
    }

    // Obtener graduateId del usuario
    const userGraduate = await db
      .select({ graduateId: graduates.id })
      .from(graduates)
      .where(eq(graduates.userId, session.id))
      .limit(1);

    console.log("User graduate:", userGraduate);

    if (!userGraduate || userGraduate.length === 0) {
      return NextResponse.json(
        { error: "No tienes perfil registrado. Completa tu perfil primero." },
        { status: 400 }
      );
    }

    const graduateId = userGraduate[0].graduateId;

    // Crear grupo
    const newGroup = await db
      .insert(groups)
      .values({
        name,
        description,
        type,
        category: category || null,
        creatorId: graduateId,
      })
      .returning();

    // Agregar creador como admin
    await db.insert(groupMembers).values({
      groupId: newGroup[0].id,
      graduateId,
      role: "admin",
    });

    return NextResponse.json(newGroup[0], { status: 201 });
  } catch (error) {
    console.error("Error creating group:", error);
    return NextResponse.json(
      { error: "Error al crear grupo" },
      { status: 500 }
    );
  }
}

// PUT - Unirse/Salir de grupo
export async function PUT(request: NextRequest) {
  const denied = await authorizeApi(request);
  if (denied) return denied;
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: "Debes iniciar sesión" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { groupId, action } = body;

    if (!groupId || !["join", "leave"].includes(action)) {
      return NextResponse.json(
        { error: "Datos inválidos" },
        { status: 400 }
      );
    }

    // Obtener graduateId del usuario
    const userGraduate = await db
      .select({ graduateId: graduates.id })
      .from(graduates)
      .where(eq(graduates.userId, session.id))
      .limit(1);

    if (!userGraduate || userGraduate.length === 0) {
      return NextResponse.json(
        { error: "No tienes perfil de miembro" },
        { status: 400 }
      );
    }

    const graduateId = userGraduate[0].graduateId;

    if (action === "join") {
      // Verificar si ya es miembro
      const existing = await db
        .select()
        .from(groupMembers)
        .where(
          and(
            eq(groupMembers.groupId, parseInt(groupId)),
            eq(groupMembers.graduateId, graduateId)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        return NextResponse.json(
          { error: "Ya eres miembro de este grupo" },
          { status: 400 }
        );
      }

      await db.insert(groupMembers).values({
        groupId: parseInt(groupId),
        graduateId,
        role: "member",
      });

      return NextResponse.json({ success: true, action: "joined" });
    } else {
      // Salir del grupo
      await db
        .delete(groupMembers)
        .where(
          and(
            eq(groupMembers.groupId, parseInt(groupId)),
            eq(groupMembers.graduateId, graduateId)
          )
        );

      return NextResponse.json({ success: true, action: "left" });
    }
  } catch (error) {
    console.error("Error joining/leaving group:", error);
    return NextResponse.json(
      { error: "Error al procesar solicitud" },
      { status: 500 }
    );
  }
}

// PATCH - Editar grupo (solo creador)
export async function PATCH(request: NextRequest) {
  const denied = await authorizeApi(request);
  if (denied) return denied;
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: "Debes iniciar sesión" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { id, name, description, category } = body;

    if (!id) {
      return NextResponse.json(
        { error: "ID del grupo requerido" },
        { status: 400 }
      );
    }

    // Obtener graduateId
    const userGraduate = await db
      .select({ graduateId: graduates.id })
      .from(graduates)
      .where(eq(graduates.userId, session.id))
      .limit(1);

    if (!userGraduate || userGraduate.length === 0) {
      return NextResponse.json(
        { error: "No tienes perfil de miembro" },
        { status: 400 }
      );
    }

    const graduateId = userGraduate[0].graduateId;

    // Verificar que es el creador
    const group = await db
      .select()
      .from(groups)
      .where(eq(groups.id, parseInt(id)))
      .limit(1);

    if (group.length === 0) {
      return NextResponse.json(
        { error: "Grupo no encontrado" },
        { status: 404 }
      );
    }

    if (group[0].creatorId !== graduateId) {
      return NextResponse.json(
        { error: "Solo el creador puede editar el grupo" },
        { status: 403 }
      );
    }

    // Actualizar
    const updateData: any = {};
    if (name) updateData.name = name;
    if (description) updateData.description = description;
    if (category !== undefined) updateData.category = category;

    await db
      .update(groups)
      .set(updateData)
      .where(eq(groups.id, parseInt(id)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error editing group:", error);
    return NextResponse.json(
      { error: "Error al editar grupo" },
      { status: 500 }
    );
  }
}
