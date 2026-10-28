import { authorizeApi } from "@/lib/api-access";
import { NextRequest, NextResponse } from "next/server";
import { db, sqlite } from "@/db";
import { groups, groupMembers, groupPosts, graduates, users } from "@/db/schema";
import { getSession } from "@/lib/session";
import { eq, and, desc, sql } from "drizzle-orm";

// GET - Obtener grupos
export async function GET(request: NextRequest) {
  const denied = await authorizeApi(request);
  if (denied) return denied;
  try {
    const session = (await getSession())!;
    const own = db.select({ id: graduates.id }).from(graduates).where(eq(graduates.userId, session.id)).get();
    const memberships = own ? db.select().from(groupMembers).where(eq(groupMembers.graduateId, own.id)).all() : [];
    const membershipFor = (id: number) => memberships.find(item => item.groupId === id);
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
        isMember: !!membershipFor(groupData[0].id),
        canEdit: session.role === "admin" || groupData[0].creatorId === own?.id,
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
          isMember: !!membershipFor(group.id),
          canEdit: session.role === "admin" || group.creatorId === own?.id,
          memberCount: count[0]?.count || 0,
        };
      })
    );

    return NextResponse.json(groupsWithCount, { headers: { "Cache-Control": "private, no-store" } });
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


    if (!session) {
      return NextResponse.json(
        { error: "Debes iniciar sesión" },
        { status: 401 }
      );
    }

    const body = await request.json();
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

// Membership changes are idempotent and atomic, including retries.
export async function PUT(request: NextRequest) {
  const denied=await authorizeApi(request);if(denied)return denied;
  const session=(await getSession())!;
  let body;try{body=await request.json();}catch{return NextResponse.json({error:"Datos inválidos"},{status:400});}
  const id=Number(body?.groupId),action=body?.action;
  if(!Number.isSafeInteger(id)||id<1||!["join","leave"].includes(action))return NextResponse.json({error:"Datos inválidos"},{status:400});
  const own=db.select({id:graduates.id}).from(graduates).where(eq(graduates.userId,session.id)).get();
  if(!own)return NextResponse.json({error:"Completa tu perfil antes de unirte"},{status:400});
  const result=sqlite.transaction(()=>{
    const group=sqlite.prepare('SELECT creator_id FROM groups WHERE id=?').get(id) as {creator_id:number}|undefined;
    if(!group)return {error:"Comunidad no encontrada",status:404};
    if(action==="leave" && group.creator_id===own.id)return {error:"El creador debe permanecer en la comunidad",status:409};
    if(action==="join")sqlite.prepare("INSERT INTO group_members (group_id,graduate_id,role,joined_at) SELECT ?,?,'member',? WHERE NOT EXISTS (SELECT 1 FROM group_members WHERE group_id=? AND graduate_id=?)").run(id,own.id,Math.floor(Date.now()/1000),id,own.id);
    else sqlite.prepare('DELETE FROM group_members WHERE group_id=? AND graduate_id=?').run(id,own.id);
    if(action==='join')sqlite.prepare("UPDATE community_invitations SET status='accepted' WHERE group_id=? AND user_id=? AND status='pending'").run(id,session.id);
    return {success:true,action:action==="join"?"joined":"left",isMember:action==="join"};
  }).immediate();
  return NextResponse.json(result,{status:'status' in result?result.status:200,headers:{"Cache-Control":"private, no-store"}});
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

    if (session.role !== "admin" && (!userGraduate || userGraduate.length === 0)) {
      return NextResponse.json(
        { error: "No tienes perfil de miembro" },
        { status: 400 }
      );
    }

    const graduateId = userGraduate[0]?.graduateId;

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

    if (session.role !== "admin" && group[0].creatorId !== graduateId) {
      return NextResponse.json(
        { error: "Solo el creador o la administración pueden editar la comunidad" },
        { status: 403 }
      );
    }

    // Actualizar
    const updateData: any = {};
    if (name !== undefined && (typeof name !== "string" || name.trim().length < 3 || name.length > 150)) return NextResponse.json({error:"Nombre inválido (3–150 caracteres)"},{status:400});
    if (description !== undefined && (typeof description !== "string" || description.trim().length < 10 || description.length > 5000)) return NextResponse.json({error:"Descripción inválida (10–5000 caracteres)"},{status:400});
    if (category !== undefined && category !== null && (typeof category !== "string" || category.length > 200)) return NextResponse.json({error:"Categoría inválida"},{status:400});
    if (name) updateData.name = name.trim();
    if (description) updateData.description = description.trim();
    if (category !== undefined) updateData.category = category?.trim() || null;
    if (body.type !== undefined) {
      if (!["university","career","country","interest"].includes(body.type)) return NextResponse.json({error:"Tipo inválido"},{status:400});
      updateData.type = body.type;
    }
    if (!Object.keys(updateData).length) return NextResponse.json({error:"No hay cambios"},{status:400});

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
