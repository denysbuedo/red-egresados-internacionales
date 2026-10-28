import { notifyMentions } from "@/lib/notification-suite";
import { authorizeApi } from "@/lib/api-access";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { groupPosts, groupMembers, graduates, users } from "@/db/schema";
import { getSession } from "@/lib/session";
import { eq, and, desc } from "drizzle-orm";

// GET - Obtener posts de un grupo
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  const denied = await authorizeApi(request);
  if (denied) return denied;
  try {
    const { groupId } = await params;

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
      .limit(50);

    return NextResponse.json(posts);
  } catch (error) {
    console.error("Error fetching group posts:", error);
    return NextResponse.json(
      { error: "Error al obtener posts" },
      { status: 500 }
    );
  }
}

// POST - Crear post en grupo
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  const denied = await authorizeApi(request);
  if (denied) return denied;
  try {
    const session = await getSession();
    const { groupId } = await params;

    if (!session) {
      return NextResponse.json(
        { error: "Debes iniciar sesión" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { content } = body;

    if (!content || content.trim().length < 5) {
      return NextResponse.json(
        { error: "El contenido debe tener al menos 5 caracteres" },
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

    // Verificar que es miembro
    const membership = await db
      .select()
      .from(groupMembers)
      .where(
        and(
          eq(groupMembers.groupId, parseInt(groupId)),
          eq(groupMembers.graduateId, graduateId)
        )
      )
      .limit(1);

    if (membership.length === 0) {
      return NextResponse.json(
        { error: "Debes ser miembro del grupo para publicar" },
        { status: 403 }
      );
    }

    const newPost = db.transaction(tx=>{const created=tx
      .insert(groupPosts)
      .values({
        groupId: parseInt(groupId),
        graduateId,
        content: content.trim(),
      })
      .returning().get();
      notifyMentions(content.trim(),session.id,"/comunidades/"+groupId,"group-post:"+created.id,Number(groupId));return [created];
    });

    return NextResponse.json(newPost[0], { status: 201 });
  } catch (error) {
    console.error("Error creating group post:", error);
    return NextResponse.json(
      { error: "Error al crear post" },
      { status: 500 }
    );
  }
}
