import { authorizeApi } from "@/lib/api-access";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { userPosts, graduates, users } from "@/db/schema";
import { getSession } from "@/lib/session";
import { eq, and } from "drizzle-orm";

// POST - Like/Unlike un post
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

    // Toggle like count
    const currentPost = await db
      .select({ likes: userPosts.likes })
      .from(userPosts)
      .where(eq(userPosts.id, parseInt(postId)))
      .limit(1);

    if (currentPost.length === 0) {
      return NextResponse.json(
        { error: "Post no encontrado" },
        { status: 404 }
      );
    }

    // Simple increment for now
    await db
      .update(userPosts)
      .set({ likes: (currentPost[0].likes || 0) + 1 })
      .where(eq(userPosts.id, parseInt(postId)));

    return NextResponse.json({ 
      success: true, 
      likes: (currentPost[0].likes || 0) + 1 
    });
  } catch (error) {
    console.error("Error liking post:", error);
    return NextResponse.json(
      { error: "Error al dar like" },
      { status: 500 }
    );
  }
}
