import "server-only";
import {sqlite} from "@/db";
import {createNotificationEngine} from "./notification-engine.cjs";
import {randomUUID} from "node:crypto";
export const notificationEngine=createNotificationEngine(sqlite);
export function notifyProfile(profileId:number,category:"connections"|"activity",kind:string,text:string,link:string,key:string=randomUUID(),contextId?:number){
 const user=sqlite.prepare('SELECT user_id FROM graduates WHERE id=?').get(profileId) as {user_id:number|null}|undefined;
 if(user?.user_id)notificationEngine.enqueue({key,userId:user.user_id,category,kind,subject:'CONECTA · '+(category==='connections'?'Tu red de conexiones':'Actividad en tus aportes'),text,link,...(contextId?{contextType:kind==='connection_requested'?'connection_request':'connection',contextId}:{})});
}
export function notifyMentions(content:string,actorId:number,link:string,key:string,groupId?:number){
 const names=[...new Set([...content.matchAll(/(?:^|\s)@([A-Za-z0-9_.-]{3,40})\b/g)].map(match=>match[1]))].slice(0,10);
 for(const username of names){const user=sqlite.prepare("SELECT id FROM users WHERE lower(username)=lower(?) AND status='approved' AND id<>?").get(username,actorId) as {id:number}|undefined;if(!user)continue;
 if(groupId&&!sqlite.prepare('SELECT 1 FROM group_members m JOIN graduates g ON g.id=m.graduate_id WHERE m.group_id=? AND g.user_id=?').get(groupId,user.id))continue;
 notificationEngine.enqueue({key:key+':'+user.id,userId:user.id,category:'activity',kind:'mention',subject:'CONECTA · Te han mencionado',text:'Una persona de la comunidad te mencionó en un aporte o comentario. Entra a CONECTA para consultar la conversación.',link,...(groupId?{contextType:'group',contextId:groupId}:/post=(\d+)/.test(link)?{contextType:'post',contextId:Number(/post=(\d+)/.exec(link)![1])}:{})});}
}
