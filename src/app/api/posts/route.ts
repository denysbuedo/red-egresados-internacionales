import { validImageUrl } from "@/lib/media";
import { POST_TYPES, type PostType } from "@/lib/site";
import { notifyMentions } from "@/lib/notification-suite";
import { authorizeApi } from "@/lib/api-access";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { userPosts, graduates } from "@/db/schema";
import { getSession } from "@/lib/session";
import { eq, sql, and, gte, desc } from "drizzle-orm";

// Límite de posts por día
const DAILY_POST_LIMIT = 3;

// GET - Obtener feed de posts
export async function GET(request: NextRequest) {
  const denied = await authorizeApi(request);
  if (denied) return denied;
  try {
    const { searchParams } = new URL(request.url);
    const graduateId = searchParams.get("graduateId");
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20") || 20));
    const offset = Math.max(0, parseInt(searchParams.get("offset") || "0") || 0);
    const postType = searchParams.get("type");
    const conditions = [sql`EXISTS (SELECT 1 FROM users WHERE users.id = ${graduates.userId} AND users.status = 'approved')`];
    if (postType) {
      if (!POST_TYPES.some((type) => type.value === postType)) return NextResponse.json({ error: "Tipo de aporte inválido" }, { status: 400 });
      conditions.push(eq(userPosts.postType, postType as PostType));
    }

    let query;

    if (graduateId) {
      // Posts de un usuario específico
      query = db
        .select({
          id: userPosts.id,
          content: userPosts.content,
          imageUrl: userPosts.imageUrl,
          postType: userPosts.postType,
          referenceUrl: userPosts.referenceUrl,
          likes: userPosts.likes,
          commentsCount: userPosts.commentsCount,
          createdAt: userPosts.createdAt,
          graduateId: graduates.id,
          graduateName: graduates.name,
          graduatePhoto: graduates.photoUrl,
          graduateProfession: graduates.currentProfession,
          graduateCountry: graduates.country,
        })
        .from(userPosts)
        .leftJoin(graduates, eq(userPosts.graduateId, graduates.id))
        .where(and(...conditions, eq(userPosts.graduateId, parseInt(graduateId))))
        .orderBy(desc(userPosts.createdAt))
        .limit(limit)
        .offset(offset);
    } else {
      // Feed general (todos los posts)
      query = db
        .select({
          id: userPosts.id,
          content: userPosts.content,
          imageUrl: userPosts.imageUrl,
          postType: userPosts.postType,
          referenceUrl: userPosts.referenceUrl,
          likes: userPosts.likes,
          commentsCount: userPosts.commentsCount,
          createdAt: userPosts.createdAt,
          graduateId: graduates.id,
          graduateName: graduates.name,
          graduatePhoto: graduates.photoUrl,
          graduateProfession: graduates.currentProfession,
          graduateCountry: graduates.country,
        })
        .from(userPosts)
        .leftJoin(graduates, eq(userPosts.graduateId, graduates.id))
        .where(and(...conditions))
        .orderBy(desc(userPosts.createdAt))
        .limit(limit)
        .offset(offset);
    }

    const posts = await query;
    return NextResponse.json(posts);
  } catch (error) {
    console.error("Error fetching posts:", error);
    return NextResponse.json(
      { error: "Error al obtener posts" },
      { status: 500 }
    );
  }
}

// POST - Crear nuevo post (con límite diario)
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

    // Obtener graduateId del usuario
    const userGraduate = await db
      .select({ graduateId: graduates.id })
      .from(graduates)
      .where(eq(graduates.userId, session.id))
      .limit(1);

    if (!userGraduate || userGraduate.length === 0) {
      return NextResponse.json(
        { error: "No tienes un perfil registrado" },
        { status: 400 }
      );
    }

    const graduateId = userGraduate[0].graduateId;
    const body = await request.json();
    const { content, imageUrl } = body;
    const postType = body.postType || "update";
    if (!POST_TYPES.some((type) => type.value === postType)) return NextResponse.json({ error: "Tipo de aporte inválido" }, { status: 400 });
    let referenceUrl: string | null = null;
    if (body.referenceUrl) {
      try {
        if (typeof body.referenceUrl !== "string" || body.referenceUrl.length > 2000) throw new Error("url");
        const url = new URL(body.referenceUrl);
        if (!["http:", "https:"].includes(url.protocol)) throw new Error("url");
        referenceUrl = url.toString();
      } catch { return NextResponse.json({ error: "El enlace debe usar http o https" }, { status: 400 }); }
    }

    if (imageUrl && !validImageUrl(imageUrl)) return NextResponse.json({ error: "Usa una imagen subida a CONECTA o un enlace http/https válido." }, { status: 400 });

    // Validaciones
    if (typeof content !== "string" || content.trim().length < 5) {
      return NextResponse.json(
        { error: "El contenido debe tener al menos 5 caracteres" },
        { status: 400 }
      );
    }

    if (content.length > 2000) {
      return NextResponse.json(
        { error: "El contenido no puede exceder los 2000 caracteres" },
        { status: 400 }
      );
    }

    // VERIFICAR LÍMITE DIARIO
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const postsToday = await db
      .select({ count: sql<number>`count(*)` })
      .from(userPosts)
      .where(
        and(
          eq(userPosts.graduateId, graduateId),
          gte(userPosts.createdAt, startOfDay)
        )
      );

    const postsCount = postsToday[0]?.count || 0;

    if (postsCount >= DAILY_POST_LIMIT) {
      const remainingTime = 24 * 60 * 60 * 1000 - (Date.now() - startOfDay.getTime());
      const hours = Math.floor(remainingTime / (1000 * 60 * 60));
      
      return NextResponse.json(
        { 
          error: `Has alcanzado el límite de ${DAILY_POST_LIMIT} publicaciones diarias.`,
          remainingTime: hours,
        },
        { status: 429 }
      );
    }

    // Crear el post
    const newPost = db.transaction(tx=>{
     const created=tx
      .insert(userPosts)
      .values({
        graduateId,
        content: content.trim(),
        postType: postType as PostType,
        referenceUrl,
        imageUrl: imageUrl || null,
        likes: 0,
        commentsCount: 0,
      })
      .returning().get();
      notifyMentions(content.trim(),session.id,"/?post="+created.id,"post:"+created.id);return [created];
    });

    return NextResponse.json({
      ...newPost[0],
      graduateName: session.username,
      graduatePhoto: null,
      graduateProfession: "",
      graduateCountry: "",
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating post:", error);
    return NextResponse.json(
      { error: "Error al crear publicación" },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar post (solo el autor)
export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const postId = searchParams.get("id");

    if (!postId) {
      return NextResponse.json(
        { error: "ID de post requerido" },
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

    // Verificar que el post pertenece al usuario
    const post = await db
      .select()
      .from(userPosts)
      .where(
        and(
          eq(userPosts.id, parseInt(postId)),
          eq(userPosts.graduateId, graduateId)
        )
      )
      .limit(1);

    if (post.length === 0) {
      return NextResponse.json(
        { error: "Post no encontrado o no tienes permiso" },
        { status: 404 }
      );
    }

    await db
      .delete(userPosts)
      .where(eq(userPosts.id, parseInt(postId)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting post:", error);
    return NextResponse.json(
      { error: "Error al eliminar publicación" },
      { status: 500 }
    );
  }
}
