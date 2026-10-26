"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface ConnectionRequest {
  id: number;
  senderId?: number;
  receiverId?: number;
  senderName?: string;
  senderPhoto?: string;
  senderProfession?: string;
  receiverName?: string;
  receiverPhoto?: string;
  receiverProfession?: string;
  createdAt: Date | null;
}

interface Friend {
  id: number;
  graduateId: number;
  name: string;
  photo: string | null;
  profession: string;
  country: string;
  university: string;
}

export default function ConnectionsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"pending" | "sent" | "friends">("pending");
  const [pendingRequests, setPendingRequests] = useState<ConnectionRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<ConnectionRequest[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  async function fetchData() {
    setLoading(true);
    try {
      if (activeTab === "pending") {
        const response = await fetch("/api/connections?type=pending");
        if (response.ok) {
          const data = await response.json();
          setPendingRequests(data);
        }
      } else if (activeTab === "sent") {
        const response = await fetch("/api/connections?type=sent");
        if (response.ok) {
          const data = await response.json();
          setSentRequests(data);
        }
      } else if (activeTab === "friends") {
        const response = await fetch("/api/connections?type=accepted");
        if (response.ok) {
          const data = await response.json();
          setFriends(data);
        }
      }
    } catch (error) {
      console.error("Error fetching connections:", error);
    } finally {
      setLoading(false);
    }
  }

  const handleResponse = async (connectionId: number, action: "accept" | "reject") => {
    setActionLoading(connectionId);
    try {
      const response = await fetch("/api/connections", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connectionId, action }),
      });

      if (response.ok) {
        fetchData();
      }
    } catch (error) {
      console.error("Error responding to connection:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelRequest = async (connectionId: number) => {
    setActionLoading(connectionId);
    try {
      const response = await fetch(`/api/connections?id=${connectionId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchData();
      }
    } catch (error) {
      console.error("Error canceling connection:", error);
    } finally {
      setActionLoading(null);
    }
  };

  useEffect(() => {
    // Verificar sesión y estado de aprobación
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          router.push("/login?redirect=/conexiones");
          return;
        }
        if (data.user?.status === "pending") {
          router.push("/pendiente");
          return;
        }
        fetchData();
      })
      .catch(() => {
        router.push("/login?redirect=/conexiones");
      });
  }, [activeTab]);


  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Mis Conexiones</h1>
          <p className="text-gray-600 mt-1">
            Construye tu red de contactos profesionales
          </p>
        </div>

        {/* Tabs */}
        <div className="bg-white border border-gray-200 rounded-xl mb-6 overflow-hidden">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab("pending")}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors relative ${
                activeTab === "pending"
                  ? "text-blue-600 bg-blue-50"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Solicitudes Recibidas
                {pendingRequests.length > 0 && (
                  <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {pendingRequests.length}
                  </span>
                )}
              </div>
              {activeTab === "pending" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
              )}
            </button>
            <button
              onClick={() => setActiveTab("sent")}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors relative ${
                activeTab === "sent"
                  ? "text-blue-600 bg-blue-50"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                Enviadas
              </div>
              {activeTab === "sent" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
              )}
            </button>
            <button
              onClick={() => setActiveTab("friends")}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors relative ${
                activeTab === "friends"
                  ? "text-blue-600 bg-blue-50"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Contactos
              </div>
              {activeTab === "friends" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
              )}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
          {loading ? (
            <div className="p-12 text-center">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-500">Cargando...</p>
            </div>
          ) : activeTab === "pending" ? (
            pendingRequests.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {pendingRequests.map((request) => (
                  <div key={request.id} className="p-6 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1">
                      <Link href={`/miembros/${request.senderId}`}>
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg shrink-0 overflow-hidden">
                          {request.senderPhoto ? (
                            <img src={request.senderPhoto} alt={request.senderName} className="w-full h-full object-cover" />
                          ) : (
                            request.senderName?.charAt(0).toUpperCase()
                          )}
                        </div>
                      </Link>
                      <div>
                        <Link href={`/miembros/${request.senderId}`}>
                          <h3 className="font-semibold text-gray-900 hover:text-blue-600 transition-colors">
                            {request.senderName}
                          </h3>
                        </Link>
                        <p className="text-sm text-gray-500">{request.senderProfession}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {request.createdAt
                            ? new Date(request.createdAt).toLocaleDateString("es-ES", {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                              })
                            : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleResponse(request.id, "reject")}
                        disabled={actionLoading === request.id}
                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                      >
                        Rechazar
                      </button>
                      <button
                        onClick={() => handleResponse(request.id, "accept")}
                        disabled={actionLoading === request.id}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                      >
                        {actionLoading === request.id ? "..." : "Aceptar"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  Sin solicitudes pendientes
                </h3>
                <p className="text-gray-500">
                  Cuando alguien te envíe una solicitud, aparecerá aquí
                </p>
              </div>
            )
          ) : activeTab === "sent" ? (
            sentRequests.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {sentRequests.map((request) => (
                  <div key={request.id} className="p-6 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1">
                      <Link href={`/miembros/${request.receiverId}`}>
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg shrink-0 overflow-hidden">
                          {request.receiverPhoto ? (
                            <img src={request.receiverPhoto} alt={request.receiverName} className="w-full h-full object-cover" />
                          ) : (
                            request.receiverName?.charAt(0).toUpperCase()
                          )}
                        </div>
                      </Link>
                      <div>
                        <Link href={`/miembros/${request.receiverId}`}>
                          <h3 className="font-semibold text-gray-900 hover:text-blue-600 transition-colors">
                            {request.receiverName}
                          </h3>
                        </Link>
                        <p className="text-sm text-gray-500">{request.receiverProfession}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {request.createdAt
                            ? new Date(request.createdAt).toLocaleDateString("es-ES", {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                              })
                            : ""}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleCancelRequest(request.id)}
                      disabled={actionLoading === request.id}
                      className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                    >
                      {actionLoading === request.id ? "..." : "Cancelar"}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  Sin solicitudes enviadas
                </h3>
                <p className="text-gray-500 mb-6">
                  Explora el directorio y conecta con otros miembros
                </p>
                <Link
                  href="/directorio"
                  className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  Ver Directorio
                </Link>
              </div>
            )
          ) : (
            friends.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-6">
                {friends.map((friend) => (
                  <Link
                    key={friend.graduateId}
                    href={`/miembros/${friend.graduateId}`}
                    className="flex items-center gap-4 p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
                  >
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white font-bold text-lg shrink-0 overflow-hidden">
                      {friend.photo ? (
                        <img src={friend.photo} alt={friend.name} className="w-full h-full object-cover" />
                      ) : (
                        friend.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-gray-900 truncate hover:text-green-600 transition-colors">
                        {friend.name}
                      </h3>
                      <p className="text-sm text-gray-500 truncate">{friend.profession}</p>
                      <p className="text-xs text-gray-400 truncate">{friend.country} · {friend.university}</p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  Aún no tienes contactos profesionales
                </h3>
                <p className="text-gray-500 mb-6">
                  Comienza a conectar con otros miembros
                </p>
                <Link
                  href="/directorio"
                  className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  Ver Directorio
                </Link>
              </div>
            )
          )}
        </div>
      </div>
    </main>
  );
}
