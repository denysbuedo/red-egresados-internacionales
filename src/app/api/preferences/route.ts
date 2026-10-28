import {NextResponse} from "next/server";
import {authorizeApi} from "@/lib/api-access";
import {getSession} from "@/lib/session";
import {notificationEngine} from "@/lib/notification-suite";
export async function GET(request:Request){const denied=await authorizeApi(request);if(denied)return denied;return NextResponse.json(notificationEngine.preferences((await getSession())!.id),{headers:{'Cache-Control':'private, no-store'}});}
export async function PUT(request:Request){const denied=await authorizeApi(request);if(denied)return denied;try{return NextResponse.json(notificationEngine.savePreferences((await getSession())!.id,await request.json()),{headers:{'Cache-Control':'private, no-store'}});}catch{return NextResponse.json({error:"Selecciona una opción válida para cada categoría."},{status:400});}}
