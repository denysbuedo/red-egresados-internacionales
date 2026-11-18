import { NextRequest,NextResponse } from "next/server";
import { sqlite } from "@/db";
import { getSession,sessionStore } from "@/lib/session";
import { checkRequestOrigin } from "@/lib/api-access";

const categories=["Problema técnico","Contenido o datos incorrectos","Acceso y cuenta","Sugerencia","Otro"] as const;
export async function POST(request:NextRequest){
 const denied=checkRequestOrigin(request);if(denied)return denied;
 const ip=request.headers.get("x-real-ip")||"local";
 if(!sessionStore.consumeLimit(`problem-report:${ip}`,8,60*60*1000))return NextResponse.json({error:"Has enviado varios reportes. Inténtalo más tarde."},{status:429});
 let body:Record<string,unknown>;try{body=await request.json();if(!body||Array.isArray(body)||typeof body!=="object")throw new Error();}catch{return NextResponse.json({error:"Completa el formulario correctamente."},{status:400});}
 const category=body.category,subject=typeof body.subject==="string"?body.subject.trim():"",description=typeof body.description==="string"?body.description.trim():"",contactEmail=typeof body.email==="string"?body.email.trim().toLowerCase():"",pageUrl=typeof body.pageUrl==="string"?body.pageUrl.trim():"";
 if(typeof category!=="string"||!categories.includes(category as typeof categories[number])||subject.length<4||subject.length>150||description.length<15||description.length>5000||contactEmail.length>254||contactEmail&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)||pageUrl.length>500||pageUrl&&!pageUrl.startsWith("/"))return NextResponse.json({error:"Revisa el tipo, asunto, descripción y correo de contacto."},{status:400});
 const user=await getSession();
 const reportId=sqlite.transaction(()=>{const id=Number(sqlite.prepare("INSERT INTO problem_reports(user_id,category,subject,description,contact_email,page_url,created_at) VALUES (?,?,?,?,?,?,?)").run(user?.id??null,category,subject,description,contactEmail||user?.email||null,pageUrl||null,Date.now()).lastInsertRowid);sqlite.prepare("INSERT INTO notifications(user_id,type,message,link,read,created_at) SELECT id,'problem_report',?,?,0,? FROM users WHERE role='admin' AND status='approved'").run(`Nuevo reporte: ${subject}`,'/admin/reportes',Math.floor(Date.now()/1000));return id;}).immediate();
 return NextResponse.json({success:true,id:reportId},{status:201});
}
