"use client";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { PageHeader } from "./PageHeader";
type Community={id:number;name:string;description:string;type:string;category:string|null;creatorName:string|null;memberCount:number};
const types=[['university','Institución'],['career','Área de conocimiento'],['country','País'],['interest','Interés']];
export function CommunityManager(){
  const [groups,setGroups]=useState<Community[]>([]),[edit,setEdit]=useState<Community|null>(null),[loading,setLoading]=useState(true),[saving,setSaving]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState('');
  const lock=useRef(false);
  useEffect(()=>{const controller=new AbortController();fetch('/api/groups',{cache:'no-store',signal:controller.signal}).then(async r=>{if(!r.ok)throw new Error('No se pudieron cargar las comunidades.');return r.json();}).then(setGroups).catch(e=>{if(!controller.signal.aborted)setError(e.message);}).finally(()=>{if(!controller.signal.aborted)setLoading(false);});return()=>controller.abort();},[]);
  return <div className="ui-page"><PageHeader title="Gestionar comunidades" description="Cuida la información de los espacios de colaboración, independientemente de quién los haya creado." eyebrow="ADMINISTRACIÓN · COMUNIDADES" />
    {error && <p role="alert" className="connection-page-error">{error}</p>}{message && <p role="status" className="connection-page-success">{message}</p>}
    {edit && <form className="member-section community-editor" onSubmit={async e=>{e.preventDefault();if(lock.current)return;lock.current=true;setSaving(true);setError('');setMessage('');try{const r=await fetch('/api/groups',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(edit)});const data=await r.json();if(!r.ok)throw new Error(data.error||'No se pudo guardar.');setGroups(previous=>previous.map(g=>g.id===edit.id?edit:g));setEdit(null);setMessage('Comunidad actualizada.');}catch(reason){setError(reason instanceof Error?reason.message:'Revisa tu conexión.');}finally{lock.current=false;setSaving(false);}}}>
    <h2>Editar comunidad</h2><fieldset disabled={saving} className="member-form-stack">
    <div className="member-form-field"><label htmlFor="community-name">Nombre</label><input id="community-name" required minLength={3} maxLength={150} value={edit.name} onChange={e=>setEdit({...edit,name:e.target.value})} /></div>
    <div className="member-form-field"><label htmlFor="community-description">Descripción</label><textarea id="community-description" required minLength={10} maxLength={5000} rows={4} value={edit.description} onChange={e=>setEdit({...edit,description:e.target.value})} /></div>
    <div className="member-form-field"><label htmlFor="community-type">Tipo</label><select id="community-type" value={edit.type} onChange={e=>setEdit({...edit,type:e.target.value})}>{types.map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></div>
    <div className="member-form-field"><label htmlFor="community-category">Categoría</label><input id="community-category" maxLength={200} value={edit.category||''} onChange={e=>setEdit({...edit,category:e.target.value})} /></div>
    <div className="flex gap-3"><button type="submit" className="conecta-cta">{saving?'Guardando…':'Guardar cambios'}</button><button type="button" onClick={()=>setEdit(null)}>Cancelar</button></div></fieldset></form>}
    {loading?<p>Cargando comunidades…</p>:groups.length?<div className="community-management-list">{groups.map(group=><article key={group.id} className="member-section"><div><h2><Link href={'/comunidades/'+group.id}>{group.name}</Link></h2><p>{group.description}</p><small>{group.memberCount} miembros · Creada por {group.creatorName||'Miembro de la comunidad'}</small></div><button type="button" className="connection-secondary" onClick={()=>{setEdit({...group});setError('');setMessage('');window.scrollTo({top:0,behavior:'smooth'});}}>Editar comunidad</button></article>)}</div>:<p className="ui-empty">Todavía no hay comunidades.</p>}
  </div>;
}
