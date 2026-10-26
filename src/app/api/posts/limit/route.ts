import { authorizeApi } from "@/lib/api-access";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { userPosts, graduates } from "@/db/schema";
import { getSession } from "@/lib/session";
import { eq, gte, sql, and } from "drizzle-orm";

const DAILY_POST_LIMIT = 3;

export async function GET(request: Request) {
  const denied = await authorizeApi(request);
  if (denied) return denied;
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: "No autorizado" },
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
      return NextResponse.json({
        canPost: false,
        postsToday: 0,
        dailyLimit: DAILY_POST_LIMIT,
        remaining: 0,
        reason: "No profile",
      });
    }

    const graduateId = userGraduate[0].graduateId;

    // Contar posts de hoy
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

    const count = postsToday[0]?.count || 0;
    const remaining = Math.max(0, DAILY_POST_LIMIT - count);

    return NextResponse.json({
      canPost: remaining > 0,
      postsToday: count,
      dailyLimit: DAILY_POST_LIMIT,
      remaining: remaining,
    });
  } catch (error) {
    console.error("Error checking post limit:", error);
    return NextResponse.json(
      { error: "Error al verificar límite" },
      { status: 500 }
    );
  }
}
