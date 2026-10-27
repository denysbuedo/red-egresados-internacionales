import "server-only";
import { sqlite } from "@/db";

type Row = { id:number; sender_id:number; receiver_id:number; status:string; created_at:number|null };
type Friend = { id:number; graduateId:number; name:string; photo:string|null; profession:string; country:string; university:string };
type Invitation = { id:number; senderId:number; receiverId:number; createdAt:Date|null; senderName?:string; senderPhoto?:string|null; senderProfession?:string; receiverName?:string; receiverPhoto?:string|null; receiverProfession?:string };
type Profile = { id:number; user_id:number|null; name:string; photo_url:string|null; current_profession:string; country:string; university:string };
export class ConnectionError extends Error { constructor(message:string, public status=400) { super(message); } }
export function positiveId(value:unknown) {
  if (!["string","number"].includes(typeof value) || !/^\d+$/.test(String(value))) throw new ConnectionError("Identificador inválido");
  const id=Number(value); if (!Number.isSafeInteger(id) || id<1) throw new ConnectionError("Identificador inválido"); return id;
}
export function ownProfile(userId:number) { return sqlite.prepare('SELECT * FROM graduates WHERE user_id=?').get(userId) as Profile|undefined; }
const pairSql='((sender_id=? AND receiver_id=?) OR (sender_id=? AND receiver_id=?))';
const priority="CASE status WHEN 'accepted' THEN 0 WHEN 'pending' THEN 1 ELSE 2 END, created_at DESC, id DESC";
function pair(a:number,b:number) { return sqlite.prepare(`SELECT * FROM connections WHERE ${pairSql} ORDER BY ${priority} LIMIT 1`).get(a,b,b,a) as Row|undefined; }
function peer(id:number) { return sqlite.prepare('SELECT * FROM graduates WHERE id=?').get(id) as Profile|undefined; }
function state(row:Row|undefined, own:number, other:number) {
  const status=own===other?'self':row?.status==='accepted'?'connected':row?.status==='pending'?(row.sender_id===own?'pending-sent':'pending-received'):'none';
  return { status, connectionId:row && row.status!=='rejected'?row.id:null, profileIds:[own,other] };
}
export function connectionState(own:number,other:number) {
  if (!peer(other)) throw new ConnectionError("Miembro no encontrado",404);
  return state(pair(own,other),own,other);
}
function canonical(own:number) {
  const rows=sqlite.prepare(`SELECT * FROM connections WHERE sender_id=? OR receiver_id=? ORDER BY ${priority}`).all(own,own) as Row[];
  const selected=new Map<number,Row>();
  for(const row of rows) { const other=row.sender_id===own?row.receiver_id:row.sender_id; if(other!==own && !selected.has(other))selected.set(other,row); }
  return [...selected.values()];
}
export function connectionList(own:number,type:string|null) {
  const rows=canonical(own);
  if (!type) return { pendingCount:rows.filter(row=>row.status==='pending' && row.receiver_id===own).length };
  if (!['pending','sent','accepted'].includes(type)) throw new ConnectionError('Tipo de consulta inválido');
  return rows.filter(row=>type==='accepted'?row.status==='accepted':row.status==='pending' && (type==='pending'?row.receiver_id===own:row.sender_id===own)).flatMap<Friend|Invitation>(row=>{
    const other=peer(row.sender_id===own?row.receiver_id:row.sender_id);if(!other)return [];
    if(type==='accepted')return [{id:row.id,graduateId:other.id,name:other.name,photo:other.photo_url,profession:other.current_profession,country:other.country,university:other.university}];
    return [{id:row.id,senderId:row.sender_id,receiverId:row.receiver_id,createdAt:row.created_at===null?null:new Date(row.created_at*1000),...(type==='pending'?{senderName:other.name,senderPhoto:other.photo_url,senderProfession:other.current_profession}:{receiverName:other.name,receiverPhoto:other.photo_url,receiverProfession:other.current_profession})}];
  });
}
export function sendConnection(own:Profile,receiver:number) {
  return sqlite.transaction(()=>{
    if(own.id===receiver)throw new ConnectionError('No puedes enviarte una solicitud a ti mismo');
    const target=sqlite.prepare("SELECT g.id FROM graduates g JOIN users u ON u.id=g.user_id WHERE g.id=? AND u.status='approved'").get(receiver);
    if(!target)throw new ConnectionError('Miembro no disponible',404);
    const current=pair(own.id,receiver);
    if(current && ['accepted','pending'].includes(current.status))return state(current,own.id,receiver);
    const now=Math.floor(Date.now()/1000);
    const reusable=(sqlite.prepare('SELECT * FROM connections WHERE sender_id=? AND receiver_id=?').get(own.id,receiver) as Row|undefined)||current;
    if(reusable)sqlite.prepare("UPDATE connections SET sender_id=?,receiver_id=?,status='pending',created_at=? WHERE id=?").run(own.id,receiver,now,reusable.id);
    else sqlite.prepare("INSERT INTO connections (sender_id,receiver_id,status,created_at) VALUES (?,?,'pending',?)").run(own.id,receiver,now);
    return state(pair(own.id,receiver),own.id,receiver);
  }).immediate();
}
export function respondConnection(own:Profile,id:number,action:unknown) {
  if(!['accept','reject'].includes(String(action)))throw new ConnectionError('Acción inválida');
  return sqlite.transaction(()=>{
    const row=sqlite.prepare('SELECT * FROM connections WHERE id=? AND receiver_id=?').get(id,own.id) as Row|undefined;
    if(!row)throw new ConnectionError('Solicitud no encontrada',404);
    const current=pair(own.id,row.sender_id);
    if(current?.status==='accepted') {
      if(action==='accept')return state(current,own.id,row.sender_id);
      throw new ConnectionError('La invitación ya fue aceptada. Actualiza tus conexiones.',409);
    }
    if(row.status==='rejected') {
      if(action==='reject')return state(current,own.id,row.sender_id);
      throw new ConnectionError('Esta invitación ya no está pendiente',409);
    }
    if(action==='reject')sqlite.prepare(`UPDATE connections SET status='rejected' WHERE ${pairSql} AND status='pending'`).run(own.id,row.sender_id,row.sender_id,own.id);
    else {
      sqlite.prepare("UPDATE connections SET status='accepted' WHERE id=? AND status='pending'").run(id);
      const sender=sqlite.prepare('SELECT u.id FROM users u JOIN graduates g ON g.user_id=u.id WHERE g.id=?').get(row.sender_id) as {id:number}|undefined;
      if(sender)sqlite.prepare("INSERT INTO notifications (user_id,type,message,link,read,created_at) VALUES (?,'connection_accepted',?,?,0,?)").run(sender.id,`${own.name} aceptó tu solicitud de conexión`,`/miembros/${own.id}`,Math.floor(Date.now()/1000));
    }
    return state(pair(own.id,row.sender_id),own.id,row.sender_id);
  }).immediate();
}
export function cancelConnection(own:Profile,id:number) {
  return sqlite.transaction(()=>{
    const row=sqlite.prepare('SELECT * FROM connections WHERE id=? AND (sender_id=? OR receiver_id=?)').get(id,own.id,own.id) as Row|undefined;
    if(!row)throw new ConnectionError('Conexión no encontrada',404);
    const other=row.sender_id===own.id?row.receiver_id:row.sender_id;
    const current=pair(own.id,other);
    if(current?.status==='accepted' && row.status!=='accepted')throw new ConnectionError('La invitación ya fue aceptada. Actualiza tus conexiones.',409);
    if(row.status==='accepted')sqlite.prepare(`DELETE FROM connections WHERE ${pairSql}`).run(own.id,other,other,own.id);
    else sqlite.prepare(`DELETE FROM connections WHERE ${pairSql} AND status=?`).run(own.id,other,other,own.id,row.status);
    return state(pair(own.id,other),own.id,other);
  }).immediate();
}
