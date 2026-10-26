import { authorizeApi } from "@/lib/api-access";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { connections, graduates, users } from "@/db/schema";
import { getSession } from "@/lib/session";
import { eq, and, or, desc } from "drizzle-orm";
import { createNotification } from "@/lib/notifications";

// GET - Obtener solicitudes del usuario actual
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

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type"); // 'pending', 'sent', 'accepted'
    const check = searchParams.get("check"); // Check status with specific graduate

    // Si es para verificar estado con un graduate específico
    if (check) {
      const graduateIdToCheck = parseInt(check);
      
      // Obtener el graduateId del usuario
      const userGraduate = await db
        .select({ graduateId: graduates.id })
        .from(graduates)
        .where(eq(graduates.userId, session.id))
        .limit(1);

      if (!userGraduate || userGraduate.length === 0) {
        return NextResponse.json({ status: "none" });
      }

      const myGraduateId = userGraduate[0].graduateId;

      // Verificar si existe conexión
      const existingConnection = await db
        .select()
        .from(connections)
        .where(
          or(
            and(
              eq(connections.senderId, myGraduateId),
              eq(connections.receiverId, graduateIdToCheck)
            ),
            and(
              eq(connections.senderId, graduateIdToCheck),
              eq(connections.receiverId, myGraduateId)
            )
          )
        )
        .limit(1);

      if (existingConnection.length === 0) {
        return NextResponse.json({ status: "none" });
      }

      const conn = existingConnection[0];
      if (conn.status === "accepted") {
        return NextResponse.json({ status: "connected" });
      } else if (conn.status === "pending") {
        if (conn.senderId === myGraduateId) {
          return NextResponse.json({ status: "pending-sent" });
        } else {
          return NextResponse.json({ status: "pending-received" });
        }
      }
    }

    const typeParam = type as string | null;

    // Obtener el graduateId del usuario
    const userGraduate = await db
      .select({ graduateId: graduates.id })
      .from(graduates)
      .where(eq(graduates.userId, session.id))
      .limit(1);

    if (!userGraduate || userGraduate.length === 0) {
      return NextResponse.json([]);
    }

    const graduateId = userGraduate[0].graduateId;

    let query;

    if (type === "pending") {
      // Solicitudes recibidas pendientes
      query = db
        .select({
          id: connections.id,
          senderId: connections.senderId,
          receiverId: connections.receiverId,
          createdAt: connections.createdAt,
          senderName: graduates.name,
          senderPhoto: graduates.photoUrl,
          senderProfession: graduates.currentProfession,
        })
        .from(connections)
        .leftJoin(graduates, eq(connections.senderId, graduates.id))
        .where(
          and(
            eq(connections.receiverId, graduateId),
            eq(connections.status, "pending")
          )
        )
        .orderBy(desc(connections.createdAt));
    } else if (type === "sent") {
      // Solicitudes enviadas pendientes
      query = db
        .select({
          id: connections.id,
          senderId: connections.senderId,
          receiverId: connections.receiverId,
          createdAt: connections.createdAt,
          receiverName: graduates.name,
          receiverPhoto: graduates.photoUrl,
          receiverProfession: graduates.currentProfession,
        })
        .from(connections)
        .leftJoin(graduates, eq(connections.receiverId, graduates.id))
        .where(
          and(
            eq(connections.senderId, graduateId),
            eq(connections.status, "pending")
          )
        )
        .orderBy(desc(connections.createdAt));
    } else if (type === "accepted") {
      // Conexiones aceptadas (amigos) - excluir al usuario actual
      const allFriends = await db
        .select({
          id: connections.id,
          graduateId: graduates.id,
          name: graduates.name,
          photo: graduates.photoUrl,
          profession: graduates.currentProfession,
          country: graduates.country,
          university: graduates.university,
        })
        .from(connections)
        .leftJoin(graduates, or(
          eq(connections.senderId, graduates.id),
          eq(connections.receiverId, graduates.id)
        ))
        .where(
          and(
            or(
              eq(connections.senderId, graduateId),
              eq(connections.receiverId, graduateId)
            ),
            eq(connections.status, "accepted")
          )
        )
        .orderBy(desc(connections.createdAt));

      // Filtrar para excluir al usuario actual
      const result = allFriends.filter(f => f.graduateId !== graduateId);
      return NextResponse.json(result);
    } else {
      // Por defecto, contar pendientes
      const pendingCount = await db
        .select({ count: db.$count(connections) })
        .from(connections)
        .where(
          and(
            eq(connections.receiverId, graduateId),
            eq(connections.status, "pending")
          )
        );

      return NextResponse.json({ pendingCount: pendingCount[0]?.count || 0 });
    }

    const result = await query;
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching connections:", error);
    return NextResponse.json(
      { error: "Error al obtener solicitudes" },
      { status: 500 }
    );
  }
}

// POST - Enviar solicitud de conexión
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

    const body = await request.json();
    const { receiverId } = body;

    if (!receiverId) {
      return NextResponse.json(
        { error: "ID de egresado requerido" },
        { status: 400 }
      );
    }

    // Obtener el graduateId del usuario
    const userGraduate = await db
      .select({ graduateId: graduates.id })
      .from(graduates)
      .where(eq(graduates.userId, session.id))
      .limit(1);

    if (!userGraduate || userGraduate.length === 0) {
      return NextResponse.json(
        { error: "No tienes un perfil de egresado registrado" },
        { status: 400 }
      );
    }

    const senderId = userGraduate[0].graduateId;
    const receiverIdNum = parseInt(receiverId);

    // No permitir enviarse solicitud a sí mismo
    if (senderId === receiverIdNum) {
      return NextResponse.json(
        { error: "No puedes enviarte una solicitud a ti mismo" },
        { status: 400 }
      );
    }

    // Verificar si ya existe una conexión
    const existingConnection = await db
      .select()
      .from(connections)
      .where(
        or(
          and(
            eq(connections.senderId, senderId),
            eq(connections.receiverId, receiverIdNum)
          ),
          and(
            eq(connections.senderId, receiverIdNum),
            eq(connections.receiverId, senderId)
          )
        )
      )
      .limit(1);

    if (existingConnection.length > 0) {
      const status = existingConnection[0].status;
      if (status === "accepted") {
        return NextResponse.json(
          { error: "Ya estás conectado con este egresado" },
          { status: 400 }
        );
      } else if (status === "pending") {
        // Verificar quién envió la solicitud
        if (existingConnection[0].senderId === senderId) {
          return NextResponse.json(
            { error: "Ya has enviado una solicitud a este egresado" },
            { status: 400 }
          );
        } else {
          return NextResponse.json(
            { error: "Este egresado ya te ha enviado una solicitud" },
            { status: 400 }
          );
        }
      }
    }

    // Crear la solicitud
    await db.insert(connections).values({
      senderId,
      receiverId: receiverIdNum,
      status: "pending",
    });

    return NextResponse.json({
      success: true,
      message: "Solicitud enviada correctamente",
    });
  } catch (error) {
    console.error("Error sending connection request:", error);
    return NextResponse.json(
      { error: "Error al enviar solicitud" },
      { status: 500 }
    );
  }
}

// PUT - Aceptar o rechazar solicitud
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
    const { connectionId, action } = body;

    if (!connectionId || !action) {
      return NextResponse.json(
        { error: "Datos requeridos" },
        { status: 400 }
      );
    }

    if (!["accept", "reject"].includes(action)) {
      return NextResponse.json(
        { error: "Acción inválida" },
        { status: 400 }
      );
    }

    // Obtener el graduateId del usuario
    const userGraduate = await db
      .select({ graduateId: graduates.id })
      .from(graduates)
      .where(eq(graduates.userId, session.id))
      .limit(1);

    if (!userGraduate || userGraduate.length === 0) {
      return NextResponse.json(
        { error: "No tienes un perfil de egresado registrado" },
        { status: 400 }
      );
    }

    const graduateId = userGraduate[0].graduateId;

    // Verificar que la solicitud existe y es para este usuario
    const connection = await db
      .select()
      .from(connections)
      .where(
        and(
          eq(connections.id, parseInt(connectionId)),
          eq(connections.receiverId, graduateId),
          eq(connections.status, "pending")
        )
      )
      .limit(1);

    if (connection.length === 0) {
      return NextResponse.json(
        { error: "Solicitud no encontrada" },
        { status: 404 }
      );
    }

    // Actualizar el estado
    await db
      .update(connections)
      .set({ status: action === "accept" ? "accepted" : "rejected" })
      .where(eq(connections.id, parseInt(connectionId)));

    // Si acepta, crear notificación para el sender
    if (action === "accept" && connection.length > 0) {
      const senderGraduate = await db
        .select({ userId: graduates.userId })
        .from(graduates)
        .where(eq(graduates.id, connection[0].senderId))
        .limit(1);

      if (senderGraduate.length > 0 && senderGraduate[0].userId) {
        const receiverGraduate = await db
          .select({ name: graduates.name })
          .from(graduates)
          .where(eq(graduates.id, graduateId))
          .limit(1);

        await createNotification(
          senderGraduate[0].userId,
          "connection_accepted",
          `${receiverGraduate[0]?.name || "Alguien"} aceptó tu solicitud de conexión`,
          `/egresados/${graduateId}`
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: action === "accept" ? "Solicitud aceptada" : "Solicitud rechazada",
    });
  } catch (error) {
    console.error("Error handling connection request:", error);
    return NextResponse.json(
      { error: "Error al procesar solicitud" },
      { status: 500 }
    );
  }
}

// DELETE - Cancelar solicitud enviada
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
    const connectionId = searchParams.get("id");

    if (!connectionId) {
      return NextResponse.json(
        { error: "ID de conexión requerido" },
        { status: 400 }
      );
    }

    const profile = db.select({ id: graduates.id }).from(graduates).where(eq(graduates.userId, session.id)).get();
    if (!profile) return NextResponse.json({ error: "No tienes perfil de egresado" }, { status: 403 });
    const removed = db.delete(connections).where(and(
      eq(connections.id, Number(connectionId)),
      or(eq(connections.senderId, profile.id), eq(connections.receiverId, profile.id))
    )).returning({ id: connections.id }).get();
    if (!removed) return NextResponse.json({ error: "Conexión no encontrada" }, { status: 404 });

    return NextResponse.json({
      success: true,
      message: "Solicitud cancelada",
    });
  } catch (error) {
    console.error("Error canceling connection:", error);
    return NextResponse.json(
      { error: "Error al cancelar solicitud" },
      { status: 500 }
    );
  }
}
