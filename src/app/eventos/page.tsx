"use client";

import { PageHeader } from "@/components/PageHeader";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Event {
  id: number;
  title: string;
  description: string;
  date: Date | null;
  location: string | null;
  type: "virtual" | "in-person";
  link: string | null;
  maxAttendees: number | null;
  organizerName: string | null;
  organizerPhoto: string | null;
  attendeeCount: number;
}

export default function EventsPage() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [rsvpLoading, setRsvpLoading] = useState<number | null>(null);

  async function fetchEvents() {
    try {
      const response = await fetch("/api/events?upcoming=true");
      if (response.ok) {
        const data = await response.json();
        setEvents(data);
      }
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoading(false);
    }
  }

  const handleRSVP = async (eventId: number, status: string) => {
    setRsvpLoading(eventId);
    try {
      const response = await fetch("/api/events", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, status }),
      });

      if (response.ok) {
        fetchEvents();
      }
    } catch (error) {
      console.error("Error RSVP:", error);
    } finally {
      setRsvpLoading(null);
    }
  };

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

  useEffect(() => {
    // Verificar sesión y estado de aprobación
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          router.push("/login?redirect=/eventos");
          return;
        }
        if (data.user?.status === "pending") {
          router.push("/pendiente");
          return;
        }
        fetchEvents();
      })
      .catch(() => {
        router.push("/login?redirect=/eventos");
      });
  }, []);


  return (
    <main className="ui-page min-h-screen bg-gray-50">
      <div className="ui-content ui-primary-content max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <PageHeader title="Eventos" description="Encuentros para compartir experiencias, aprender y crear en conjunto." eyebrow="AGENDA · NOS ENCONTRAMOS" />

        {/* Lista de eventos */}
        {loading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-4 border-[#102B46] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-500">Cargando eventos...</p>
          </div>
        ) : events.length > 0 ? (
          <div className="space-y-6">
            {events.map((event) => (
              <div
                key={event.id}
                className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Tipo de evento */}
                <div className={`px-6 py-3 ${
                  event.type === "virtual" 
                    ? "bg-blue-50 border-b border-blue-100" 
                    : "bg-green-50 border-b border-green-100"
                }`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-medium ${
                      event.type === "virtual" ? "text-blue-700" : "text-green-700"
                    }`}>
                      {event.type === "virtual" ? "🖥️ Evento Virtual" : "📍 Evento Presencial"}
                    </span>
                    <span className="text-sm text-gray-500">
                      {event.attendeeCount} {event.attendeeCount === 1 ? "asistente" : "asistentes"}
                      {event.maxAttendees && ` / ${event.maxAttendees}`}
                    </span>
                  </div>
                </div>

                {/* Contenido */}
                <div className="p-6">
                  <Link href={`/eventos/${event.id}`}>
                    <h2 className="text-xl font-bold text-gray-900 mb-2 hover:text-[#102B46] transition-colors">
                      {event.title}
                    </h2>
                  </Link>
                  <p className="text-gray-600 mb-4 whitespace-pre-wrap">
                    {event.description}
                  </p>

                  {/* Detalles */}
                  <div className="space-y-2 mb-6">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {formatDate(event.date)}
                    </div>
                    {event.location && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {event.location}
                      </div>
                    )}
                    {event.link && (
                      <a
                        href={event.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                        Enlace del evento
                      </a>
                    )}
                  </div>

                  {/* Botones RSVP */}
                  <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                    <button
                      onClick={() => handleRSVP(event.id, "attending")}
                      disabled={rsvpLoading === event.id}
                      className="px-4 py-2 bg-[#102B46] hover:bg-[#0C1D30] disabled:bg-gray-400 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      {rsvpLoading === event.id ? "..." : "✓ Asistiré"}
                    </button>
                    <button
                      onClick={() => handleRSVP(event.id, "maybe")}
                      disabled={rsvpLoading === event.id}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-300 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                    >
                      🤔 Tal vez
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              No hay eventos próximos
            </h3>
            <p className="text-gray-500">
              La administración publicará eventos pronto
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
