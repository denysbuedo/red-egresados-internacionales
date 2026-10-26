"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

interface GraduateCardProps {
  id: number;
  name: string;
  country: string;
  university: string;
  career: string;
  graduationYear: number;
  currentProfession: string;
  currentCompany?: string | null;
  photoUrl?: string | null;
}

export function GraduateCard({
  id,
  name,
  country,
  university,
  career,
  graduationYear,
  currentProfession,
  currentCompany,
  photoUrl,
}: GraduateCardProps) {
  const [connectionStatus, setConnectionStatus] = useState<
    "none" | "pending-sent" | "pending-received" | "connected" | "error"
  >("none");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  async function checkConnectionStatus() {
    setChecking(true);
    try {
      const response = await fetch(`/api/connections?check=${id}`);
      
      if (response.status === 401) {
        // No está logueado
        setConnectionStatus("none");
        setChecking(false);
        return;
      }
      
      if (response.ok) {
        const data = await response.json();
        setConnectionStatus(data.status || "none");
      } else {
        setConnectionStatus("none");
      }
    } catch (error) {
      console.error("Error checking connection:", error);
      setConnectionStatus("none");
    } finally {
      setChecking(false);
    }
  }

  const handleConnect = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiverId: id }),
      });

      const data = await response.json();

      if (response.ok) {
        setConnectionStatus("pending-sent");
      } else {
        // Mostrar error
        alert(data.error || "Error al enviar solicitud");
      }
    } catch (error) {
      console.error("Error sending connection:", error);
      alert("Error de conexión. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  useEffect(() => {
    checkConnectionStatus();
  }, [id]);


  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 hover:border-blue-300 hover:shadow-md transition-all group">
      <div className="flex items-start gap-4">
        <Link href={`/egresados/${id}`}>
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg shrink-0 overflow-hidden">
            {photoUrl ? (
              <img
                src={photoUrl}
                alt={name}
                className="w-full h-full object-cover"
              />
            ) : (
              initials
            )}
          </div>
        </Link>
        <div className="min-w-0 flex-1">
          <Link href={`/egresados/${id}`}>
            <h3 className="text-gray-900 font-semibold text-base group-hover:text-blue-600 transition-colors truncate">
              {name}
            </h3>
          </Link>
          <p className="text-gray-500 text-sm truncate">
            {currentProfession}
            {currentCompany && ` en ${currentCompany}`}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-md">
              <svg
                className="w-3 h-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              {country}
            </span>
            <span className="inline-flex items-center gap-1 text-xs bg-green-50 text-green-700 px-2 py-1 rounded-md">
              <svg
                className="w-3 h-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 14l9-5-9-5-9 5 9 5z"
                />
              </svg>
              {university}
            </span>
          </div>

          {/* Botón de conectar */}
          <div className="mt-3">
            {checking ? (
              <div className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 text-gray-400 text-sm rounded-lg">
                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : connectionStatus === "none" || connectionStatus === "error" ? (
              <button
                onClick={handleConnect}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                  />
                </svg>
                {loading ? "Enviando..." : "Conectar"}
              </button>
            ) : connectionStatus === "pending-sent" ? (
              <div className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-yellow-50 text-yellow-700 text-sm font-medium rounded-lg border border-yellow-200">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Solicitud enviada
              </div>
            ) : connectionStatus === "pending-received" ? (
              <div className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-purple-50 text-purple-700 text-sm font-medium rounded-lg border border-purple-200">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                Te invitó a conectar
              </div>
            ) : connectionStatus === "connected" ? (
              <div className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-green-50 text-green-700 text-sm font-medium rounded-lg border border-green-200">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Conectado
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
