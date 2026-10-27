"use client";

import { PageHeader } from "@/components/PageHeader";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Group {
  id: number;
  name: string;
  description: string;
  type: "university" | "career" | "country" | "interest";
  category: string | null;
  creatorName: string | null;
  memberCount: number;
  isMember: boolean;
  canEdit: boolean;
}

export default function CommunitiesPage() {
  const router = useRouter();
  const [groups, setGroups] = useState<Group[]>([]);
  const joinLock = useRef(false), fetchSequence = useRef(0);
  const [joining,setJoining] = useState<number|null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newGroup, setNewGroup] = useState({
    name: "",
    description: "",
    type: "interest" as Group["type"],
    category: "",
  });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  async function fetchGroups() {
    const version=++fetchSequence.current;
    try {
      const url = filter === "all" ? "/api/groups" : `/api/groups?type=${filter}`;
      const response = await fetch(url,{cache:"no-store"});
      if (response.ok) {
        const data = await response.json();
        if(version===fetchSequence.current)setGroups(data);
      } else { setError("No se pudieron cargar las comunidades."); }
    } catch (error) {
      console.error("Error fetching groups:", error);
    } finally {
      if(version===fetchSequence.current)setLoading(false);
    }
  }

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError("");

    try {
      const response = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newGroup),
      });

      const data = await response.json();

      if (response.ok) {
        setShowCreateForm(false);
        setNewGroup({ name: "", description: "", type: "interest", category: "" });
        fetchGroups();
      } else {
        setError(data.error || "Error al crear grupo");
      }
    } catch (err) {
      setError("Error de conexión. Intenta nuevamente.");
    } finally {
      setCreating(false);
    }
  };

  const handleJoinGroup = async (groupId: number) => {
    if(joinLock.current)return;joinLock.current=true;++fetchSequence.current;setJoining(groupId);setError("");
    try {
      const response = await fetch("/api/groups", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupId, action: "join" }),
      });

      const data=await response.json();
      if(!response.ok)throw new Error(data.error || "No se pudo unir a la comunidad.");
      setGroups(previous=>previous.map(group=>group.id===groupId?{...group,isMember:true,memberCount:group.memberCount+(group.isMember?0:1)}:group));
    } catch (reason) { setError(reason instanceof Error?reason.message:"Revisa tu conexión e inténtalo de nuevo."); }
    finally {joinLock.current=false;setJoining(null);}
  };

  const typeLabels = {
    university: "Institución",
    career: "Área de conocimiento",
    country: "País",
    interest: "Interés",
  };

  const typeColors = {
    university: "bg-teal-50 text-teal-700 border-teal-200",
    career: "bg-blue-50 text-blue-700 border-blue-200",
    country: "bg-green-50 text-green-700 border-green-200",
    interest: "bg-teal-50 text-teal-700 border-teal-200",
  };

  useEffect(() => {
    // Verificar sesión y estado de aprobación
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          router.push("/login?redirect=/comunidades");
          return;
        }
        if (data.user?.status === "pending") {
          router.push("/pendiente");
          return;
        }
        fetchGroups();
      })
      .catch(() => {
        router.push("/login?redirect=/comunidades");
      });
  }, [filter]);


  return (
    <main className="ui-page min-h-screen bg-gray-50">
      <div className="ui-content ui-primary-content max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <PageHeader title="Comunidades" description="Encuentra tu espacio para intercambiar conocimiento y desarrollar ideas en común." eyebrow="ESPACIOS PARA COLABORAR" actions={<button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="px-4 py-2 bg-[#102B46] hover:bg-[#0C1D30] text-white rounded-lg text-sm font-medium transition-colors"
          >
            + Crear Grupo
          </button>} />

        {error && !showCreateForm && <p role="alert" className="connection-page-error">{error}</p>}
        {/* Formulario crear grupo */}
        {showCreateForm && (
          <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Crear Nuevo Grupo</h2>
            
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}
            
            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                <input
                  type="text"
                  value={newGroup.name}
                  onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#102B46]"
                  placeholder="Ej: Comunidad de Ciencias de la Salud"
                  required
                  minLength={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción *</label>
                <textarea
                  value={newGroup.description}
                  onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#102B46] resize-none"
                  placeholder="Describe el propósito del grupo..."
                  required
                  minLength={10}
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo *</label>
                  <select
                    value={newGroup.type}
                    onChange={(e) => setNewGroup({ ...newGroup, type: e.target.value as Group["type"] })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#102B46]"
                  >
                    <option value="university">Institución</option>
                    <option value="career">Carrera</option>
                    <option value="country">País</option>
                    <option value="interest">Interés</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                  <input
                    type="text"
                    value={newGroup.category}
                    onChange={(e) => setNewGroup({ ...newGroup, category: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#102B46]"
                    placeholder="Ej: Universidad de La Habana"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={creating}
                  className="px-6 py-2.5 bg-[#102B46] hover:bg-[#0C1D30] disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
                >
                  {creating ? "Creando..." : "Crear Grupo"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Filtros */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
          {["all", "university", "career", "country", "interest"].map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                filter === type
                  ? "bg-[#102B46] text-white"
                  : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              {type === "all" ? "Todos" : typeLabels[type as keyof typeof typeLabels]}
            </button>
          ))}
        </div>

        {/* Lista de grupos */}
        {loading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-4 border-[#102B46] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-500">Cargando grupos...</p>
          </div>
        ) : groups.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groups.map((group) => (
              <Link
                key={group.id}
                href={`/comunidades/${group.id}`}
                className="block bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-bold text-gray-900 flex-1">
                      {group.name}
                    </h3>
                    <span className={`text-xs px-2 py-1 rounded-full border ${typeColors[group.type]}`}>
                      {typeLabels[group.type]}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {group.description}
                  </p>
                  {group.category && (
                    <p className="text-xs text-gray-500 mb-3">
                      {group.category}
                    </p>
                  )}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <span className="text-sm text-gray-500">
                      {group.memberCount} {group.memberCount === 1 ? "miembro" : "miembros"}
                    </span>
                    {group.isMember ? <span className="community-membership">Ya eres miembro</span> : <button
                      disabled={joining!==null}
                      onClick={(e) => {
                        e.preventDefault();
                        handleJoinGroup(group.id);
                      }}
                      className="px-4 py-2 bg-[#102B46] hover:bg-[#0C1D30] text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      {joining===group.id?"Uniéndote…":"Unirse"}
                    </button>}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              No hay grupos aún
            </h3>
            <p className="text-gray-500 mb-6">
              Sé el primero en crear una comunidad
            </p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-6 py-3 bg-[#102B46] hover:bg-[#0C1D30] text-white rounded-lg font-medium transition-colors"
            >
              Crear Primer Grupo
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
