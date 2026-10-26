"use client";

import { useState, useEffect } from "react";

interface PendingUser {
  id: number;
  username: string;
  email: string;
  role: string;
  status: string;
  createdAt: Date | null;
  graduateName: string | null;
  graduateUniversity: string | null;
  graduateCountry: string | null;
}

export default function ApprovalsPage() {
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  async function fetchPendingUsers() {
    try {
      const response = await fetch("/api/admin/approvals?status=pending");
      if (response.ok) {
        const data = await response.json();
        setPendingUsers(data);
      }
    } catch (error) {
      console.error("Error fetching pending users:", error);
    } finally {
      setLoading(false);
    }
  }

  const handleAction = async (userId: number, action: "approve" | "reject") => {
    if (action === "reject" && !rejectReason.trim()) {
      alert("Debe especificar un motivo de rechazo");
      return;
    }

    setActionLoading(true);
    try {
      const response = await fetch("/api/admin/approvals", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          action,
          reason: rejectReason,
        }),
      });

      if (response.ok) {
        setRejectReason("");
        setSelectedUser(null);
        fetchPendingUsers();
      }
    } catch (error) {
      console.error("Error updating user:", error);
    } finally {
      setActionLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingUsers();
  }, []);


  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Aprobación de Registros</h1>
        <p className="text-gray-500 mt-1">Revisa y aprueba las solicitudes de registro</p>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-4 border-[#003f8f] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Cargando solicitudes...</p>
        </div>
      ) : pendingUsers.length > 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Usuario</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Universidad</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">País</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Fecha</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {pendingUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{user.username}</div>
                    {user.graduateName && (
                      <div className="text-sm text-gray-500">{user.graduateName}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{user.graduateUniversity || "—"}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{user.graduateCountry || "—"}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString("es-ES") : "—"}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {selectedUser === user.id ? (
                      <div className="flex flex-col gap-2">
                        <textarea
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          placeholder="Motivo de rechazo..."
                          className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded text-sm resize-none"
                          rows={2}
                        />
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => { setSelectedUser(null); setRejectReason(""); }}
                            className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded"
                          >
                            Cancelar
                          </button>
                          <button
                            onClick={() => handleAction(user.id, "reject")}
                            disabled={actionLoading}
                            className="px-3 py-1.5 text-sm bg-red-600 hover:bg-red-700 text-white rounded disabled:bg-gray-400"
                          >
                            Rechazar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => setSelectedUser(user.id)}
                          className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded border border-red-200"
                        >
                          Rechazar
                        </button>
                        <button
                          onClick={() => handleAction(user.id, "approve")}
                          disabled={actionLoading}
                          className="px-3 py-1.5 text-sm bg-green-600 hover:bg-green-700 text-white rounded disabled:bg-gray-400"
                        >
                          Aprobar
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Todo al día</h3>
          <p className="text-gray-500">No hay solicitudes pendientes de aprobación</p>
        </div>
      )}
    </div>
  );
}
