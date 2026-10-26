"use client";
import { useEffect, useState } from "react";

export function PendingStatus() {
  const [error, setError] = useState("");
  async function check() {
    try {
      const response = await fetch("/api/auth/me", { cache: "no-store" });
      if (response.status === 401) { window.location.replace("/login"); return; }
      if (!response.ok) throw new Error("request");
      const data = await response.json();
      if (data.user.status === "approved") window.location.replace("/");
      else setError("Tu solicitud sigue pendiente. Te daremos acceso cuando sea aprobada.");
    } catch { setError("No se pudo consultar el estado. Intenta nuevamente."); }
  }
  useEffect(() => {
    const timer = setInterval(check, 15000);
    return () => clearInterval(timer);
  }, []);
  return (
    <div>
      <p aria-live="polite" className="mb-4 text-sm text-gray-600">{error}</p>
      <div className="flex flex-wrap gap-3">
        <button onClick={check} className="rounded-lg bg-blue-800 px-4 py-2 text-white">Consultar estado</button>
        <button onClick={async () => {
          const response = await fetch("/api/auth/logout", { method: "POST" });
          if (response.ok) window.location.replace("/login");
          else setError("No se pudo cerrar la sesión. Intenta nuevamente.");
        }} className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700">Cerrar sesión</button>
      </div>
    </div>
  );
}
