import {after,NextResponse} from "next/server";
import {authorizeApi} from "@/lib/api-access";
import {getSession,clearSession,sessionStore} from "@/lib/session";
import {passwordRecovery} from "@/lib/password-service";
import {notificationEngine} from "@/lib/notification-suite";
export async function POST(request:Request){const denied=await authorizeApi(request);if(denied)return denied;
 const user=(await getSession())!;if(!sessionStore.consumeLimit('change-password:'+user.id,5,900000))return NextResponse.json({error:"Demasiados intentos. Intenta más tarde."},{status:429});
 try{const body=await request.json();if(typeof body?.password!=="string"||body.password!==body.confirmPassword)throw new Error('Las contraseñas no coinciden.');
 const mail=await passwordRecovery.change(user.id,body.currentPassword,body.password);await clearSession();after(async()=>{try{await notificationEngine.deliver(mail);}catch{}});
 return NextResponse.json({message:"Contraseña actualizada. Inicia sesión de nuevo.",redirect:"/login"},{headers:{'Cache-Control':'no-store'}});
 }catch(error){return NextResponse.json({error:error instanceof Error&&!(error instanceof SyntaxError)?error.message:'Datos inválidos'},{status:400});}
}
