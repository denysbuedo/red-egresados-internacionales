import { authorizeApi } from "@/lib/api-access";
import { getSession } from "@/lib/session";
import { NextResponse } from "next/server";
import { ConnectionError, positiveId, ownProfile, connectionState, connectionList, sendConnection, respondConnection, cancelConnection } from "@/lib/connection-service";
async function handle(request:Request) {
  const denied=await authorizeApi(request);if(denied)return denied;
  try {
    const session=await getSession();
    if(!session)return NextResponse.json({error:"Debes iniciar sesión"},{status:401});
    const own=ownProfile(session.id);
    const url=new URL(request.url);
    if(request.method==='GET') {
      if(!own)return NextResponse.json(url.searchParams.has('check')?{status:'no-profile',connectionId:null}:url.searchParams.has('type')?[]:{pendingCount:0});
      const data=url.searchParams.has('check')?connectionState(own.id,positiveId(url.searchParams.get('check'))):connectionList(own.id,url.searchParams.get('type'));
      return NextResponse.json(data,{headers:{'Cache-Control':'private, no-store'}});
    }
    if(!own)throw new ConnectionError('Completa tu perfil antes de conectar con otras personas');
    let data;
    if(request.method==='DELETE')data=cancelConnection(own,positiveId(url.searchParams.get('id')));
    else {
      const body=await request.json();if(!body || typeof body!=='object' || Array.isArray(body))throw new ConnectionError('Datos inválidos');
      data=request.method==='POST'?sendConnection(own,positiveId(body.receiverId)):respondConnection(own,positiveId(body.connectionId),body.action);
    }
    return NextResponse.json({success:true,...data},{headers:{'Cache-Control':'private, no-store'}});
  } catch(error) {
    if(error instanceof ConnectionError)return NextResponse.json({error:error.message},{status:error.status});
    if(error instanceof SyntaxError)return NextResponse.json({error:'Datos inválidos'},{status:400});
    console.error('Connection operation failed',error instanceof Error?error.name:'unknown');
    return NextResponse.json({error:'No se pudo actualizar la conexión. Inténtalo de nuevo.'},{status:500});
  }
}
export const GET=handle;
export const POST=handle;
export const PUT=handle;
export const DELETE=handle;
