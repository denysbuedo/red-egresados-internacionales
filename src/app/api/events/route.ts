import { authorizeApi } from "@/lib/api-access";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { events, eventAttendees, graduates, users } from "@/db/schema";
import { getSession } from "@/lib/session";
import { eq, and, desc, gte, sql } from "drizzle-orm";

// GET - Obtener eventos
export async function GET(request: NextRequest) {
  const denied = await authorizeApi(request);
  if (denied) return denied;
  try {
    const { searchParams } = new URL(request.url);
    const upcoming = searchParams.get("upcoming") === "true";
    const eventId = searchParams.get("id");

    if (eventId) {
      // Obtener un evento específico con asistentes
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

      const attendees = await db
        .select({
          id: eventAttendees.id,
          graduateId: graduates.id,
          graduateName: graduates.name,
          graduatePhoto: graduates.photoUrl,
          graduateProfession: graduates.currentProfession,
          status: eventAttendees.status,
        })
        .from(eventAttendees)
        .leftJoin(graduates, eq(eventAttendees.graduateId, graduates.id))
        .where(eq(eventAttendees.eventId, parseInt(eventId)));

      return NextResponse.json({
        ...eventData[0],
        attendees,
        attendeeCount: attendees.length,
      });
    }

    // Lista de eventos
    let baseQuery = db
      .select({
        id: events.id,
        title: events.title,
        description: events.description,
        date: events.date,
        location: events.location,
        type: events.type,
        link: events.link,
        maxAttendees: events.maxAttendees,
        createdAt: events.createdAt,
        organizerId: events.organizerId,
        organizerName: graduates.name,
        organizerPhoto: graduates.photoUrl,
      })
      .from(events)
      .leftJoin(graduates, eq(events.organizerId, graduates.id))
      .$dynamic();

    if (upcoming) {
      const now = new Date();
      baseQuery = baseQuery.where(gte(events.date, now)).orderBy(events.date).limit(20);
    } else {
      baseQuery = baseQuery.orderBy(desc(events.date));
    }

    const eventsList = await baseQuery;

    // Agregar contador de asistentes
    const eventsWithCount = await Promise.all(
      eventsList.map(async (event) => {
        const count = await db
          .select({ count: sql<number>`count(*)` })
          .from(eventAttendees)
          .where(
            and(
              eq(eventAttendees.eventId, event.id),
              eq(eventAttendees.status, "attending")
            )
          );

        return {
          ...event,
          attendeeCount: count[0]?.count || 0,
        };
      })
    );

    return NextResponse.json(eventsWithCount);
  } catch (error) {
    console.error("Error fetching events:", error);
    return NextResponse.json(
      { error: "Error al obtener eventos" },
      { status: 500 }
    );
  }
}

// POST - Crear evento (solo admin)
export async function POST(request: NextRequest) {
  const denied = await authorizeApi(request, ["admin", "editor"]);
  if (denied) return denied;
  try {
    const session = await getSession();

    if (!session || !["admin", "editor"].includes(session.role)) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, description, date, location, type, link, maxAttendees } = body;

    if (!title || !description || !date) {
      return NextResponse.json(
        { error: "Título, descripción y fecha son requeridos" },
        { status: 400 }
      );
    }

    const organizer = db.select({ id: graduates.id }).from(graduates)
      .where(eq(graduates.userId, session.id)).get();
    if (!organizer) return NextResponse.json({ error: "Completa tu perfil para crear eventos" }, { status: 400 });
    const newEvent = await db
      .insert(events)
      .values({
        title,
        description,
        date: new Date(date),
        location: location || null,
        type,
        link: link || null,
        organizerId: organizer.id,
        maxAttendees: maxAttendees || null,
      })
      .returning();

    return NextResponse.json(newEvent[0], { status: 201 });
  } catch (error) {
    console.error("Error creating event:", error);
    return NextResponse.json(
      { error: "Error al crear evento" },
      { status: 500 }
    );
  }
}

// PUT - RSVP a evento
export async function PUT(request: NextRequest) {
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
    const { eventId, status } = body;

    if (!eventId || !["attending", "maybe", "declined"].includes(status)) {
      return NextResponse.json(
        { error: "Datos inválidos" },
        { status: 400 }
      );
    }

    // Obtener graduateId del usuario
    const userGraduate = await db
      .select({ graduateId: graduates.id })
      .from(graduates)
      .where(eq(graduates.userId, session.id))
      .limit(1);

    if (!userGraduate || userGraduate.length === 0) {
      return NextResponse.json(
        { error: "No tienes perfil de egresado" },
        { status: 400 }
      );
    }

    const graduateId = userGraduate[0].graduateId;

    // Verificar si ya está registrado
    const existing = await db
      .select()
      .from(eventAttendees)
      .where(
        and(
          eq(eventAttendees.eventId, parseInt(eventId)),
          eq(eventAttendees.graduateId, graduateId)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      // Actualizar estado
      await db
        .update(eventAttendees)
        .set({ status })
        .where(eq(eventAttendees.id, existing[0].id));
    } else {
      // Nuevo registro
      await db.insert(eventAttendees).values({
        eventId: parseInt(eventId),
        graduateId,
        status,
      });
    }

    return NextResponse.json({ success: true, status });
  } catch (error) {
    console.error("Error RSVP to event:", error);
    return NextResponse.json(
      { error: "Error al confirmar asistencia" },
      { status: 500 }
    );
  }
}
