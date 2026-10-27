"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

type Status = "loading"|"none"|"pending-sent"|"pending-received"|"connected"|"self"|"no-profile"|"error";
type State = { status:Status; connectionId:number|null; profileIds?:number[] };
const statuses:Status[]=["none","pending-sent","pending-received","connected","self","no-profile"];
export function announceConnectionChange(profileIds?:number[]) { window.dispatchEvent(new CustomEvent("conecta:connections-changed",{detail:{profileIds}})); }

export function ConnectionAction({ graduateId, isOwn=false, compact=false }: { graduateId:number; isOwn?:boolean; compact?:boolean }) {
  const [state,setState]=useState<State>({status:isOwn?"self":"loading",connectionId:null});
  const [action,setAction]=useState<string|null>(null);
  const [error,setError]=useState("");
  const busy=useRef(false),sequence=useRef(0),mounted=useRef(true);
  const router=useRouter(),pathname=usePathname();
  const load=useCallback(async(signal?:AbortSignal)=>{
    const version=++sequence.current;
    try {
      const response=await fetch(`/api/connections?check=${graduateId}`,{cache:"no-store",signal});
      const data=await response.json().catch(()=>({error:"No se pudo contactar con CONECTA. Inténtalo de nuevo."}));
      if(!response.ok)throw new Error(data.error||"No se pudo consultar la conexión.");
      if(!statuses.includes(data.status))throw new Error("No se pudo consultar el estado de la conexión.");
      if(mounted.current && !signal?.aborted && version===sequence.current && !busy.current){setState(data);setError("");}
    }catch(reason){
      if(!signal?.aborted && mounted.current && version===sequence.current && !busy.current){setState(previous=>previous.status==="loading"?{...previous,status:"error"}:previous);setError(reason instanceof Error?reason.message:"No se pudo consultar la conexión.");}
    }
  },[graduateId]);
  useEffect(()=>{
    mounted.current=true;const controller=new AbortController();
    if(!isOwn)void load(controller.signal);
    const refresh=(event:Event)=>{
      const ids=(event as CustomEvent<{profileIds?:number[]}>).detail?.profileIds;
      if(!isOwn && !busy.current && (!ids || ids.includes(graduateId)))void load(controller.signal);
    };
    const focus=()=>{if(!isOwn && !busy.current)void load(controller.signal);};
    window.addEventListener("conecta:connections-changed",refresh);window.addEventListener("focus",focus);
    return()=>{mounted.current=false;controller.abort();window.removeEventListener("conecta:connections-changed",refresh);window.removeEventListener("focus",focus);};
  },[graduateId,isOwn,load]);
  const perform=async(kind:"send"|"accept"|"reject"|"cancel")=>{
    if(busy.current)return;
    busy.current=true;++sequence.current;setAction(kind);setError("");
    try {
      const method=kind==="send"?"POST":kind==="cancel"?"DELETE":"PUT";
      if(kind!=="send" && !state.connectionId)throw new Error("Actualiza el estado de esta invitación e inténtalo de nuevo.");
      const response=await fetch(kind==="cancel"?`/api/connections?id=${state.connectionId}`:"/api/connections",{method,headers:{"Content-Type":"application/json"},...(method==="DELETE"?{}:{body:JSON.stringify(kind==="send"?{receiverId:graduateId}:{connectionId:state.connectionId,action:kind})})});
      const data=await response.json().catch(()=>({error:"No se pudo contactar con CONECTA. Inténtalo de nuevo."}));
      if(!response.ok)throw new Error(data.error||"No se pudo actualizar la conexión.");
      if(!statuses.includes(data.status))throw new Error("No se recibió el estado actualizado. Vuelve a comprobar la invitación.");
      if(mounted.current){setState(data);announceConnectionChange(data.profileIds);if(data.status==="connected" && (pathname.startsWith("/miembros/")||pathname.startsWith("/egresados/")))router.refresh();}
    }catch(reason){if(mounted.current)setError(reason instanceof Error?reason.message:"Revisa tu conexión e inténtalo de nuevo.");}
    finally{busy.current=false;if(mounted.current)setAction(null);}
  };
  return <div className={`connection-action ${compact?"connection-action-compact":""}`} aria-busy={action!==null}>
    {state.status==="self"?<Link href={`/miembros/${graduateId}`} className="connection-state">Ver mi perfil <span aria-hidden="true">↗</span></Link>:
     state.status==="no-profile"?<Link href="/miembros/registro" className="connection-state">Completar mi perfil →</Link>:
     state.status==="loading"?<button disabled className="connection-primary connection-checking">Comprobando conexión…</button>:
     state.status==="error"?<button type="button" onClick={()=>void load()} className="connection-primary">Reintentar</button>:
     state.status==="connected"?<div className="connection-state" role="status">✓ Conectados{compact && <Link href={`/miembros/${graduateId}`}>Ver perfil ↗</Link>}</div>:
     state.status==="pending-sent"?<><div className="connection-state" role="status">Solicitud enviada</div><button type="button" disabled={action!==null} onClick={()=>void perform("cancel")} className="connection-secondary">{action==="cancel"?"Cancelando…":"Cancelar solicitud"}</button></>:
     state.status==="pending-received"?<><button type="button" disabled={action!==null} onClick={()=>void perform("accept")} className="connection-primary">{action==="accept"?"Aceptando…":"Aceptar invitación"}</button><button type="button" disabled={action!==null} onClick={()=>void perform("reject")} className="connection-secondary">{action==="reject"?"Rechazando…":"Rechazar"}</button></>:
     <button type="button" disabled={action!==null} onClick={()=>void perform("send")} className="connection-primary">{action==="send"?"Enviando…":compact?"Conectar":"Enviar solicitud"}</button>}
    {error && <div className="connection-error"><p role="alert">{error}</p>{state.status!=="error" && <button type="button" disabled={action!==null} onClick={()=>void load()} className="connection-secondary">Actualizar estado</button>}</div>}
  </div>;
}
