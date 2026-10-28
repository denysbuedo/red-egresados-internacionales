import { NextResponse } from "next/server";
import { authorizeApi } from "@/lib/api-access";
import { getSession } from "@/lib/session";
import { sqlite } from "@/db";
import { dispatchEmail, EmailError, emailEnabled, history } from "@/lib/email-notifications";
export async function GET(request:Request){
  const denied=await authorizeApi(request,["admin"]);if(denied)return denied;
  try{const recipients=sqlite.prepare("SELECT u.id,u.email,coalesce(g.name,u.username) AS name FROM users u LEFT JOIN graduates g ON g.user_id=u.id WHERE u.status='approved' ORDER BY name LIMIT 1000").all();
    return NextResponse.json({enabled:emailEnabled(),recipients,history:history(),automation:{lastRun:(sqlite.prepare("SELECT value FROM notification_worker_state WHERE key='last_run'").get() as {value:number}|undefined)?.value||null,pending:(sqlite.prepare("SELECT count(*) n FROM notification_queue WHERE state='pending'").get() as {n:number}).n}},{headers:{'Cache-Control':'private, no-store'}});
  }catch{return NextResponse.json({error:"No se pudo consultar el servicio de notificaciones."},{status:503});}
}
export async function POST(request:Request){
  const denied=await authorizeApi(request,["admin"]);if(denied)return denied;
  try{const body=await request.json();if(!body||typeof body!=='object'||Array.isArray(body))throw new EmailError('Datos inválidos');
    const session=(await getSession())!;const result=await dispatchEmail(session.id,body);
    return NextResponse.json(result,{headers:{'Cache-Control':'private, no-store'}});
  }catch(error){if(error instanceof EmailError)return NextResponse.json({error:error.message},{status:error.status});
    if(error instanceof SyntaxError)return NextResponse.json({error:'Datos inválidos'},{status:400});
    return NextResponse.json({error:'No se pudo confirmar la operación. Consulta el historial antes de crear otro envío.'},{status:500});}
}
