"use client";
import {useState} from "react";

export function ProblemReportForm({email}:{email?:string}){const [busy,setBusy]=useState(false),[done,setDone]=useState(false),[error,setError]=useState("");
 return <form className="problem-report-form" onSubmit={async e=>{e.preventDefault();if(busy)return;setBusy(true);setError("");const form=e.currentTarget;const f=new FormData(form);try{const referrer=document.referrer?new URL(document.referrer):null;const pageUrl=referrer?.origin===window.location.origin?referrer.pathname+referrer.search:window.location.pathname;const r=await fetch('/api/problem-reports',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({category:f.get('category'),subject:f.get('subject'),description:f.get('description'),email:f.get('email'),pageUrl})});const data=await r.json();if(!r.ok)throw new Error(data.error||'No se pudo enviar el reporte.');form.reset();setDone(true);}catch(err){setError(err instanceof Error?err.message:'Revisa tu conexión e inténtalo de nuevo.');}finally{setBusy(false);}}}>
 {done&&<p role="status" className="problem-report-success">Recibimos tu mensaje. Gracias por ayudarnos a mejorar CONECTA.</p>}
 <label>¿Sobre qué nos escribes?<select name="category" required defaultValue=""><option value="" disabled>Selecciona una opción</option><option>Problema técnico</option><option>Contenido o datos incorrectos</option><option>Acceso y cuenta</option><option>Sugerencia</option><option>Otro</option></select></label>
 <label>Asunto<input name="subject" required minLength={4} maxLength={150} placeholder="Resume el problema o la consulta"/></label>
 <label>Cuéntanos qué ocurrió<textarea name="description" required minLength={15} maxLength={5000} rows={7} placeholder="Indica los pasos para reproducirlo y qué esperabas que sucediera."/></label>
 <label>Correo para responder<input name="email" type="email" maxLength={254} defaultValue={email||""} placeholder="nombre@institucion.cu"/></label>
 {error&&<p role="alert" className="connection-page-error">{error}</p>}<button className="conecta-cta" disabled={busy}>{busy?'Enviando…':'Enviar mensaje'}</button>
 </form>;
}
