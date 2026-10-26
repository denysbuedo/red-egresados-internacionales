import { authorizeApi } from "@/lib/api-access";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { emailLists, graduates } from "@/db/schema";
import { eq, and, gte, lte, isNotNull } from "drizzle-orm";

export async function GET(request: Request) {
  const denied = await authorizeApi(request, ["admin"]);
  if (denied) return denied;
  try {
    const lists = await db.select().from(emailLists).orderBy(emailLists.createdAt);
    return NextResponse.json(lists);
  } catch (error) {
    console.error("Error fetching email lists:", error);
    return NextResponse.json(
      { error: "Error al obtener listas de correo" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const denied = await authorizeApi(request, ["admin"]);
  if (denied) return denied;
  try {
    const body = await request.json();

    if (body.action === "preview") {
      const conditions = [isNotNull(graduates.email)];

      if (body.filterUniversity) {
        conditions.push(eq(graduates.university, body.filterUniversity));
      }
      if (body.filterCareer) {
        conditions.push(eq(graduates.career, body.filterCareer));
      }
      if (body.filterCountry) {
        conditions.push(eq(graduates.country, body.filterCountry));
      }
      if (body.filterYearFrom) {
        conditions.push(
          gte(graduates.graduationYear, parseInt(body.filterYearFrom))
        );
      }
      if (body.filterYearTo) {
        conditions.push(
          lte(graduates.graduationYear, parseInt(body.filterYearTo))
        );
      }

      const results = await db
        .select({
          name: graduates.name,
          email: graduates.email,
          country: graduates.country,
          university: graduates.university,
          career: graduates.career,
          graduationYear: graduates.graduationYear,
        })
        .from(graduates)
        .where(and(...conditions))
        .orderBy(graduates.name);

      const emails = results.map((g) => g.email).join(", ");

      return NextResponse.json({ graduates: results, emails, count: results.length });
    }

    const newList = await db
      .insert(emailLists)
      .values({
        name: body.name,
        description: body.description || null,
        filterUniversity: body.filterUniversity || null,
        filterCareer: body.filterCareer || null,
        filterCountry: body.filterCountry || null,
        filterYearFrom: body.filterYearFrom || null,
        filterYearTo: body.filterYearTo || null,
      })
      .returning();

    return NextResponse.json(newList[0], { status: 201 });
  } catch (error) {
    console.error("Error with email lists:", error);
    return NextResponse.json(
      { error: "Error al procesar lista de correo" },
      { status: 500 }
    );
  }
}
