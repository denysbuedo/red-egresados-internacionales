"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

interface Attendee {
  id: number;
  graduateId: number;
  graduateName: string;
  graduatePhoto: string | null;
  graduateProfession: string;
  status: "attending" | "maybe" | "declined";
  joinedAt: Date | null;
}

interface EventDetail {
  id: number;
  title: string;
  description: string;
  date: Date | null;
  location: string | null;
  type: "virtual" | "in-person";
  link: string | null;
  maxAttendees: number | null;
  attendees: Attendee[];
  attendeeCount: number;
}

export default function AdminEventDetailPage() {
  const params = useParams();
  const eventId = params?.id as string;
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "attending" | "maybe" | "declined">("all");

  async function fetchEvent() {
    try {
      const response = await fetch(`/api/events?id=${eventId}`);
      if (response.ok) {
        const data = await response.json();
        setEvent(data);
      }
    } catch (error) {
      console.error("Error fetching event:", error);
    } finally {
      setLoading(false);
    }
  }

  const formatDate = (date: Date | null) => {
    if (!date) return "Fecha por confirmar";
    return new Date(date).toLocaleDateString("es-ES", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const statusLabels = {
    attending: "✓ Asistirá",
    maybe: "🤔 Tal vez",
    declined: "✗ No asistirá",
  };

  const statusColors = {
    attending: "bg-green-100 text-green-800",
    maybe: "bg-yellow-100 text-yellow-800",
    declined: "bg-red-100 text-red-800",
  };

  useEffect(() => {
    if (eventId) {
      fetchEvent();
    }
  }, [eventId]);


  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="w-8 h-8 border-4 border-[#102B46] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-500">Cargando evento...</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Evento no encontrado</p>
        <Link href="/eventos" className="text-[#102B46] hover:underline mt-2 inline-block">
          ← Volver a eventos
        </Link>
      </div>
    );
  }

  const filteredAttendees = filter === "all" 
    ? event.attendees 
    : event.attendees.filter(a => a.status === filter);

  const attendingCount = event.attendees.filter(a => a.status === "attending").length;
  const maybeCount = event.attendees.filter(a => a.status === "maybe").length;
  const declinedCount = event.attendees.filter(a => a.status === "declined").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Detalle del Evento</h1>
          <Link href="/eventos" className="text-[#102B46] hover:underline text-sm mt-1 inline-block">
            ← Volver a eventos
          </Link>
        </div>
      </div>

      {/* Info del evento */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{event.title}</h2>
            <p className="text-gray-600 mt-1 whitespace-pre-wrap">{event.description}</p>
          </div>
          <span className={`text-sm px-3 py-1 rounded-full ${
            event.type === "virtual" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"
          }`}>
            {event.type === "virtual" ? "🖥️ Virtual" : "📍 Presencial"}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Fecha:</span>
            <p className="font-medium text-gray-900">{formatDate(event.date)}</p>
          </div>
          {event.location && (
            <div>
              <span className="text-gray-500">Lugar:</span>
              <p className="font-medium text-gray-900">{event.location}</p>
            </div>
          )}
          {event.link && (
            <div>
              <span className="text-gray-500">Enlace:</span>
              <a href={event.link} target="_blank" rel="noopener noreferrer" className="text-[#102B46] hover:underline block">
                {event.link}
              </a>
            </div>
          )}
          <div>
            <span className="text-gray-500">Capacidad:</span>
            <p className="font-medium text-gray-900">{event.maxAttendees || "Sin límite"}</p>
          </div>
        </div>
      </div>

      {/* Resumen de asistentes */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          Resumen de Asistentes ({event.attendeeCount})
        </h3>
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <p className="text-3xl font-bold text-green-700">{attendingCount}</p>
            <p className="text-sm text-green-600">Asistirán</p>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
            <p className="text-3xl font-bold text-yellow-700">{maybeCount}</p>
            <p className="text-sm text-yellow-600">Tal vez</p>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
            <p className="text-3xl font-bold text-red-700">{declinedCount}</p>
            <p className="text-sm text-red-600">No asistirán</p>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex items-center gap-2 mb-4">
          {(["all", "attending", "maybe", "declined"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filter === f
                  ? "bg-[#102B46] text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {f === "all" ? `Todos (${event.attendeeCount})` : 
               f === "attending" ? `Asistirán (${attendingCount})` :
               f === "maybe" ? `Tal vez (${maybeCount})` :
               `No asistirán (${declinedCount})`}
            </button>
          ))}
        </div>

        {/* Lista de asistentes */}
        {filteredAttendees.length > 0 ? (
          <div className="space-y-2">
            {filteredAttendees.map((attendee) => (
              <div
                key={attendee.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Link href={`/miembros/${attendee.graduateId}`}>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#102B46] to-[#2776C9] flex items-center justify-center text-white text-sm font-bold shrink-0">
                      {attendee.graduateName?.charAt(0).toUpperCase()}
                    </div>
                  </Link>
                  <div>
                    <Link href={`/miembros/${attendee.graduateId}`} className="font-medium text-gray-900 hover:text-[#102B46]">
                      {attendee.graduateName}
                    </Link>
                    <p className="text-xs text-gray-500">{attendee.graduateProfession}</p>
                  </div>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full ${statusColors[attendee.status]}`}>
                  {statusLabels[attendee.status]}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No hay asistentes con este filtro
          </div>
        )}
      </div>

      {/* Enviar notificaciones */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          Notificar a Asistentes
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Enviar notificación a todos los confirmados sobre este evento.
        </p>
        <button
          onClick={async () => {
            try {
              const response = await fetch(`/api/events/${eventId}/notify`, {
                method: "POST",
              });
              if (response.ok) {
                alert("Notificaciones enviadas correctamente");
              }
            } catch (error) {
              alert("Error al enviar notificaciones");
            }
          }}
          className="px-4 py-2 bg-[#102B46] hover:bg-[#0C1D30] text-white rounded-lg text-sm font-medium transition-colors"
        >
          🔔 Notificar a {attendingCount} asistentes confirmados
        </button>
      </div>
    </div>
  );
}
