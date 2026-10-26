"use client";

import { useState, useEffect } from "react";

interface PostCommentsProps {
  postId: number;
  currentGraduateId?: number;
  onCountChange?: (count: number) => void;
}

interface Comment {
  id: number;
  content: string;
  createdAt: Date | null;
  graduateId: number;
  graduateName: string;
  graduatePhoto: string | null;
  graduateProfession: string;
}

export function PostComments({ postId, currentGraduateId, onCountChange }: PostCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [commentLimit, setCommentLimit] = useState<{
    canComment: boolean;
    commentsToday: number;
    dailyLimit: number;
    remaining: number;
  } | null>(null);

  async function fetchComments() {
    try {
      const response = await fetch(`/api/posts/${postId}/comments`);
      if (response.ok) {
        const data = await response.json();
        setComments(data);
        if (onCountChange) {
          onCountChange(data.length);
        }
      }
    } catch (error) {
      console.error("Error fetching comments:", error);
    }
  }

  async function fetchCommentLimit() {
    try {
      const response = await fetch("/api/posts/limit");
      if (response.ok) {
        const data = await response.json();
        // Usamos el mismo endpoint pero con lógica diferente
        // Por ahora asumimos que puede comentar
        setCommentLimit({
          canComment: true,
          commentsToday: 0,
          dailyLimit: 10,
          remaining: 10,
        });
      }
    } catch (error) {
      console.error("Error fetching comment limit:", error);
    }
  }

  const handleSubmit = async () => {
    if (!newComment.trim() || newComment.trim().length < 2) return;
    if (newComment.length > 500) return;

    setLoading(true);

    try {
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newComment.trim() }),
      });

      const data = await response.json();

      if (response.ok) {
        setNewComment("");
        fetchComments();
      } else {
        alert(data.error || "Error al comentar");
      }
    } catch (error) {
      console.error("Error creating comment:", error);
      alert("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (commentId: number) => {
    try {
      const response = await fetch(`/api/posts/${postId}/comments?commentId=${commentId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchComments();
      }
    } catch (error) {
      console.error("Error deleting comment:", error);
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "";
    return new Date(date).toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  useEffect(() => {
    fetchComments();
    fetchCommentLimit();
  }, []);


  return (
    <div className="mt-4 pt-4 border-t border-gray-100">
      {/* Lista de comentarios */}
      {comments.length > 0 && (
        <div className="space-y-3 mb-4">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                {comment.graduateName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="bg-gray-50 rounded-lg px-4 py-2">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-gray-900">
                      {comment.graduateName}
                    </span>
                    <span className="text-xs text-gray-400">
                      {formatDate(comment.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {comment.content}
                  </p>
                </div>
                {currentGraduateId === comment.graduateId && (
                  <button
                    onClick={() => handleDelete(comment.id)}
                    className="text-xs text-gray-400 hover:text-red-600 mt-1 transition-colors"
                  >
                    Eliminar
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Formulario para agregar comentario */}
      <div className="flex gap-3">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#003f8f] to-[#0050b8] flex items-center justify-center text-white text-xs font-bold shrink-0">
          T
        </div>
        <div className="flex-1">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Escribe un comentario..."
            className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#003f8f] resize-none min-h-[60px]"
            maxLength={500}
            disabled={loading}
          />
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-gray-400">
              {newComment.length} / 500
            </span>
            <button
              onClick={handleSubmit}
              disabled={loading || !newComment.trim() || newComment.length < 2}
              className="px-4 py-1.5 bg-[#003f8f] hover:bg-[#002860] disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
            >
              {loading ? "..." : "Comentar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
