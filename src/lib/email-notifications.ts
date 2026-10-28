import "server-only";
import { createHash, randomUUID } from "node:crypto";
import { sqlite } from "@/db";
import { accessEmail } from "./access-email-template.cjs";
import { createEmailGateway } from "./email-gateway.cjs";
const gateway=createEmailGateway({config:{clientId:process.env.NOTIFICATION_CLIENT_ID,clientSecret:process.env.NOTIFICATION_CLIENT_SECRET}});
export const emailEnabled=()=>process.env.NOTIFICATION_EMAIL_ENABLED==="true" && !!process.env.NOTIFICATION_CLIENT_ID && !!process.env.NOTIFICATION_CLIENT_SECRET;
export class EmailError extends Error {constructor(message:string,public status=400){super(message);}}
export type Dispatch={id:string;recipient:string;subject:string;status:string;code:string|null;correlationId:string;createdAt:number;kind:string};
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function history(){
  const rows=sqlite.prepare('SELECT id,recipient,subject,status,code,kind,correlation_id AS correlationId,created_at AS createdAt,updated_at AS updatedAt FROM email_dispatches ORDER BY created_at DESC,rowid DESC LIMIT 50').all() as (Dispatch & {updatedAt:number})[];
  return rows.map(row=>({...row,status:row.updatedAt<Date.now()-120000?(row.status==='sending'?'unknown':row.status==='prepared'?'not_sent':row.status):row.status,code:row.status==='prepared' && row.updatedAt<Date.now()-120000?'INTERRUPTED_BEFORE_SEND':row.code}));
}
export async function dispatchEmail(actorId:number,body:Record<string,unknown>){
  const id=body.operationId,recipientId=body.recipientId,subject=typeof body.subject==='string'?body.subject.trim():'',text=typeof body.textBody==='string'?body.textBody.trim():'';
  if(typeof id!=='string'||!uuid.test(id)||!Number.isSafeInteger(recipientId)||Number(recipientId)<1||!subject||subject.length>200||/[\r\n]/.test(subject)||!text||text.length>20000)throw new EmailError('Revisa el destinatario, asunto (hasta 200 caracteres) y mensaje (hasta 20 000).');
  if(body.htmlBody!==undefined)throw new EmailError('Utiliza el editor de texto; la presentación HTML se genera automáticamente.');
  const recipient=sqlite.prepare("SELECT id,email FROM users WHERE id=? AND status='approved'").get(recipientId) as {id:number;email:string}|undefined;
  if(!recipient || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient.email))throw new EmailError('Selecciona una cuenta aprobada con correo válido.');
  const hash=createHash('sha256').update(JSON.stringify([recipient.id,recipient.email,subject,text])).digest('hex');
  const reservation=sqlite.transaction(()=>{
    const previous=sqlite.prepare('SELECT actor_id,payload_hash FROM email_dispatches WHERE id=?').get(id) as {actor_id:number;payload_hash:string}|undefined;
    if(previous){if(previous.actor_id!==actorId||previous.payload_hash!==hash)throw new EmailError('Esta operación ya se utilizó con otros datos.',409);return false;}
    if(!emailEnabled())throw new EmailError('Los envíos están deshabilitados hasta completar la prueba coordinada con Interoperabilidad.',503);
    const now=Date.now();
    const actorCount=sqlite.prepare("SELECT count(*) n FROM email_dispatches WHERE actor_id=? AND kind='manual' AND created_at>? AND status<>'not_sent'").get(actorId,now-60000) as {n:number};
    const dailyCount=sqlite.prepare("SELECT count(*) n FROM email_dispatches WHERE created_at>? AND status<>'not_sent'").get(now-86400000) as {n:number};
    if(actorCount.n>=5||dailyCount.n>=100)throw new EmailError('Se alcanzó el límite de envíos: 5 por minuto por administrador o 100 al día en la plataforma.',429);
    sqlite.prepare("INSERT INTO email_dispatches (id,actor_id,recipient_id,recipient,subject,payload_hash,status,correlation_id,created_at,updated_at) VALUES (?,?,?,?,?,?,'sending',?,?,?)").run(id,actorId,recipient.id,recipient.email,subject,hash,randomUUID(),now,now);return true;
  }).immediate();
  if(!reservation)return history().find(row=>row.id===id) || {id,status:'unknown'};
  const row=sqlite.prepare('SELECT correlation_id FROM email_dispatches WHERE id=?').get(id) as {correlation_id:string};
  const html='<p>'+text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/\n/g,'<br>')+'</p>';
  // HTML is optional. Never exceed the service limit after escaping.
  const result=await gateway.send({recipient:recipient.email,subject,text_body:text,...(html.length<=50000?{html_body:html}:{})},row.correlation_id);
  sqlite.prepare('UPDATE email_dispatches SET status=?,code=?,correlation_id=?,updated_at=? WHERE id=?').run(result.status,result.code,result.correlationId,Date.now(),id);
  return {id,recipient:recipient.email,subject,...result,createdAt:Date.now()};
}


export type AccessEmailKind="access_received"|"access_approved"|"access_rejected";
type PreparedEmail={id:string;message:{recipient:string;subject:string;text_body:string;html_body:string}};
// Called inside the same SQLite transaction as the account creation/decision.
// The durable reservation survives a crash, but it never triggers an automatic retry.
export function reserveAccessEmail(kind:AccessEmailKind,recipient:{id:number;email:string;name:string},actorId:number|null,reason?:string):PreparedEmail {
  if(!sqlite.inTransaction)throw new Error("Access email requires account transaction");
  const message={recipient:recipient.email,...accessEmail(kind,{name:recipient.name,reason})};
  const id=randomUUID(),now=Date.now(),hash=createHash('sha256').update(JSON.stringify(message)).digest('hex');
  let code:string|null=null;
  if(!emailEnabled())code='EMAIL_DISABLED';
  else if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient.email))code='INVALID_RECIPIENT';
  else {
    const daily=sqlite.prepare("SELECT count(*) n FROM email_dispatches WHERE created_at>? AND status<>'not_sent'").get(now-86400000) as {n:number};
    const personal=sqlite.prepare("SELECT count(*) n FROM email_dispatches WHERE recipient=? AND created_at>? AND status<>'not_sent'").get(recipient.email,now-86400000) as {n:number};
    if(daily.n>=100)code='DAILY_LIMIT';else if(personal.n>=5)code='RECIPIENT_LIMIT';
  }
  sqlite.prepare('INSERT INTO email_dispatches (id,actor_id,recipient_id,recipient,subject,payload_hash,status,code,correlation_id,created_at,updated_at,kind) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)').run(id,actorId,recipient.id,recipient.email,message.subject,hash,code?'not_sent':'prepared',code,randomUUID(),now,now,kind);
  return {id,message};
}
export async function deliverAccessEmail(prepared:PreparedEmail):Promise<{id:string;status:string}> {
  try {
    const row=sqlite.prepare("UPDATE email_dispatches SET status='sending',updated_at=? WHERE id=? AND status='prepared' RETURNING correlation_id").get(Date.now(),prepared.id) as {correlation_id:string}|undefined;
    if(!row){const previous=sqlite.prepare('SELECT status FROM email_dispatches WHERE id=?').get(prepared.id) as {status:string}|undefined;return {id:prepared.id,status:previous?.status||'unknown'};}
    const result=await gateway.send(prepared.message,row.correlation_id);
    sqlite.prepare('UPDATE email_dispatches SET status=?,code=?,correlation_id=?,updated_at=? WHERE id=?').run(result.status,result.code,result.correlationId,Date.now(),prepared.id);
    return {id:prepared.id,status:result.status};
  }catch {
    // Account state is already committed. Never propagate an email failure to it.
    try{sqlite.prepare("UPDATE email_dispatches SET status=CASE WHEN status='prepared' THEN 'not_sent' ELSE 'unknown' END,code='LOCAL_SEND_ERROR',updated_at=? WHERE id=? AND status IN ('prepared','sending')").run(Date.now(),prepared.id);}catch{/* Preserve the original reservation if storage is unavailable. */}
    return {id:prepared.id,status:'unknown'};
  }
}
