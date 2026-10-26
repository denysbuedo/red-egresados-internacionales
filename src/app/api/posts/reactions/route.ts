import { authorizeApi } from "@/lib/api-access";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { postReactions, adminPosts } from "@/db/schema";
import { getSession } from "@/lib/session";
import { eq, sql, and } from "drizzle-orm";

// GET - Obtener reacciones de un post
export async function GET(request: NextRequest) {
  const denied = await authorizeApi(request);
  if (denied) return denied;
  try {
    const session = await getSession();
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get("postId");

    if (!postId) {
      return NextResponse.json(
        { error: "Post ID requerido" },
        { status: 400 }
      );
    }

    const postIdNum = parseInt(postId);

    // Obtener conteo de reacciones por tipo
    const reactions = await db
      .select({
        reactionType: postReactions.reactionType,
        count: sql<number>`count(*)`,
      })
      .from(postReactions)
      .where(eq(postReactions.postId, postIdNum))
      .groupBy(postReactions.reactionType);

    // Obtener reacción del usuario actual si existe
    let userReaction = null;
    if (session) {
      const userReactionResult = await db
        .select()
        .from(postReactions)
        .where(
          and(
            eq(postReactions.postId, postIdNum),
            eq(postReactions.userId, session.id)
          )
        )
        .limit(1);
      userReaction = userReactionResult[0]?.reactionType || null;
    }

    // Formatear resultado
    const result: {
      like: number;
      love: number;
      celebrate: number;
      insightful: number;
      userReaction: string | null;
    } = {
      like: 0,
      love: 0,
      celebrate: 0,
      insightful: 0,
      userReaction,
    };

    reactions.forEach((r) => {
      const type = r.reactionType;
      if (type === "like" || type === "love" || type === "celebrate" || type === "insightful") {
        result[type] = r.count;
      }
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching reactions:", error);
    return NextResponse.json(
      { error: "Error al obtener reacciones" },
      { status: 500 }
    );
  }
}

// POST - Agregar/actualizar reacción
export async function POST(request: NextRequest) {
  const denied = await authorizeApi(request);
  if (denied) return denied;
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: "Debes iniciar sesión para reaccionar" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { postId, reactionType } = body;

    if (!postId || !reactionType) {
      return NextResponse.json(
        { error: "Post ID y tipo de reacción requeridos" },
        { status: 400 }
      );
    }

    const validReactions = ["like", "love", "celebrate", "insightful"];
    if (!validReactions.includes(reactionType)) {
      return NextResponse.json(
        { error: "Tipo de reacción inválido" },
        { status: 400 }
      );
    }

    // Verificar que el post existe
    const postExists = await db
      .select({ id: adminPosts.id })
      .from(adminPosts)
      .where(eq(adminPosts.id, parseInt(postId)))
      .limit(1);

    if (postExists.length === 0) {
      return NextResponse.json(
        { error: "Post no encontrado" },
        { status: 404 }
      );
    }

    const postIdNum = parseInt(postId);

    // Verificar si ya tiene reacción
    const existingReaction = await db
      .select()
      .from(postReactions)
      .where(
        and(
          eq(postReactions.postId, postIdNum),
          eq(postReactions.userId, session.id)
        )
      )
      .limit(1);

    if (existingReaction.length > 0) {
      // Si tiene la misma reacción, la quitamos (toggle)
      if (existingReaction[0].reactionType === reactionType) {
        await db
          .delete(postReactions)
          .where(
            and(
              eq(postReactions.postId, postIdNum),
              eq(postReactions.userId, session.id)
            )
          );

        return NextResponse.json({
          success: true,
          action: "removed",
          reactionType: null,
        });
      }

      // Si es diferente, actualizamos
      await db
        .update(postReactions)
        .set({ reactionType })
        .where(
          and(
            eq(postReactions.postId, postIdNum),
            eq(postReactions.userId, session.id)
          )
        );

      return NextResponse.json({
        success: true,
        action: "updated",
        reactionType,
      });
    }

    // Nueva reacción
    await db.insert(postReactions).values({
      postId: parseInt(postId),
      userId: session.id,
      reactionType,
    });

    return NextResponse.json({
      success: true,
      action: "created",
      reactionType,
    });
  } catch (error) {
    console.error("Error adding reaction:", error);
    return NextResponse.json(
      { error: "Error al agregar reacción" },
      { status: 500 }
    );
  }
}
