import { validImageUrl } from "@/lib/media";
import { authorizeApi } from "@/lib/api-access";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { adminPosts } from "@/db/schema";
import { getSession } from "@/lib/session";
import { desc, eq } from "drizzle-orm";

// GET - Obtener todos los posts (público)
export async function GET(request: Request) {
  const denied = await authorizeApi(request);
  if (denied) return denied;
  try {
    const posts = await db
      .select({
        id: adminPosts.id,
        title: adminPosts.title,
        content: adminPosts.content,
        imageUrl: adminPosts.imageUrl,
        authorName: adminPosts.authorName,
        createdAt: adminPosts.createdAt,
      })
      .from(adminPosts)
      .orderBy(desc(adminPosts.createdAt));

    return NextResponse.json(posts);
  } catch (error) {
    console.error("Error fetching admin posts:", error);
    return NextResponse.json(
      { error: "Error al obtener las noticias" },
      { status: 500 }
    );
  }
}

// POST - Crear nuevo post (solo admin)
export async function POST(request: NextRequest) {
  const denied = await authorizeApi(request, ["admin", "editor"]);
  if (denied) return denied;
  try {
    // Verificar autenticación y rol de admin
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: "Debes iniciar sesión" },
        { status: 401 }
      );
    }

    if (!["admin", "editor"].includes(session.role)) {
      return NextResponse.json(
        { error: "No tienes permisos para realizar esta acción" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, content, imageUrl, pinDays } = body;

    if (imageUrl && !validImageUrl(imageUrl)) return NextResponse.json({ error: "Usa una imagen subida a CONECTA o un enlace http/https válido." }, { status: 400 });

    // Validaciones
    if (!title || !content) {
      return NextResponse.json(
        { error: "El título y el contenido son requeridos" },
        { status: 400 }
      );
    }

    if (title.length < 5) {
      return NextResponse.json(
        { error: "El título debe tener al menos 5 caracteres" },
        { status: 400 }
      );
    }

    if (content.length < 20) {
      return NextResponse.json(
        { error: "El contenido debe tener al menos 20 caracteres" },
        { status: 400 }
      );
    }

    // Calcular pinnedUntil si se especificaron días
    const pinDaysNum = parseInt(pinDays);
    let pinnedUntil = null;
    if (!isNaN(pinDaysNum) && [1, 3, 7].includes(pinDaysNum)) {
      pinnedUntil = Math.floor(Date.now() / 1000) + (pinDaysNum * 24 * 60 * 60);
    }

    // Crear el post
    const newPost = await db
      .insert(adminPosts)
      .values({
        title,
        content,
        imageUrl: imageUrl || null,
        authorName: session.username,
        authorId: session.id,
        pinnedUntil,
      })
      .returning();

    return NextResponse.json(newPost[0], { status: 201 });
  } catch (error) {
    console.error("Error creating admin post:", error);
    return NextResponse.json(
      { error: "Error al crear la noticia" },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar post (solo admin)
export async function DELETE(request: NextRequest) {
  const denied = await authorizeApi(request, ["admin", "editor"]);
  if (denied) return denied;
  try {
    // Verificar autenticación y rol de admin
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: "Debes iniciar sesión" },
        { status: 401 }
      );
    }

    if (!["admin", "editor"].includes(session.role)) {
      return NextResponse.json(
        { error: "No tienes permisos para realizar esta acción" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "ID de post requerido" },
        { status: 400 }
      );
    }

    await db
      .delete(adminPosts)
      .where(eq(adminPosts.id, parseInt(id)));

    return NextResponse.json({ message: "Post eliminado correctamente" });
  } catch (error) {
    console.error("Error deleting admin post:", error);
    return NextResponse.json(
      { error: "Error al eliminar la noticia" },
      { status: 500 }
    );
  }
}
