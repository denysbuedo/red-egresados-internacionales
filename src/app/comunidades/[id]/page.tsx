"use client";

import { PageHeader } from "@/components/PageHeader";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface GroupDetail {
  id: number;
  name: string;
  description: string;
  type: string;
  category: string | null;
  creatorName: string | null;
  memberCount: number;
  members: Member[];
  posts: GroupPost[];
}

interface Member {
  id: number;
  graduateId: number;
  graduateName: string;
  graduatePhoto: string | null;
  graduateProfession: string;
  role: string;
}

interface GroupPost {
  id: number;
  content: string;
  createdAt: Date | null;
  graduateId: number;
  graduateName: string;
  graduatePhoto: string | null;
  graduateProfession: string;
}

export default function GroupDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [groupId, setGroupId] = useState<string>("");
  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMember, setIsMember] = useState(false);
  const [isCreator, setCreator] = useState(false);
  const [newPost, setNewPost] = useState("");
  const [posting, setPosting] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editData, setEditData] = useState({ name: "", description: "", category: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function checkMembership() {
    try {
      const response = await fetch("/api/auth/me");
      if (response.ok) {
        const data = await response.json();
        if (data.graduate) {
          // Check membership from group data
        }
      }
    } catch (error) {
      console.error("Error checking membership:", error);
    }
  }

  async function fetchGroup(id: string) {
    setLoading(true);
    try {
      const response = await fetch(`/api/groups?id=${id}`);
      if (response.ok) {
        const data = await response.json();
        setGroup(data);
        setEditData({
          name: data.name,
          description: data.description,
          category: data.category || "",
        });

        // Check if current user is member
        const authResponse = await fetch("/api/auth/me");
        if (authResponse.ok) {
          const authData = await authResponse.json();
          if (authData.graduate) {
            const currentGraduateId = authData.graduate.id;
            const isMemberCheck = data.members?.some((m: Member) => m.graduateId === currentGraduateId);
            setIsMember(!!isMemberCheck);
            setCreator(data.creatorId === currentGraduateId);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching group:", error);
    } finally {
      setLoading(false);
    }
  }

  const handleJoin = async () => {
    try {
      const response = await fetch("/api/groups", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupId: parseInt(groupId), action: "join" }),
      });

      if (response.ok) {
        fetchGroup(groupId);
      }
    } catch (error) {
      console.error("Error joining group:", error);
    }
  };

  const handleLeave = async () => {
    if (!confirm("¿Estás seguro de que quieres salir del grupo?")) return;

    try {
      const response = await fetch("/api/groups", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupId: parseInt(groupId), action: "leave" }),
      });

      if (response.ok) {
        fetchGroup(groupId);
      }
    } catch (error) {
      console.error("Error leaving group:", error);
    }
  };

  const handleCreatePost = async () => {
    if (!newPost.trim() || newPost.length < 5) return;

    setPosting(true);
    setError("");

    try {
      const response = await fetch(`/api/groups/${groupId}/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newPost }),
      });

      if (response.ok) {
        setNewPost("");
        fetchGroup(groupId);
      } else {
        const data = await response.json();
        setError(data.error || "Error al publicar");
      }
    } catch (error) {
      setError("Error de conexión");
    } finally {
      setPosting(false);
    }
  };

  const handleEditGroup = async () => {
    setSaving(true);
    setError("");

    try {
      const response = await fetch("/api/groups", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: parseInt(groupId),
          ...editData,
        }),
      });

      if (response.ok) {
        setShowEditForm(false);
        fetchGroup(groupId);
      } else {
        const data = await response.json();
        setError(data.error || "Error al editar");
      }
    } catch (error) {
      setError("Error de conexión");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    params.then(p => {
      setGroupId(p.id);
      fetchGroup(p.id);
      checkMembership();
    });
  }, [params]);


  if (loading) {
    return (
      <main className="ui-page min-h-screen bg-gray-50">
        <div className="ui-content max-w-6xl mx-auto px-4 py-8 text-center">
          <div className="w-8 h-8 border-4 border-[#102B46] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Cargando grupo...</p>
        </div>
      </main>
    );
  }

  if (!group) {
    return (
      <main className="ui-page min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
            <PageHeader title="Grupo no encontrado" description="Este espacio no existe o ya no está disponible." eyebrow="CONECTA · SIGAMOS EXPLORANDO" compact />
            <Link href="/comunidades" className="text-[#102B46] hover:underline">
              ← Volver a comunidades
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="ui-page min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <PageHeader title={group.name} description="Un espacio para compartir experiencias, preguntas y nuevas iniciativas." eyebrow="COMUNIDADES · CONOCIMIENTO EN COMÚN" />
        <div className="mb-6">
          <Link href="/comunidades" className="text-[#102B46] hover:underline text-sm font-medium">
            ← Volver a comunidades
          </Link>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar - Info del grupo */}
          <aside className="lg:w-80 shrink-0">
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm sticky top-24">
              <div className="flex items-start justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">{group.name}</h2>
                {isCreator && (
                  <button
                    onClick={() => setShowEditForm(!showEditForm)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                )}
              </div>

              {showEditForm ? (
                <div className="space-y-3 mb-6">
                  <input
                    type="text"
                    value={editData.name}
                    onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm"
                    placeholder="Nombre del grupo"
                  />
                  <textarea
                    value={editData.description}
                    onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm resize-none"
                    rows={3}
                    placeholder="Descripción"
                  />
                  <input
                    type="text"
                    value={editData.category}
                    onChange={(e) => setEditData({ ...editData, category: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm"
                    placeholder="Categoría (opcional)"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleEditGroup}
                      disabled={saving}
                      className="flex-1 px-3 py-2 bg-[#102B46] text-white rounded-lg text-sm font-medium disabled:bg-gray-400"
                    >
                      {saving ? "..." : "Guardar"}
                    </button>
                    <button
                      onClick={() => setShowEditForm(false)}
                      className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-gray-600 mb-4 whitespace-pre-wrap">{group.description}</p>
              )}

              {group.category && (
                <p className="text-sm text-gray-500 mb-4">📍 {group.category}</p>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <span className="text-sm text-gray-500">
                  {group.memberCount} {group.memberCount === 1 ? "miembro" : "miembros"}
                </span>
                {isMember ? (
                  <button
                    onClick={handleLeave}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                  >
                    Salir del grupo
                  </button>
                ) : (
                  <button
                    onClick={handleJoin}
                    className="px-4 py-2 bg-[#102B46] hover:bg-[#0C1D30] text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    Unirse al grupo
                  </button>
                )}
              </div>

              {/* Miembros */}
              <div className="mt-6 pt-6 border-t border-gray-100">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                  Miembros ({group.members?.length || 0})
                </h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {group.members?.map((member) => (
                    <Link
                      key={member.id}
                      href={`/miembros/${member.graduateId}`}
                      className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {member.graduateName?.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate">{member.graduateName}</p>
                        {member.role === "admin" && (
                          <span className="text-xs text-teal-600">Creador</span>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* Contenido Principal */}
          <div className="flex-1 min-w-0 space-y-6">
            {/* Crear Post */}
            {isMember && (
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Publicar en el grupo</h3>
                <textarea
                  value={newPost}
                  onChange={(e) => setNewPost(e.target.value)}
                  placeholder="Comparte algo con el grupo..."
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#102B46] resize-none min-h-[100px]"
                  maxLength={2000}
                  disabled={posting}
                />
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs text-gray-400">{newPost.length} / 2000</span>
                  <button
                    onClick={handleCreatePost}
                    disabled={posting || !newPost.trim() || newPost.length < 5}
                    className="px-6 py-2.5 bg-[#102B46] hover:bg-[#0C1D30] disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    {posting ? "Publicando..." : "Publicar"}
                  </button>
                </div>
              </div>
            )}

            {/* Posts */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Publicaciones ({group.posts?.length || 0})
              </h2>

              {group.posts?.length > 0 ? (
                <div className="space-y-4">
                  {group.posts.map((post) => (
                    <div key={post.id} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                      <div className="flex items-start gap-3 mb-3">
                        <Link href={`/miembros/${post.graduateId}`}>
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#102B46] to-[#2776C9] flex items-center justify-center text-white text-sm font-bold shrink-0">
                            {post.graduateName?.charAt(0).toUpperCase()}
                          </div>
                        </Link>
                        <div>
                          <Link href={`/miembros/${post.graduateId}`} className="font-semibold text-gray-900 hover:text-[#102B46]">
                            {post.graduateName}
                          </Link>
                          <p className="text-xs text-gray-500">
                            {post.createdAt
                              ? new Date(post.createdAt).toLocaleDateString("es-ES", {
                                  day: "numeric",
                                  month: "short",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : ""}
                          </p>
                        </div>
                      </div>
                      <p className="text-gray-800 whitespace-pre-wrap">{post.content}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">
                    {isMember ? "Sé el primero en publicar" : "Únete para ver las publicaciones"}
                  </h3>
                  <p className="text-gray-500">
                    {isMember ? "Comparte algo con el grupo" : "Los miembros pueden ver y publicar en este grupo"}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
