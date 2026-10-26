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

export default function EventDetailPage() {
  const params = useParams();
  const eventId = params?.id as string;
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [rsvpLoading, setRsvpLoading] = useState(false);
  const [userStatus, setUserStatus] = useState<string | null>(null);

  async function fetchEvent() {
    try {
      const response = await fetch(`/api/events?id=${eventId}`);
      if (response.ok) {
        const data = await response.json();
        setEvent(data);
        // Check user's RSVP status
        const myAttendee = data.attendees?.find((a: Attendee) => {
          // This would need the current user's graduateId
          return false; // Simplified for now
        });
        if (myAttendee) {
          setUserStatus(myAttendee.status);
        }
      }
    } catch (error) {
      console.error("Error fetching event:", error);
    } finally {
      setLoading(false);
    }
  }

  const handleRSVP = async (status: string) => {
    setRsvpLoading(true);
    try {
      const response = await fetch("/api/events", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: parseInt(eventId), status }),
      });

      if (response.ok) {
        setUserStatus(status);
        fetchEvent();
      }
    } catch (error) {
      console.error("Error RSVP:", error);
    } finally {
      setRsvpLoading(false);
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
    if (eventId) {
      fetchEvent();
    }
  }, [eventId]);


  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8 text-center">
          <div className="w-8 h-8 border-4 border-[#003f8f] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Cargando evento...</p>
        </div>
      </main>
    );
  }

  if (!event) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Evento no encontrado</h2>
            <Link href="/eventos" className="text-[#003f8f] hover:underline">
              ← Volver a eventos
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const attendingCount = event.attendees.filter(a => a.status === "attending").length;
  const maybeCount = event.attendees.filter(a => a.status === "maybe").length;

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <Link href="/eventos" className="text-[#003f8f] hover:underline text-sm font-medium">
            ← Volver a eventos
          </Link>
        </div>

        {/* Event Info */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm mb-6">
          {/* Type Banner */}
          <div className={`px-6 py-4 ${
            event.type === "virtual" 
              ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white" 
              : "bg-gradient-to-r from-green-600 to-green-500 text-white"
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold">
                {event.type === "virtual" ? "🖥️ Evento Virtual" : "📍 Evento Presencial"}
              </span>
              <span className="text-sm opacity-90">
                {attendingCount} confirmados
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-3">{event.title}</h1>
            <p className="text-gray-600 mb-6 whitespace-pre-wrap">{event.description}</p>

            {/* Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div className="flex items-center gap-3 text-sm">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <div>
                  <span className="text-gray-500 block">Fecha y hora</span>
                  <span className="font-medium text-gray-900">{formatDate(event.date)}</span>
                </div>
              </div>
              {event.location && (
                <div className="flex items-center gap-3 text-sm">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <div>
                    <span className="text-gray-500 block">Lugar</span>
                    <span className="font-medium text-gray-900">{event.location}</span>
                  </div>
                </div>
              )}
              {event.maxAttendees && (
                <div className="flex items-center gap-3 text-sm">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <div>
                    <span className="text-gray-500 block">Capacidad</span>
                    <span className="font-medium text-gray-900">{attendingCount} / {event.maxAttendees}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Link to join (only for virtual events) */}
            {event.type === "virtual" && event.link && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <p className="text-sm font-medium text-blue-900 mb-2">🔗 Enlace para unirse al evento</p>
                <a
                  href={event.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Abrir enlace del evento
                </a>
              </div>
            )}

            {/* RSVP Buttons */}
            <div className="pt-4 border-t border-gray-100">
              <p className="text-sm font-medium text-gray-700 mb-3">¿Vas a asistir?</p>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => handleRSVP("attending")}
                  disabled={rsvpLoading}
                  className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    userStatus === "attending"
                      ? "bg-green-600 text-white"
                      : "bg-[#003f8f] hover:bg-[#002860] text-white"
                  } disabled:bg-gray-400`}
                >
                  {userStatus === "attending" ? "✓ Confirmado" : "✓ Asistiré"}
                </button>
                <button
                  onClick={() => handleRSVP("maybe")}
                  disabled={rsvpLoading}
                  className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    userStatus === "maybe"
                      ? "bg-yellow-500 text-white"
                      : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                  } disabled:bg-gray-400`}
                >
                  🤔 Tal vez
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Attendees List */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            Asistentes ({event.attendeeCount})
          </h2>

          {event.attendees.length > 0 ? (
            <div className="space-y-4">
              {/* Attending */}
              {attendingCount > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-green-700 mb-2">✓ Confirmados ({attendingCount})</h3>
                  <div className="flex flex-wrap gap-2">
                    {event.attendees.filter(a => a.status === "attending").map((attendee) => (
                      <Link
                        key={attendee.id}
                        href={`/miembros/${attendee.graduateId}`}
                        className="flex items-center gap-2 p-2 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                      >
                        <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white text-xs font-bold">
                          {attendee.graduateName?.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm text-gray-900">{attendee.graduateName}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Maybe */}
              {maybeCount > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-yellow-700 mb-2">🤔 Tal vez ({maybeCount})</h3>
                  <div className="flex flex-wrap gap-2">
                    {event.attendees.filter(a => a.status === "maybe").map((attendee) => (
                      <Link
                        key={attendee.id}
                        href={`/miembros/${attendee.graduateId}`}
                        className="flex items-center gap-2 p-2 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors"
                      >
                        <div className="w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center text-white text-xs font-bold">
                          {attendee.graduateName?.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm text-gray-900">{attendee.graduateName}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">Aún no hay asistentes confirmados</p>
          )}
        </div>
      </div>
    </main>
  );
}
