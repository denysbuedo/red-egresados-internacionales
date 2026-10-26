import { authorizeApi } from "@/lib/api-access";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { postComments, userPosts, graduates, users } from "@/db/schema";
import { getSession } from "@/lib/session";
import { eq, and, gte, desc, sql } from "drizzle-orm";
import { createNotification } from "@/lib/notifications";

const DAILY_COMMENT_LIMIT = 10;

// GET - Obtener comentarios de un post
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  const denied = await authorizeApi(request);
  if (denied) return denied;
  try {
    const { postId } = await params;

    const comments = await db
      .select({
        id: postComments.id,
        content: postComments.content,
        createdAt: postComments.createdAt,
        graduateId: graduates.id,
        graduateName: graduates.name,
        graduatePhoto: graduates.photoUrl,
        graduateProfession: graduates.currentProfession,
      })
      .from(postComments)
      .leftJoin(graduates, eq(postComments.graduateId, graduates.id))
      .where(eq(postComments.postId, parseInt(postId)))
      .orderBy(desc(postComments.createdAt));

    return NextResponse.json(comments);
  } catch (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json(
      { error: "Error al obtener comentarios" },
      { status: 500 }
    );
  }
}

// POST - Crear comentario (con límite diario)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  const denied = await authorizeApi(request);
  if (denied) return denied;
  try {
    const session = await getSession();
    const { postId } = await params;

    if (!session) {
      return NextResponse.json(
        { error: "Debes iniciar sesión" },
        { status: 401 }
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
        { error: "No tienes un perfil de egresado registrado" },
        { status: 400 }
      );
    }

    const graduateId = userGraduate[0].graduateId;
    const body = await request.json();
    const { content } = body;

    // Validaciones
    if (!content || content.trim().length < 2) {
      return NextResponse.json(
        { error: "El comentario debe tener al menos 2 caracteres" },
        { status: 400 }
      );
    }

    if (content.length > 500) {
      return NextResponse.json(
        { error: "El comentario no puede exceder los 500 caracteres" },
        { status: 400 }
      );
    }

    // VERIFICAR LÍMITE DIARIO
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const commentsToday = await db
      .select({ count: sql<number>`count(*)` })
      .from(postComments)
      .where(
        and(
          eq(postComments.graduateId, graduateId),
          gte(postComments.createdAt, startOfDay)
        )
      );

    const commentsCount = commentsToday[0]?.count || 0;

    if (commentsCount >= DAILY_COMMENT_LIMIT) {
      return NextResponse.json(
        { 
          error: `Has alcanzado el límite de ${DAILY_COMMENT_LIMIT} comentarios diarios.`,
        },
        { status: 429 }
      );
    }

    // Verificar que el post existe
    const postExists = await db
      .select({ id: userPosts.id })
      .from(userPosts)
      .where(eq(userPosts.id, parseInt(postId)))
      .limit(1);

    if (postExists.length === 0) {
      return NextResponse.json(
        { error: "Post no encontrado" },
        { status: 404 }
      );
    }

    // Crear el comentario
    const newComment = await db
      .insert(postComments)
      .values({
        postId: parseInt(postId),
        graduateId,
        content: content.trim(),
      })
      .returning();

    // Actualizar contador de comentarios
    await db
      .update(userPosts)
      .set({ commentsCount: sql`comments_count + 1` })
      .where(eq(userPosts.id, parseInt(postId)));

    // Crear notificación para el autor del post
    const post = await db
      .select({
        graduateId: userPosts.graduateId,
        content: userPosts.content,
      })
      .from(userPosts)
      .where(eq(userPosts.id, parseInt(postId)))
      .limit(1);

    if (post.length > 0 && post[0].graduateId !== graduateId) {
      const postAuthor = await db
        .select({ userId: graduates.userId })
        .from(graduates)
        .where(eq(graduates.id, post[0].graduateId))
        .limit(1);

      if (postAuthor.length > 0 && postAuthor[0].userId) {
        await createNotification(
          postAuthor[0].userId,
          "post_commented",
          `${session.username} comentó tu publicación`,
          `/egresados/${graduateId}`
        );
      }
    }

    return NextResponse.json({
      ...newComment[0],
      graduateName: session.username,
      graduatePhoto: null,
      graduateProfession: "",
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating comment:", error);
    return NextResponse.json(
      { error: "Error al crear comentario" },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar comentario (solo el autor)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  const denied = await authorizeApi(request);
  if (denied) return denied;
  try {
    const session = await getSession();
    const { postId } = await params;
    const { searchParams } = new URL(request.url);
    const commentId = searchParams.get("commentId");

    if (!session || !commentId) {
      return NextResponse.json(
        { error: "Datos requeridos" },
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
        { error: "Perfil no encontrado" },
        { status: 400 }
      );
    }

    const graduateId = userGraduate[0].graduateId;

    // Verificar que el comentario pertenece al usuario
    const comment = await db
      .select()
      .from(postComments)
      .where(
        and(
          eq(postComments.id, parseInt(commentId)),
          eq(postComments.postId, parseInt(postId)),
          eq(postComments.graduateId, graduateId)
        )
      )
      .limit(1);

    if (comment.length === 0) {
      return NextResponse.json(
        { error: "Comentario no encontrado o no tienes permiso" },
        { status: 404 }
      );
    }

    await db
      .delete(postComments)
      .where(eq(postComments.id, parseInt(commentId)));

    // Actualizar contador
    await db
      .update(userPosts)
      .set({ commentsCount: sql`MAX(0, comments_count - 1)` })
      .where(eq(userPosts.id, parseInt(postId)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting comment:", error);
    return NextResponse.json(
      { error: "Error al eliminar comentario" },
      { status: 500 }
    );
  }
}
