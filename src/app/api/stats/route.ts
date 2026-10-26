import { authorizeApi } from "@/lib/api-access";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { graduates, connections, posts } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export async function GET(request: Request) {
  const denied = await authorizeApi(request);
  if (denied) return denied;
  try {
    const totalGraduates = await db
      .select({ count: sql<number>`count(*)` })
      .from(graduates);

    const totalConnections = await db
      .select({ count: sql<number>`count(*)` })
      .from(connections)
      .where(eq(connections.status, "accepted"));

    const totalPosts = await db
      .select({ count: sql<number>`count(*)` })
      .from(posts);

    const countriesResult = await db
      .select({
        country: graduates.country,
        count: sql<number>`count(*)`,
      })
      .from(graduates)
      .groupBy(graduates.country)
      .orderBy(sql`count(*) DESC`);

    const universitiesResult = await db
      .select({
        university: graduates.university,
        count: sql<number>`count(*)`,
      })
      .from(graduates)
      .groupBy(graduates.university)
      .orderBy(sql`count(*) DESC`);

    const recentGraduates = await db
      .select()
      .from(graduates)
      .orderBy(graduates.createdAt)
      .limit(5);

    return NextResponse.json({
      totalGraduates: totalGraduates[0]?.count || 0,
      totalConnections: totalConnections[0]?.count || 0,
      totalPosts: totalPosts[0]?.count || 0,
      countries: countriesResult,
      universities: universitiesResult,
      recentGraduates,
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json(
      { error: "Error al obtener estadísticas" },
      { status: 500 }
    );
  }
}
