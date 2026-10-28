import {NextResponse} from "next/server";
import {authorizeApi} from "@/lib/api-access";
import {getSession} from "@/lib/session";
import {sqlite} from "@/db";
import {notificationEngine} from "@/lib/notification-suite";
import {CommunityError,canManageCommunity,requireCommunity} from "@/lib/community-communication";
export async function POST(request:Request,{params}:{params:Promise<{groupId:string}>}){const denied=await authorizeApi(request);if(denied)return denied;
 try{const user=(await getSession())!,id=Number((await params).groupId),body=await request.json();const group=requireCommunity(id);if(!canManageCommunity(id,user))throw new CommunityError('Solo los responsables pueden publicar avisos importantes',403);
 if(typeof body.title!=='string'||body.title.trim().length<3||body.title.length>150||typeof body.content!=='string'||body.content.trim().length<5||body.content.length>2000)throw new CommunityError('Título de 3–150 caracteres y mensaje de 5–2000 caracteres.');
 const result=sqlite.transaction(()=>{const now=Date.now();if((sqlite.prepare('SELECT count(*) n FROM community_announcements WHERE author_id=? AND created_at>?').get(user.id,now-86400000) as {n:number}).n>=5)throw new CommunityError('Límite de 5 avisos importantes diarios por responsable.',429);
 const announcement=Number(sqlite.prepare('INSERT INTO community_announcements (group_id,author_id,title,content,created_at) VALUES (?,?,?,?,?)').run(id,user.id,body.title.trim(),body.content.trim(),now).lastInsertRowid);
 const members=sqlite.prepare("SELECT DISTINCT g.user_id AS id FROM group_members m JOIN graduates g ON g.id=m.graduate_id JOIN users u ON u.id=g.user_id WHERE m.group_id=? AND u.status='approved' AND u.id<>?").all(id,user.id) as {id:number}[];
 for(const member of members)notificationEngine.enqueue({key:'announcement:'+announcement+':'+member.id,userId:member.id,category:'communities',kind:'community_announcement',subject:'CONECTA · '+body.title.trim(),text:'Aviso de «'+group.name+'»:\n\n'+body.content.trim(),link:'/comunidades/'+id,contextType:'group',contextId:id});return {id:announcement};}).immediate();
 return NextResponse.json(result,{status:201});
 }catch(error){if(error instanceof CommunityError)return NextResponse.json({error:error.message},{status:error.status});return NextResponse.json({error:'No se pudo publicar el aviso'},{status:400});}}
