import { MEMBER_TYPES, type MemberType } from "@/lib/site";
import { validateProfileInput } from "@/lib/profile-input";
import { authorizeApi } from "@/lib/api-access";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { graduates, users } from "@/db/schema";
import { like, eq, and, gte, lte, sql } from "drizzle-orm";
import { getSession } from "@/lib/session";

export async function GET(request: Request) {
  const denied = await authorizeApi(request);
  if (denied) return denied;
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const country = searchParams.get("country");
    const university = searchParams.get("institution") || searchParams.get("university");
    const memberType = searchParams.get("memberType");
    const career = searchParams.get("career");
    const yearFrom = searchParams.get("yearFrom");
    const yearTo = searchParams.get("yearTo");

    const conditions = [sql`EXISTS (SELECT 1 FROM users WHERE users.id = ${graduates.userId} AND users.status = 'approved')`];

    if (search) {
      conditions.push(
        sql`${graduates.name} LIKE ${"%" + search + "%"}`
      );
    }
    if (memberType) {
      if (!MEMBER_TYPES.some((type) => type.value === memberType)) return NextResponse.json({ error: "Tipo de miembro inválido" }, { status: 400 });
      conditions.push(eq(graduates.memberType, memberType as MemberType));
    }
    if (country) {
      conditions.push(eq(graduates.country, country));
    }
    if (university) {
      conditions.push(eq(graduates.university, university));
    }
    if (career) {
      conditions.push(eq(graduates.career, career));
    }
    if (yearFrom) {
      conditions.push(gte(graduates.graduationYear, parseInt(yearFrom)));
    }
    if (yearTo) {
      conditions.push(lte(graduates.graduationYear, parseInt(yearTo)));
    }

    const query =
      conditions.length > 0
        ? db
            .select()
            .from(graduates)
            .where(and(...conditions))
        : db.select().from(graduates);

    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 50));
    const offset = Math.max(0, Number(searchParams.get("offset")) || 0);
    const allGraduates = await query.orderBy(graduates.createdAt).limit(limit).offset(offset);

    const publicProfiles = allGraduates.map(({ email, phone, userId, linkedin, website, ...profile }) => ({ ...profile, graduationYear: profile.graduationYear || null, institution: profile.university }));
    return NextResponse.json(publicProfiles);
  } catch (error) {
    console.error("Error fetching graduates:", error);
    return NextResponse.json(
      { error: "Error al obtener miembros" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const denied = await authorizeApi(request, undefined, { allowPending: true });
  if (denied) return denied;
  try {
    // Verificar autenticación
    const session = await getSession({ allowPending: true });
    
    if (!session) {
      return NextResponse.json(
        { error: "Debes iniciar sesión para crear tu perfil" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const invalid = validateProfileInput(body);
    if (invalid) return invalid;
    if (!MEMBER_TYPES.some((type) => type.value === body.memberType) || body.employmentConfirmed !== true) {
      return NextResponse.json({ error: "Selecciona tu perfil profesional y confirma tu vínculo laboral" }, { status: 400 });
    }
    const institution = body.institution ?? body.university;
    if (typeof institution !== "string" || !institution.trim() || institution.length > 200 ||
        typeof body.name !== "string" || !body.name.trim() || body.name.length > 150 ||
        typeof body.country !== "string" || !body.country.trim() || body.country.length > 100 ||
        typeof body.currentProfession !== "string" || !body.currentProfession.trim() || body.currentProfession.length > 200) {
      return NextResponse.json({ error: "Completa nombre, país, institución y cargo laboral" }, { status: 400 });
    }

    // Verificar si el usuario ya tiene un perfil de miembro
    const existingGraduate = await db
      .select()
      .from(graduates)
      .where(eq(graduates.userId, session.id))
      .limit(1);

    if (existingGraduate.length > 0) {
      return NextResponse.json(
        { error: "Ya tienes un perfil registrado" },
        { status: 400 }
      );
    }

    const newGraduate = db.transaction((tx) => {
      const profile = tx.insert(graduates).values({
        userId: session.id,
        memberType: body.memberType,
        employmentConfirmed: true,
        name: body.name,
        email: body.email || session.email,
        country: body.country,
        city: body.city || null,
        university: institution.trim(),
        career: body.career || "",
        graduationYear: body.graduationYear ? Number(body.graduationYear) : 0,
        currentProfession: body.currentProfession,
        currentCompany: body.currentCompany || null,
        bio: body.bio || null,
        photoUrl: body.photoUrl || null,
        phone: body.phone || null,
        linkedin: body.linkedin || null,
        skills: body.skills || null,
        languages: body.languages || null,
        interests: body.interests || null,
        website: body.website || null,
      }).returning().get();
      tx.update(users).set({ graduateId: profile.id, pendingUniversity: institution.trim(),
        status: session.role === "user" ? "pending" : session.status }).where(eq(users.id, session.id)).run();
      return profile;
    });

    return NextResponse.json({ ...newGraduate, graduationYear: newGraduate.graduationYear || null, institution: newGraduate.university }, { status: 201 });
  } catch (error) {
    console.error("Error creating graduate:", error);
    return NextResponse.json(
      { error: "Error al crear perfil" },
      { status: 500 }
    );
  }
}
