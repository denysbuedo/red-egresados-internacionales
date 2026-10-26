import { authorizeApi } from "@/lib/api-access";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { notifications, users } from "@/db/schema";
import { getSession } from "@/lib/session";
import { eq, desc, sql } from "drizzle-orm";

// GET - Obtener notificaciones del usuario
export async function GET(request: NextRequest) {
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

    // Always return all notifications (limit 50), most recent first
    const notifs = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, session.id))
      .orderBy(desc(notifications.createdAt))
      .limit(50);

    return NextResponse.json(notifs);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { error: "Error al obtener notificaciones" },
      { status: 500 }
    );
  }
}

// PUT - Marcar como leída
export async function PUT(request: NextRequest) {
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

    const body = await request.json();
    const { notificationId, markAllRead } = body;

    if (markAllRead) {
      await db
        .update(notifications)
        .set({ read: 1 })
        .where(
          sql`${notifications.userId} = ${session.id} AND ${notifications.read} = 0`
        );
      return NextResponse.json({ success: true });
    }

    if (!notificationId) {
      return NextResponse.json(
        { error: "ID requerido" },
        { status: 400 }
      );
    }

    await db
      .update(notifications)
      .set({ read: 1 })
      .where(
        sql`${notifications.id} = ${parseInt(notificationId)} AND ${notifications.userId} = ${session.id}`
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating notification:", error);
    return NextResponse.json(
      { error: "Error al actualizar notificación" },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar notificación
export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const notificationId = searchParams.get("id");

    if (!notificationId) {
      return NextResponse.json(
        { error: "ID requerido" },
        { status: 400 }
      );
    }

    await db
      .delete(notifications)
      .where(
        sql`${notifications.id} = ${parseInt(notificationId)} AND ${notifications.userId} = ${session.id}`
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting notification:", error);
    return NextResponse.json(
      { error: "Error al eliminar notificación" },
      { status: 500 }
    );
  }
}
