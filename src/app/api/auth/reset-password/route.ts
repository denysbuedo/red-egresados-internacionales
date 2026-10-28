import {after,NextResponse} from "next/server";
import {checkRequestOrigin} from "@/lib/api-access";
import {sessionStore,clearSession} from "@/lib/session";
import {passwordRecovery} from "@/lib/password-service";
import {notificationEngine} from "@/lib/notification-suite";
export async function POST(request:Request){const denied=checkRequestOrigin(request);if(denied)return denied;
 if(!sessionStore.consumeLimit('reset:'+ (request.headers.get('x-real-ip')||'local'),20,900000))return NextResponse.json({error:"Demasiados intentos. Intenta más tarde."},{status:429});
 try{const body=await request.json();if(typeof body?.password!=="string"||body.password!==body.confirmPassword)throw new Error('Las contraseñas no coinciden.');
 const mail=await passwordRecovery.reset(body.token,body.password);await clearSession();after(async()=>{try{await notificationEngine.deliver(mail);}catch{}});
 return NextResponse.json({message:"Contraseña actualizada. Inicia sesión con la nueva contraseña.",redirect:"/login"},{headers:{'Cache-Control':'no-store'}});
 }catch(error){return NextResponse.json({error:error instanceof Error&&!(error instanceof SyntaxError)?error.message:'Datos inválidos'},{status:400});}
}
