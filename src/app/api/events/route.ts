import { authorizeApi } from "@/lib/api-access";
import { NextRequest, NextResponse } from "next/server";
import { db, sqlite } from "@/db";
import { events, eventAttendees, graduates, users } from "@/db/schema";
import { notificationEngine } from "@/lib/notification-suite";
import { randomUUID } from "node:crypto";
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
        canManage: (await getSession())?.role==='admin' || (await getSession())?.role==='editor' && !!sqlite.prepare('SELECT 1 FROM graduates WHERE user_id=? AND id=?').get((await getSession())!.id,eventData[0].organizerId),
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
        cancelledAt:events.cancelledAt,
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
      baseQuery = baseQuery.where(and(gte(events.date, now),sql`${events.cancelledAt} IS NULL`)).orderBy(events.date).limit(20);
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

    if(typeof title!=='string'||title.trim().length<3||title.length>200||typeof description!=='string'||description.trim().length<5||description.length>5000||!['virtual','in-person'].includes(type)||!Number.isFinite(new Date(date).getTime())||new Date(date).getTime()<=Date.now())return NextResponse.json({error:'Revisa el título, descripción, tipo y fecha futura del evento.'},{status:400});
    if(link&&(typeof link!=='string'||link.length>2000||!/^https?:\/\//.test(link)))return NextResponse.json({error:'Enlace inválido'},{status:400});
    if(location&&(typeof location!=='string'||location.length>500))return NextResponse.json({error:'Ubicación inválida'},{status:400});
    if(maxAttendees&&(!Number.isSafeInteger(Number(maxAttendees))||Number(maxAttendees)<1))return NextResponse.json({error:'Capacidad inválida'},{status:400});
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

// Confirm attendance atomically so retries do not emit another confirmation.
export async function PUT(request:NextRequest){const denied=await authorizeApi(request);if(denied)return denied;
 try{const user=(await getSession())!,body=await request.json(),id=Number(body.eventId),status=body.status;
 if(!Number.isSafeInteger(id)||id<1||!['attending','maybe','declined'].includes(status))return NextResponse.json({error:'Datos inválidos'},{status:400});
 const profile=sqlite.prepare('SELECT id FROM graduates WHERE user_id=?').get(user.id) as {id:number}|undefined;if(!profile)return NextResponse.json({error:'Completa tu perfil'},{status:400});
 const result=sqlite.transaction(()=>{
  const event=sqlite.prepare('SELECT * FROM events WHERE id=?').get(id) as {title:string;date:number;cancelled_at:number|null;max_attendees:number|null}|undefined;if(!event)return {error:'Evento no encontrado',code:404};if(event.cancelled_at)return {error:'El evento está cancelado',code:409};
  const old=sqlite.prepare('SELECT id,status FROM event_attendees WHERE event_id=? AND graduate_id=?').get(id,profile.id) as {id:number;status:string}|undefined;
  if(status==='attending'&&old?.status!=='attending'){
   if(event.date*1000<=Date.now())return {error:'El evento ya ha comenzado',code:409};
   const count=(sqlite.prepare("SELECT count(DISTINCT graduate_id) n FROM event_attendees WHERE event_id=? AND status='attending'").get(id) as {n:number}).n;if(event.max_attendees&&count>=event.max_attendees)return {error:'No quedan plazas disponibles',code:409};
  }
  if(old)sqlite.prepare('UPDATE event_attendees SET status=? WHERE event_id=? AND graduate_id=?').run(status,id,profile.id);else sqlite.prepare('INSERT INTO event_attendees (event_id,graduate_id,status,created_at) VALUES (?,?,?,?)').run(id,profile.id,status,Math.floor(Date.now()/1000));
  if(status==='attending'&&old?.status!=='attending')notificationEngine.enqueue({key:'rsvp:'+id+':'+user.id+':'+randomUUID(),userId:user.id,category:'events',kind:'event_registered',subject:'CONECTA · Inscripción confirmada',text:'Has confirmado tu asistencia a «'+event.title+'». Consulta la fecha, ubicación y detalles en CONECTA.',link:'/eventos/'+id,contextType:'event',contextId:id});
  if(status!=='attending')sqlite.prepare("UPDATE notification_queue SET state='skipped',text_body='' WHERE user_id=? AND context_type='event' AND context_id=? AND state='pending'").run(user.id,id);
  return {success:true,status};
 }).immediate();return NextResponse.json(result,{status:'code' in result?result.code:200});
 }catch{return NextResponse.json({error:'No se pudo confirmar la asistencia'},{status:400});}
}
export async function PATCH(request:NextRequest){const denied=await authorizeApi(request,['admin','editor']);if(denied)return denied;
 try{const user=(await getSession())!,body=await request.json(),id=Number(body.id);if(!Number.isSafeInteger(id)||id<1)return NextResponse.json({error:'Evento inválido'},{status:400});
 const result=sqlite.transaction(()=>{
  const event=sqlite.prepare('SELECT * FROM events WHERE id=?').get(id) as {organizer_id:number;title:string;date:number;description:string;location:string|null;type:string;link:string|null;max_attendees:number|null;cancelled_at:number|null;revision:number}|undefined;
  if(!event)return {error:'Evento no encontrado',code:404};if(user.role!=='admin'&&!sqlite.prepare('SELECT 1 FROM graduates WHERE id=? AND user_id=?').get(event.organizer_id,user.id))return {error:'No puedes gestionar este evento',code:403};
  const cancel=body.action==='cancel';if(event.cancelled_at)return cancel?{success:true}:{error:'El evento ya está cancelado',code:409};
  let title=event.title;if(!cancel){
   if(typeof body.title!=='string'||body.title.trim().length<3||body.title.length>200||typeof body.description!=='string'||body.description.trim().length<5||body.description.length>5000||!['virtual','in-person'].includes(body.type))return {error:'Revisa el título, descripción y tipo',code:400};
   const date=new Date(body.date).getTime();if(!Number.isFinite(date)||date<=Date.now())return {error:'Indica una fecha futura válida',code:400};
   if(body.link && (typeof body.link!=='string'||body.link.length>2000||!/^https?:\/\//.test(body.link)))return {error:'Enlace inválido',code:400};
   if(body.location && (typeof body.location!=='string'||body.location.length>500))return {error:'Ubicación inválida',code:400};
   const maximum=body.maxAttendees?Number(body.maxAttendees):null;if(maximum!==null&&(!Number.isSafeInteger(maximum)||maximum<1))return {error:'Capacidad inválida',code:400};
   const values=[body.title.trim(),body.description.trim(),Math.floor(date/1000),body.location||null,body.type,body.link||null,maximum];
   if(JSON.stringify(values)===JSON.stringify([event.title,event.description,event.date,event.location,event.type,event.link,event.max_attendees]))return {success:true};
   title=body.title.trim();sqlite.prepare('UPDATE events SET title=?,description=?,date=?,location=?,type=?,link=?,max_attendees=?,revision=revision+1 WHERE id=?').run(...values,id);
  }else sqlite.prepare('UPDATE events SET cancelled_at=?,revision=revision+1 WHERE id=?').run(Date.now(),id);
  sqlite.prepare("UPDATE notification_queue SET state='skipped',text_body='' WHERE context_type='event' AND context_id=? AND state='pending'").run(id);
  const people=sqlite.prepare("SELECT DISTINCT g.user_id AS id FROM event_attendees a JOIN graduates g ON g.id=a.graduate_id JOIN users u ON u.id=g.user_id WHERE a.event_id=? AND a.status='attending' AND u.status='approved'").all(id) as {id:number}[];
  for(const person of people)notificationEngine.enqueue({key:'event:'+id+':revision:'+(event.revision+1)+':'+person.id,userId:person.id,category:'events',kind:cancel?'event_cancelled':'event_updated',subject:cancel?'CONECTA · Evento cancelado':'CONECTA · Cambios en un evento',text:cancel?'El evento «'+title+'» ha sido cancelado.':'Se han actualizado los datos de «'+title+'». Revisa la fecha, ubicación y detalles antes de asistir.',link:'/eventos/'+id,contextType:'event',contextId:id});
  return {success:true};
 }).immediate();return NextResponse.json(result,{status:'code' in result?result.code:200});
 }catch{return NextResponse.json({error:'No se pudo actualizar el evento'},{status:400});}}
