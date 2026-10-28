import "server-only";
import {sqlite} from "@/db";
import {notificationEngine} from "./notification-suite";
import type {SessionUser} from "./session";
export class CommunityError extends Error{constructor(message:string,public status=400){super(message);}}
export function canManageCommunity(groupId:number,user:SessionUser){return user.role==='admin'||!!sqlite.prepare("SELECT 1 FROM groups c LEFT JOIN graduates g ON g.user_id=? LEFT JOIN group_members m ON m.group_id=c.id AND m.graduate_id=g.id WHERE c.id=? AND (c.creator_id=g.id OR m.role='admin')").get(user.id,groupId);}
export function requireCommunity(groupId:number){if(!Number.isSafeInteger(groupId)||groupId<1)throw new CommunityError('Comunidad inválida');const group=sqlite.prepare('SELECT * FROM groups WHERE id=?').get(groupId) as {id:number;name:string}|undefined;if(!group)throw new CommunityError('Comunidad no encontrada',404);return group;}
export function inviteCommunity(groupId:number,targetId:number,user:SessionUser){return sqlite.transaction(()=>{
 const group=requireCommunity(groupId);if(!canManageCommunity(groupId,user))throw new CommunityError('Solo los responsables pueden invitar',403);
 if(!Number.isSafeInteger(targetId)||targetId<1||targetId===user.id)throw new CommunityError('Selecciona otra persona');
 if(!sqlite.prepare("SELECT 1 FROM users u JOIN graduates g ON g.user_id=u.id WHERE u.id=? AND u.status='approved'").get(targetId))throw new CommunityError('Persona no disponible',404);
 if(sqlite.prepare('SELECT 1 FROM group_members m JOIN graduates g ON g.id=m.graduate_id WHERE m.group_id=? AND g.user_id=?').get(groupId,targetId))throw new CommunityError('La persona ya pertenece a la comunidad',409);
 const old=sqlite.prepare('SELECT id,status,created_at FROM community_invitations WHERE group_id=? AND user_id=?').get(groupId,targetId) as {id:number;status:string;created_at:number}|undefined;
 if(old?.status==='pending')return {id:old.id,status:'pending'};
 const now=Date.now();if(old&&old.created_at>now-86400000)throw new CommunityError('Espera 24 horas antes de invitar de nuevo.',429);
 if((sqlite.prepare('SELECT count(*) n FROM community_invitations WHERE invited_by=? AND created_at>?').get(user.id,now-86400000) as {n:number}).n>=20)throw new CommunityError('Límite de 20 invitaciones diarias alcanzado',429);
 let id:number;if(old){sqlite.prepare("UPDATE community_invitations SET status='pending',invited_by=?,created_at=? WHERE id=?").run(user.id,now,old.id);id=old.id;}else id=Number(sqlite.prepare('INSERT INTO community_invitations (group_id,user_id,invited_by,created_at) VALUES (?,?,?,?)').run(groupId,targetId,user.id,now).lastInsertRowid);
 notificationEngine.enqueue({key:'community-invite:'+id+':'+now,userId:targetId,category:'communities',kind:'community_invited',subject:'CONECTA · Invitación a una comunidad',text:'Te han invitado a participar en «'+group.name+'». Puedes aceptar o rechazar la invitación en CONECTA.',link:'/comunidades',contextType:'invitation',contextId:id});
 sqlite.prepare("INSERT INTO notifications (user_id,type,message,link,read,created_at) VALUES (?,'community_invited',?,'/comunidades',0,?)").run(targetId,'Te han invitado a '+group.name,Math.floor(now/1000));return {id,status:'pending'};
 }).immediate();}
export function respondCommunity(id:number,action:string,user:SessionUser){return sqlite.transaction(()=>{
 if(!['accept','decline'].includes(action))throw new CommunityError('Acción inválida');
 const invitation=sqlite.prepare('SELECT * FROM community_invitations WHERE id=? AND user_id=?').get(id,user.id) as {id:number;group_id:number;status:string}|undefined;if(!invitation)throw new CommunityError('Invitación no encontrada',404);
 const status=action==='accept'?'accepted':'declined';if(invitation.status===status)return {status};if(invitation.status!=='pending')throw new CommunityError('La invitación ya fue resuelta',409);
 if(action==='accept'){const profile=sqlite.prepare('SELECT id FROM graduates WHERE user_id=?').get(user.id) as {id:number}|undefined;if(!profile)throw new CommunityError('Completa tu perfil antes de unirte');sqlite.prepare("INSERT INTO group_members (group_id,graduate_id,role,joined_at) SELECT ?,?,'member',? WHERE NOT EXISTS (SELECT 1 FROM group_members WHERE group_id=? AND graduate_id=?)").run(invitation.group_id,profile.id,Math.floor(Date.now()/1000),invitation.group_id,profile.id);}
 sqlite.prepare('UPDATE community_invitations SET status=? WHERE id=?').run(status,id);return {status};
 }).immediate();}
