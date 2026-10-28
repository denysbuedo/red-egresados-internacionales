import {after,NextResponse} from "next/server";
import {checkRequestOrigin} from "@/lib/api-access";
import {sessionStore} from "@/lib/session";
import {passwordRecovery} from "@/lib/password-service";
export async function POST(request:Request){const denied=checkRequestOrigin(request);if(denied)return denied;
 let body;try{body=await request.json();}catch{return NextResponse.json({error:"Datos inválidos"},{status:400});}
 if(typeof body?.email!=="string"||!body.email.trim()||body.email.length>254)return NextResponse.json({error:"Indica el correo de tu cuenta."},{status:400});
 const allowed=sessionStore.consumeLimit('recovery:'+ (request.headers.get('x-real-ip')||'local'),10,3600000);
 if(allowed)after(async()=>{try{await passwordRecovery.request(body.email.trim().toLowerCase());}catch{/* The public response never exposes account existence or provider errors. */}});
 return NextResponse.json({message:"Si el correo corresponde a una cuenta habilitada, recibirás un enlace para recuperar el acceso. Revisa también el correo no deseado."},{status:202,headers:{'Cache-Control':'no-store'}});
}
