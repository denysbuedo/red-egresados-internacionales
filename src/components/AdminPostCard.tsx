"use client";

import { useState, useEffect } from "react";

interface AdminPostCardProps {
  id: number;
  title: string;
  content: string;
  imageUrl: string | null;
  authorName: string;
  createdAt: Date | null;
}

// ~4-5 oraciones o 500 caracteres
const PREVIEW_LENGTH = 500;

const REACTION_TYPES = [
  { type: "like", emoji: "👍", label: "Me gusta" },
  { type: "love", emoji: "❤️", label: "Me encanta" },
  { type: "celebrate", emoji: "🎉", label: "Celebrar" },
  { type: "insightful", emoji: "💡", label: "Interesante" },
] as const;

interface Reactions {
  like: number;
  love: number;
  celebrate: number;
  insightful: number;
  userReaction: string | null;
}

export function AdminPostCard({
  id,
  title,
  content,
  imageUrl,
  authorName,
  createdAt,
}: AdminPostCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [reactions, setReactions] = useState<Reactions>({
    like: 0,
    love: 0,
    celebrate: 0,
    insightful: 0,
    userReaction: null,
  });
  const [loading, setLoading] = useState(false);

  async function fetchReactions() {
    try {
      const response = await fetch(`/api/posts/reactions?postId=${id}`);
      if (response.ok) {
        const data = await response.json();
        setReactions(data);
      }
    } catch (error) {
      console.error("Error fetching reactions:", error);
    }
  }

  const handleReaction = async (reactionType: string) => {
    if (loading) return;
    setLoading(true);

    try {
      const response = await fetch("/api/posts/reactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId: id, reactionType }),
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.success) {
          // Actualizar estado localmente
          setReactions(prev => {
            const newReactions = { ...prev } as any;
            const rType = reactionType as keyof Reactions;
            
            // Si quitó la reacción
            if (data.action === "removed") {
              newReactions[rType] = Math.max(0, (newReactions[rType] as number) - 1);
              newReactions.userReaction = null;
            }
            // Si actualizó a una nueva reacción
            else if (data.action === "updated") {
              // Quitar la anterior
              if (prev.userReaction) {
                const prevType = prev.userReaction as keyof Reactions;
                newReactions[prevType] = Math.max(0, (newReactions[prevType] as number) - 1);
              }
              // Añadir la nueva
              newReactions[rType] = (newReactions[rType] as number || 0) + 1;
              newReactions.userReaction = reactionType;
            }
            // Si es nueva reacción
            else if (data.action === "created") {
              newReactions[rType] = (newReactions[rType] as number || 0) + 1;
              newReactions.userReaction = reactionType;
            }
            
            return newReactions as Reactions;
          });
        }
      }
    } catch (error) {
      console.error("Error adding reaction:", error);
    } finally {
      setLoading(false);
      setShowReactions(false);
    }
  };

  const getUserReactionEmoji = () => {
    if (!reactions.userReaction) return null;
    const reaction = REACTION_TYPES.find(r => r.type === reactions.userReaction);
    return reaction?.emoji;
  };

  const shouldTruncate = content.length > PREVIEW_LENGTH;
  const displayContent = isExpanded || !shouldTruncate 
    ? content 
    : content.slice(0, PREVIEW_LENGTH) + "...";

  const formattedDate = createdAt
    ? new Date(createdAt).toLocaleDateString("es-ES", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "N/A";

  const totalReactions = reactions.like + reactions.love + reactions.celebrate + reactions.insightful;

  useEffect(() => {
    fetchReactions();
  }, [id]);


  return (
    <article className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {/* Imagen con tratamiento mejorado */}
      {imageUrl && (
        <div className="relative w-full bg-gradient-to-br from-gray-100 to-gray-200">
          <div className="relative w-full" style={{ paddingBottom: "56.25%" }}> {/* 16:9 aspect ratio */}
            <img
              src={imageUrl}
              alt={title}
              className="absolute inset-0 w-full h-full object-contain p-4"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
                const parent = (e.target as HTMLImageElement).parentElement;
                if (parent) {
                  parent.innerHTML = `
                    <div class="absolute inset-0 flex items-center justify-center text-gray-400">
                      <svg class="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  `;
                }
              }}
            />
          </div>
        </div>
      )}

      {/* Contenido */}
      <div className="p-6">
        {/* Título */}
        <h3 className="text-xl font-bold text-gray-900 mb-3">
          {title}
        </h3>

        {/* Texto con leer más */}
        <div className="mb-4">
          <p className="text-gray-600 leading-relaxed text-base">
            {displayContent}
          </p>
          {shouldTruncate && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="mt-2 text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors"
            >
              {isExpanded ? "Mostrar menos" : "Leer más"}
            </button>
          )}
        </div>

        {/* Reacciones */}
        <div className="mb-4">
          {/* Contador de reacciones */}
          {totalReactions > 0 && (
            <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-100">
              <div className="flex -space-x-1">
                {reactions.like > 0 && (
                  <span className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs border-2 border-white">👍</span>
                )}
                {reactions.love > 0 && (
                  <span className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center text-xs border-2 border-white">❤️</span>
                )}
                {reactions.celebrate > 0 && (
                  <span className="w-6 h-6 rounded-full bg-yellow-100 flex items-center justify-center text-xs border-2 border-white">🎉</span>
                )}
                {reactions.insightful > 0 && (
                  <span className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center text-xs border-2 border-white">💡</span>
                )}
              </div>
              <span className="text-sm text-gray-500">
                {totalReactions} {totalReactions === 1 ? 'reacción' : 'reacciones'}
              </span>
            </div>
          )}

          {/* Botón y selector de reacciones */}
          <div className="relative">
            <button
              onClick={() => setShowReactions(!showReactions)}
              disabled={loading}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors disabled:opacity-50 ${
                reactions.userReaction 
                  ? 'bg-blue-50 text-blue-600' 
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              {getUserReactionEmoji() ? (
                <span className="text-lg">{getUserReactionEmoji()}</span>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                </svg>
              )}
              <span className="text-sm font-medium">{loading ? "..." : "Reaccionar"}</span>
            </button>

            {/* Selector de reacciones */}
            {showReactions && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowReactions(false)}
                />
                <div className="absolute bottom-full left-0 mb-2 bg-white border border-gray-200 rounded-full shadow-lg p-2 flex gap-1 z-20 animate-in fade-in slide-in-from-bottom-2 duration-200">
                  {REACTION_TYPES.map((reaction) => (
                    <button
                      key={reaction.type}
                      onClick={() => handleReaction(reaction.type)}
                      disabled={loading}
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-xl transition-transform hover:scale-125 disabled:opacity-50 disabled:hover:scale-100 ${
                        reactions.userReaction === reaction.type
                          ? 'bg-blue-100 ring-2 ring-blue-500'
                          : 'hover:bg-gray-100'
                      }`}
                      title={reaction.label}
                    >
                      {reaction.emoji}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Autor y fecha */}
        <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
            {authorName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-700">{authorName}</p>
            <p className="text-xs text-gray-500">{formattedDate}</p>
          </div>
        </div>
      </div>
    </article>
  );
}
