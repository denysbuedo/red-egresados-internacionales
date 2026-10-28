import {NextResponse} from "next/server";
import {authorizeApi} from "@/lib/api-access";
import {getSession} from "@/lib/session";
import {sqlite} from "@/db";
import {CommunityError,requireCommunity,canManageCommunity,inviteCommunity,respondCommunity} from "@/lib/community-communication";
async function handle(request:Request){const denied=await authorizeApi(request);if(denied)return denied;const user=(await getSession())!;
 try{if(request.method==='GET'){const raw=new URL(request.url).searchParams.get('groupId');
  if(!raw)return NextResponse.json(sqlite.prepare("SELECT i.id,i.group_id AS groupId,g.name AS groupName FROM community_invitations i JOIN groups g ON g.id=i.group_id WHERE i.user_id=? AND i.status='pending' ORDER BY i.created_at DESC").all(user.id),{headers:{'Cache-Control':'private, no-store'}});
  const id=Number(raw);requireCommunity(id);const canManage=canManageCommunity(id,user);const recipients=canManage?sqlite.prepare("SELECT u.id,g.name FROM users u JOIN graduates g ON g.user_id=u.id WHERE u.status='approved' AND u.id<>? AND NOT EXISTS(SELECT 1 FROM group_members m WHERE m.group_id=? AND m.graduate_id=g.id) ORDER BY g.name LIMIT 500").all(user.id,id):[];
  const announcements=sqlite.prepare('SELECT id,title,content,created_at AS createdAt FROM community_announcements WHERE group_id=? ORDER BY id DESC LIMIT 20').all(id);return NextResponse.json({canManage,recipients,announcements},{headers:{'Cache-Control':'private, no-store'}});
 }
 const body=await request.json();const result=request.method==='POST'?inviteCommunity(Number(body.groupId),Number(body.userId),user):respondCommunity(Number(body.id),body.action,user);return NextResponse.json(result);
 }catch(error){if(error instanceof CommunityError)return NextResponse.json({error:error.message},{status:error.status});return NextResponse.json({error:'No se pudo procesar la invitación'},{status:400});}
}
export const GET=handle;export const POST=handle;export const PUT=handle;
