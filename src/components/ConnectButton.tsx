"use client";

import { useState } from "react";

export function ConnectButton({ graduateId, graduateName }: { graduateId: number; graduateName: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const handleConnect = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiverId: graduateId }),
      });

      const data = await response.json();

      if (response.ok) {
        setSent(true);
      } else {
        setError(data.error || "Error al enviar solicitud");
      }
    } catch (err) {
      setError("Error de conexión. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="px-6 py-3 bg-yellow-50 text-yellow-700 rounded-lg font-medium border border-yellow-200">
        ✓ Solicitud enviada
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={handleConnect}
        disabled={loading}
        className="px-6 py-3 bg-[#102B46] hover:bg-[#0C1D30] disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
      >
        {loading ? "Enviando..." : "Enviar Solicitud"}
      </button>
      {error && (
        <p className="text-red-600 text-sm mt-2">{error}</p>
      )}
    </div>
  );
}
