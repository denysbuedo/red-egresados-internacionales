"use client";

import { PageHeader } from "@/components/PageHeader";

import { useCallback, useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { announceConnectionChange } from "@/components/ConnectionAction";

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
  const [actionName, setActionName] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const sequence=useRef(0), mutating=useRef(false), mounted=useRef(true);
  const fetchData=useCallback(async(silent=true,signal?:AbortSignal)=>{
    const version=++sequence.current;
    if(!silent)setLoading(true);
    try {
      const responses=await Promise.all(["pending","sent","accepted"].map(type=>fetch(`/api/connections?type=${type}`,{cache:"no-store",signal})));
      const denied=responses.find(response=>!response.ok);
      if(denied){
        if(denied.status===401){router.replace("/login?redirect=/conexiones");return;}
        if(denied.status===403){router.replace("/pendiente");return;}
        const body=await denied.json().catch(()=>({error:"No se pudo contactar con CONECTA."}));throw new Error(body.error||"No se pudieron consultar tus conexiones.");
      }
      const [pending,sent,contacts]=await Promise.all(responses.map(response=>response.json()));
      if(mounted.current && !signal?.aborted && version===sequence.current){setPendingRequests(pending);setSentRequests(sent);setFriends(contacts);}
    }catch(reason){if(mounted.current && !signal?.aborted && version===sequence.current)setError(reason instanceof Error?reason.message:"Revisa tu conexión e inténtalo de nuevo.");}
    finally{if(mounted.current && version===sequence.current)setLoading(false);}
  },[router]);
  const mutate=async(connectionId:number,action:"accept"|"reject"|"cancel")=>{
    if(mutating.current)return;
    mutating.current=true;++sequence.current;setActionLoading(connectionId);setActionName(action);setError("");setMessage("");
    try{
      const response=await fetch(action==="cancel"?`/api/connections?id=${connectionId}`:"/api/connections",{method:action==="cancel"?"DELETE":"PUT",headers:{"Content-Type":"application/json"},...(action==="cancel"?{}:{body:JSON.stringify({connectionId,action})})});
      const data=await response.json().catch(()=>({error:"No se pudo contactar con CONECTA. Inténtalo de nuevo."}));
      if(!response.ok){if(response.status===404||response.status===409)await fetchData();throw new Error(data.error||"No se pudo actualizar esta invitación.");}
      if(mounted.current){
        setPendingRequests(previous=>previous.filter(row=>row.id!==connectionId));setSentRequests(previous=>previous.filter(row=>row.id!==connectionId));
        setMessage(action==="accept"?"Invitación aceptada. La conexión ya aparece en Contactos.":action==="reject"?"Invitación rechazada.":"Solicitud cancelada.");
        await fetchData();
      }
      announceConnectionChange(data.profileIds);
    }catch(reason){if(mounted.current)setError(reason instanceof Error?reason.message:"Revisa tu conexión e inténtalo de nuevo.");}
    finally{mutating.current=false;if(mounted.current){setActionLoading(null);setActionName("");}}
  };
  useEffect(()=>{if(!message)return;const timer=setTimeout(()=>setMessage(""),6000);return()=>clearTimeout(timer);},[message]);
  const handleResponse=(id:number,action:"accept"|"reject")=>mutate(id,action);
  const handleCancelRequest=(id:number)=>mutate(id,"cancel");
  useEffect(()=>{
    mounted.current=true;const controller=new AbortController();void fetchData(false,controller.signal);
    const refresh=()=>{if(!mutating.current)void fetchData(true,controller.signal);};
    const interval=setInterval(refresh,30000);
    window.addEventListener("conecta:connections-changed",refresh);window.addEventListener("focus",refresh);
    return()=>{mounted.current=false;controller.abort();clearInterval(interval);window.removeEventListener("conecta:connections-changed",refresh);window.removeEventListener("focus",refresh);};
  },[fetchData]);


  return (
    <main className="ui-page min-h-screen bg-gray-50">
      <div className="ui-content ui-primary-content max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <PageHeader title="Mis Conexiones" description="Una conversación abre nuevas posibilidades. Construye tu red profesional." eyebrow="RELACIONES QUE GENERAN CONOCIMIENTO" />

        {error && <div className="connection-page-error"><p role="alert">{error}</p><button type="button" onClick={()=>{setError("");void fetchData(false);}}>Actualizar conexiones</button></div>}
        {message && <p role="status" className="connection-page-success">{message}</p>}
        {/* Tabs */}
        <div className="bg-white border border-gray-200 rounded-xl mb-6 overflow-hidden">
          <div className="ui-tabs flex border-b border-gray-200">
            <button
              aria-pressed={activeTab === "pending"} onClick={() => setActiveTab("pending")}
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
              aria-pressed={activeTab === "sent"} onClick={() => setActiveTab("sent")}
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
                Enviadas <span className="connection-tab-count">{sentRequests.length}</span>
              </div>
              {activeTab === "sent" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
              )}
            </button>
            <button
              aria-pressed={activeTab === "friends"} onClick={() => setActiveTab("friends")}
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
                Contactos <span className="connection-tab-count">{friends.length}</span>
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
                  <div key={request.id} className="ui-connection-row p-6 flex items-center justify-between gap-4">
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
                        disabled={actionLoading !== null}
                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                      >
                        {actionLoading === request.id && actionName === "reject" ? "Rechazando…" : "Rechazar"}
                      </button>
                      <button
                        onClick={() => handleResponse(request.id, "accept")}
                        disabled={actionLoading !== null}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                      >
                        {actionLoading === request.id && actionName === "accept" ? "Aceptando…" : "Aceptar"}
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
                  <div key={request.id} className="ui-connection-row p-6 flex items-center justify-between gap-4">
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
                      disabled={actionLoading !== null}
                      className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                    >
                      {actionLoading === request.id ? "Cancelando…" : "Cancelar"}
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
