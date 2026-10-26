import { authorizeApi } from "@/lib/api-access";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, graduates } from "@/db/schema";
import { getSession } from "@/lib/session";
import { eq, and, sql } from "drizzle-orm";

// GET - Obtener lista de usuarios (solo admin)
export async function GET(request: NextRequest) {
  const denied = await authorizeApi(request, ["admin"]);
  if (denied) return denied;
  try {
    const session = await getSession();

    if (!session || session.role !== "admin") {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const role = searchParams.get("role");

    const conditions = [];

    if (search) {
      conditions.push(
        sql`${users.username} LIKE ${"%" + search + "%"} OR ${users.email} LIKE ${"%" + search + "%"}`
      );
    }

    if (role) {
      if (!["user", "admin", "institution", "editor"].includes(role)) {
        return NextResponse.json({ error: "Rol inválido" }, { status: 400 });
      }
      conditions.push(eq(users.role, role as typeof users.$inferSelect.role));
    }

    const allUsers = await db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        role: users.role,
        institutionName: users.institutionName,
        createdAt: users.createdAt,
        graduateId: users.graduateId,
        graduateName: graduates.name,
        graduateCountry: graduates.country,
      })
      .from(users)
      .leftJoin(graduates, eq(users.id, graduates.userId))
      .where(and(...conditions))
      .orderBy(sql`users.created_at DESC`);

    return NextResponse.json(allUsers);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Error al obtener usuarios" },
      { status: 500 }
    );
  }
}

// PUT - Actualizar usuario (solo admin)
export async function PUT(request: NextRequest) {
  const denied = await authorizeApi(request, ["admin"]);
  if (denied) return denied;
  try {
    const session = await getSession();

    if (!session || session.role !== "admin") {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { id, role, username, email } = body;

    if (!id) {
      return NextResponse.json(
        { error: "ID de usuario requerido" },
        { status: 400 }
      );
    }

    // Verificar que no se esté modificando a sí mismo para quitar rol admin
    if (session.id === parseInt(id) && role && role !== "admin") {
      return NextResponse.json(
        { error: "No puedes cambiar tu propio rol de administrador" },
        { status: 400 }
      );
    }

    if (role && !["user", "admin", "institution", "editor"].includes(role)) {
      return NextResponse.json({ error: "Rol inválido" }, { status: 400 });
    }
    const updateData: Partial<typeof users.$inferInsert> = {};
    if (role) updateData.role = role;
    if (username) updateData.username = username;
    if (email) updateData.email = email;
    if (body.institutionName !== undefined) {
      if (typeof body.institutionName !== "string" || body.institutionName.length > 200) {
        return NextResponse.json({ error: "Institución inválida" }, { status: 400 });
      }
      updateData.institutionName = body.institutionName.trim() || null;
    }
    if (role === "institution" && !updateData.institutionName) {
      return NextResponse.json({ error: "Debes asignar la institución que gestionará la cuenta" }, { status: 400 });
    }

    await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, parseInt(id)));

    return NextResponse.json({ message: "Usuario actualizado correctamente" });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Error al actualizar usuario" },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar usuario (solo admin)
export async function DELETE(request: NextRequest) {
  const denied = await authorizeApi(request, ["admin"]);
  if (denied) return denied;
  try {
    const session = await getSession();

    if (!session || session.role !== "admin") {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "ID de usuario requerido" },
        { status: 400 }
      );
    }

    const userId = parseInt(id);

    // No permitir eliminarse a sí mismo
    if (session.id === userId) {
      return NextResponse.json(
        { error: "No puedes eliminar tu propia cuenta" },
        { status: 400 }
      );
    }

    // Eliminar perfil de graduado si existe
    await db
      .delete(graduates)
      .where(eq(graduates.userId, userId));

    // Eliminar usuario
    await db
      .delete(users)
      .where(eq(users.id, userId));

    return NextResponse.json({ message: "Usuario eliminado correctamente" });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Error al eliminar usuario" },
      { status: 500 }
    );
  }
}
