"use client";

import { useState } from "react";
import Link from "next/link";
import { postTypeLabel } from "@/lib/site";
import { PostImage } from "./PostImage";
import { PostComments } from "./PostComments";

interface UserPostCardProps {
  showCommentsInitially?:boolean;
  id: number;
  content: string;
  imageUrl: string | null;
  postType?: string;
  referenceUrl?: string | null;
  likes: number;
  commentsCount: number;
  createdAt: Date | null;
  graduateId: number;
  graduateName: string;
  graduatePhoto: string | null;
  graduateProfession: string;
  graduateCountry: string;
}

export function UserPostCard({
  showCommentsInitially=false,
  id,
  content,
  imageUrl,
  postType,
  referenceUrl,
  commentsCount,
  createdAt,
  graduateId,
  graduateName,
  graduatePhoto,
  graduateProfession,
  graduateCountry,
}: UserPostCardProps) {
  const [isExpanded, setIsExpanded] = useState(showCommentsInitially);
  const [showComments, setShowComments] = useState(showCommentsInitially);
  const [localCommentsCount, setLocalCommentsCount] = useState(commentsCount);


  const PREVIEW_LENGTH = 300;
  const shouldTruncate = content.length > PREVIEW_LENGTH;
  const displayContent = isExpanded || !shouldTruncate ? content : content.slice(0, PREVIEW_LENGTH) + "...";

  const formattedDate = createdAt
    ? new Date(createdAt).toLocaleDateString("es-ES", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "N/A";

  const initials = graduateName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <article className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
      <div className="border-b border-blue-100 bg-blue-50 px-5 py-2 text-xs font-semibold text-blue-800">{postTypeLabel(postType)}</div>
      {/* Header del post */}
      <div className="p-5 border-b border-gray-100">
        <div className="flex items-start gap-3">
          <Link href={`/miembros/${graduateId}`}>
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#102B46] to-[#2776C9] flex items-center justify-center text-white font-bold text-sm shrink-0 overflow-hidden">
              {graduatePhoto ? (
                <img src={graduatePhoto} alt={graduateName} className="w-full h-full object-cover" />
              ) : (
                initials
              )}
            </div>
          </Link>
          <div className="flex-1 min-w-0">
            <Link href={`/miembros/${graduateId}`}>
              <h3 className="font-semibold text-gray-900 hover:text-[#102B46] transition-colors">
                {graduateName}
              </h3>
            </Link>
            <p className="text-sm text-gray-500 truncate">
              {graduateProfession || "Miembro"}
            </p>
            <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
              <span>{formattedDate}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {graduateCountry}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido del post */}
      <div className="p-5">
        <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
          {displayContent}
        </p>
        {shouldTruncate && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-2 text-[#102B46] hover:text-[#0C1D30] font-medium text-sm transition-colors"
          >
            {isExpanded ? "Mostrar menos" : "Leer más"}
          </button>
        )}

        {/* Imagen */}
        {imageUrl && <div className="mt-4 overflow-hidden rounded-xl"><PostImage src={imageUrl} alt="Imagen adjunta al aporte" /></div>}

        {referenceUrl && /^https?:\/\//i.test(referenceUrl) && <div className="mt-4">
          <a href={referenceUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-blue-800 underline">Consultar recurso original ↗</a>
        </div>}
        {/* Stats y acciones */}
        <div className="flex items-center justify-between mt-5 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-4 text-sm text-gray-500">
            {localCommentsCount > 0 && (
              <span className="flex items-center gap-1">
                <span>💬</span>
                {localCommentsCount}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => setShowComments(!showComments)} className="rounded-lg px-3 py-1.5 text-sm font-medium text-blue-800 hover:bg-blue-50">
              {showComments ? "Cerrar conversación" : "Conversar sobre este aporte"}
            </button>
          </div>
        </div>
      </div>

      {/* Comentarios */}
      {showComments && (
        <div className="px-5 pb-5">
          <PostComments 
            postId={id} 
            currentGraduateId={graduateId}
            onCountChange={setLocalCommentsCount}
          />
        </div>
      )}
      {!showComments && localCommentsCount > 0 && (
        <div className="px-5 pb-5">
          <button
            onClick={() => setShowComments(true)}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            💬 Ver {localCommentsCount} {localCommentsCount === 1 ? 'comentario' : 'comentarios'}
          </button>
        </div>
      )}
    </article>
  );
}
