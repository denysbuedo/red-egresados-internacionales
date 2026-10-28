import { authorizeApi } from "@/lib/api-access";
import { NextRequest, NextResponse } from "next/server";
import { db, sqlite } from "@/db";
import { events, eventAttendees, graduates, notifications } from "@/db/schema";
import { notificationEngine } from "@/lib/notification-suite";
import { getSession } from "@/lib/session";
import { eq, and } from "drizzle-orm";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const denied = await authorizeApi(request, ["admin", "editor"]);
  if (denied) return denied;
  try {
    const session = await getSession();
    const { eventId } = await params;

    if (!session || !["admin", "editor"].includes(session.role)) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 403 }
      );
    }

    // Obtener evento
    const eventData = await db
      .select()
      .from(events)
      .where(eq(events.id, parseInt(eventId)))
      .limit(1);

    if (eventData.length === 0) {
      return NextResponse.json(
        { error: "Evento no encontrado" },
        { status: 404 }
      );
    }

    const event = eventData[0];

    // Obtener asistentes confirmados
    const attendees = await db
      .select({
        graduateId: eventAttendees.graduateId,
      })
      .from(eventAttendees)
      .where(
        and(
          eq(eventAttendees.eventId, parseInt(eventId)),
          eq(eventAttendees.status, "attending")
        )
      );

    // Crear notificaciones para cada asistente
    for (const attendee of attendees) {
      const graduate = await db
        .select({ userId: graduates.userId })
        .from(graduates)
        .where(eq(graduates.id, attendee.graduateId))
        .limit(1);

      if (graduate.length > 0 && graduate[0].userId) {
        if(!event.cancelledAt)notificationEngine.enqueue({key:'event-manual-reminder:'+event.id+':'+event.revision+':'+graduate[0].userId,userId:graduate[0].userId,category:'events',kind:'event_reminder',subject:'CONECTA · Recordatorio de evento',text:'Recuerda tu participación en «'+event.title+'». Consulta los detalles en CONECTA.',link:'/eventos/'+event.id,contextType:'event',contextId:event.id});
        await db.insert(notifications).values({
          userId: graduate[0].userId,
          type: "post_commented", // Reutilizando tipo existente
          message: `📅 Recordatorio: "${event.title}" - ${new Date(event.date!).toLocaleDateString("es-ES", { day: "numeric", month: "long" })}`,
          link: `/eventos`,
          read: 0,
        });
      }
    }

    return NextResponse.json({
      success: true,
      notified: attendees.length,
    });
  } catch (error) {
    console.error("Error notifying attendees:", error);
    return NextResponse.json(
      { error: "Error al enviar notificaciones" },
      { status: 500 }
    );
  }
}
