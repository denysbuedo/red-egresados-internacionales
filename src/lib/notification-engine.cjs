const {randomUUID,createHash}=require('node:crypto');
const {createEmailGateway}=require('./email-gateway.cjs');
const BASE='https://conecta.reduniv.edu.cu';
const CATEGORIES=['connections','communities','events','activity'];
const MODES=['off','immediate','daily'];
const escape=text=>String(text).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
function nextDaily(now){const f=new Intl.DateTimeFormat('en-US',{timeZone:'America/Havana',hour:'numeric',hourCycle:'h23'});let hour=Math.floor(now/3600000)*3600000+3600000;for(let n=0;n<27;n++,hour+=3600000)if(Number(f.format(hour))===9)return hour;return now+86400000;}
function createNotificationEngine(db,{env=process.env,fetchImpl=fetch,now=Date.now}={}){
 const gateway=createEmailGateway({config:{clientId:env.NOTIFICATION_CLIENT_ID,clientSecret:env.NOTIFICATION_CLIENT_SECRET},fetchImpl,now});
 const enabled=()=>env.NOTIFICATION_EMAIL_ENABLED==='true'&&!!env.NOTIFICATION_CLIENT_ID&&!!env.NOTIFICATION_CLIENT_SECRET;
 function preferences(userId){return db.prepare('SELECT connections,communities,events,activity FROM notification_preferences WHERE user_id=?').get(userId)||{connections:'off',communities:'off',events:'off',activity:'off'};}
 function savePreferences(userId,value){const previous=preferences(userId);if(!value||CATEGORIES.some(key=>!MODES.includes(value[key]))||Object.keys(value).some(key=>!CATEGORIES.includes(key)))throw new Error('Preferencias inválidas');
  db.prepare('INSERT INTO notification_preferences (user_id,connections,communities,events,activity,updated_at) VALUES (?,?,?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET connections=excluded.connections,communities=excluded.communities,events=excluded.events,activity=excluded.activity,updated_at=excluded.updated_at').run(userId,...CATEGORIES.map(k=>value[k]),now());
  // Turning off a category cancels its pending mail; re-enabling never resurrects it.
  for(const category of CATEGORIES){if(value[category]==='off')db.prepare("UPDATE notification_queue SET state='skipped',text_body='' WHERE user_id=? AND category=? AND state='pending'").run(userId,category);else if(previous[category]!==value[category])db.prepare("UPDATE notification_queue SET due_at=? WHERE user_id=? AND category=? AND state='pending'").run(value[category]==='daily'?nextDaily(now()):now(),userId,category);}
  return preferences(userId);
 }
 function enqueue({key,userId,category,kind,subject,text,link,contextType=null,contextId=null}){
  if(!CATEGORIES.includes(category)||typeof link!=='string'||!/^\/(?!\/)/.test(link))throw new Error('Notificación inválida');
  const user=db.prepare("SELECT id FROM users WHERE id=? AND status='approved'").get(userId);if(!user)return null;
  const mode=preferences(userId)[category];if(mode==='off')return null;
  const result=db.prepare("INSERT OR IGNORE INTO notification_queue (event_key,user_id,category,kind,subject,text_body,link,due_at,created_at,context_type,context_id) VALUES (?,?,?,?,?,?,?,?,?,?,?)").run(key,userId,category,kind,subject.slice(0,200),text.slice(0,4000),link,mode==='daily'?nextDaily(now()):now(),now(),contextType,contextId);
  return result.changes?Number(result.lastInsertRowid):null;
 }
 function reserveMail(userId,kind,subject,text,link='',actorId=null){
  const user=db.prepare('SELECT id,email FROM users WHERE id=?').get(userId);if(!user)return null;
  const id=randomUUID(),stamp=now();let code=null;
  if(!enabled())code='EMAIL_DISABLED';
  else if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email))code='INVALID_RECIPIENT';
  else if(db.prepare("SELECT count(*) n FROM email_dispatches WHERE created_at>? AND status<>'not_sent'").get(stamp-86400000).n>=100)code='DAILY_LIMIT';
  const body=text+(link?'\n\n'+BASE+link:'');
  db.prepare('INSERT INTO email_dispatches (id,actor_id,recipient_id,recipient,subject,payload_hash,status,code,correlation_id,created_at,updated_at,kind) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)').run(id,actorId,userId,user.email,subject.slice(0,200),createHash('sha256').update(body).digest('hex'),code?'not_sent':'prepared',code,randomUUID(),stamp,stamp,kind);
  return {id,message:{recipient:user.email,subject:subject.slice(0,200),text_body:body.slice(0,20000),html_body:'<div style="font-family:Arial,sans-serif;color:#102B46;line-height:1.8"><h2>conecta<span style="color:#49DCCB">.</span></h2><p>'+escape(body).replace(/\n/g,'<br>')+'</p>'+(link?'<p><a href="'+BASE+escape(link)+'">Abrir CONECTA</a></p>':'')+'</div>'}};
 }
 async function deliver(prepared){if(!prepared)return 'not_sent';
  const row=db.prepare("UPDATE email_dispatches SET status='sending',updated_at=? WHERE id=? AND status='prepared' RETURNING correlation_id").get(now(),prepared.id);
  if(!row)return db.prepare('SELECT status FROM email_dispatches WHERE id=?').get(prepared.id)?.status||'unknown';
  const message={...prepared.message};if(message.html_body?.length>50000)delete message.html_body;
  let result;try{result=await gateway.send(message,row.correlation_id);}catch{result={status:'unknown',code:'LOCAL_SEND_ERROR',correlationId:row.correlation_id};}
  db.prepare('UPDATE email_dispatches SET status=?,code=?,correlation_id=?,updated_at=? WHERE id=?').run(result.status,result.code,result.correlationId,now(),prepared.id);return result.status;
 }
 function validContext(row){
  if(row.context_type==='connection_request')return !!db.prepare("SELECT 1 FROM connections c JOIN graduates g ON g.id=c.receiver_id WHERE c.id=? AND c.status='pending' AND g.user_id=?").get(row.context_id,row.user_id);
  if(row.context_type==='connection')return !!db.prepare("SELECT 1 FROM connections c JOIN graduates g ON g.id=c.sender_id OR g.id=c.receiver_id WHERE c.id=? AND c.status='accepted' AND g.user_id=?").get(row.context_id,row.user_id);
  if(row.context_type==='post')return !!db.prepare("SELECT 1 FROM user_posts p JOIN graduates g ON g.id=p.graduate_id JOIN users u ON u.id=g.user_id WHERE p.id=? AND u.status='approved'").get(row.context_id);

  if(row.context_type==='event'){const e=db.prepare('SELECT cancelled_at,date FROM events WHERE id=?').get(row.context_id);return !!e&&(!e.cancelled_at||row.kind==='event_cancelled')&&(row.kind!=='event_reminder'||e.date*1000>now())&&!!db.prepare("SELECT 1 FROM event_attendees a JOIN graduates g ON g.id=a.graduate_id WHERE a.event_id=? AND g.user_id=? AND a.status='attending'").get(row.context_id,row.user_id);}
  if(row.context_type==='group')return !!db.prepare('SELECT 1 FROM group_members m JOIN graduates g ON g.id=m.graduate_id WHERE m.group_id=? AND g.user_id=?').get(row.context_id,row.user_id);
  if(row.context_type==='invitation')return !!db.prepare("SELECT 1 FROM community_invitations WHERE id=? AND user_id=? AND status='pending'").get(row.context_id,row.user_id);
  return true;
 }
 function reminders(){
  const stamp=now();const rows=db.prepare("SELECT e.id,e.title,e.date,e.revision,g.user_id FROM events e JOIN event_attendees a ON a.event_id=e.id JOIN graduates g ON g.id=a.graduate_id JOIN users u ON u.id=g.user_id WHERE e.cancelled_at IS NULL AND e.date>? AND e.date<=? AND a.status='attending' AND u.status='approved'").all(Math.floor(stamp/1000),Math.floor((stamp+86400000)/1000));
  for(const row of rows){const near=row.date*1000-stamp<=900000;enqueue({key:'reminder:'+row.id+':'+row.revision+':'+row.user_id+':'+(near?'15m':'24h'),userId:row.user_id,category:'events',kind:'event_reminder',subject:'CONECTA · Recordatorio de evento',text:'Tu evento «'+row.title+'» '+(near?'comienza en menos de 15 minutos.':'se celebrará en las próximas 24 horas.'),link:'/eventos/'+row.id,contextType:'event',contextId:row.id});}
 }
 async function runDue(){const stamp=now();const acquired=db.transaction(()=>{
  const lock=db.prepare("SELECT value FROM notification_worker_state WHERE key='lease'").get();if(lock&&lock.value>stamp)return false;
  db.prepare("INSERT INTO notification_worker_state VALUES ('lease',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").run(stamp+300000);return true;
 }).immediate();if(!acquired)return {processed:0,locked:true};let processed=0;
 try{
  db.prepare("UPDATE notification_queue SET state='unknown',text_body='' WHERE state='sending' AND created_at<?").run(stamp-600000);
  db.prepare("UPDATE notification_queue SET state='skipped',text_body='' WHERE state='pending' AND created_at<?").run(stamp-7*86400000);
  db.transaction(reminders).immediate();
  for(let batch=0;batch<5;batch++){
   const job=db.transaction(()=>{
    const candidates=db.prepare("SELECT q.* FROM notification_queue q JOIN users u ON u.id=q.user_id WHERE q.state='pending' AND q.due_at<=? ORDER BY q.due_at,q.id LIMIT 500").all(now());
    let first=null;
    for(const row of candidates){const user=db.prepare('SELECT status FROM users WHERE id=?').get(row.user_id),mode=preferences(row.user_id)[row.category];
     if(user?.status!=='approved'||mode==='off'||!validContext(row)){db.prepare("UPDATE notification_queue SET state='skipped',text_body='' WHERE id=?").run(row.id);continue;}
     if(mode==='daily'&&row.due_at<=row.created_at){db.prepare('UPDATE notification_queue SET due_at=? WHERE id=?').run(nextDaily(now()),row.id);continue;}
     if(mode==='daily'){
      const date=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Havana',year:'numeric',month:'2-digit',day:'2-digit'}).format(now());
      if(db.prepare('SELECT 1 FROM notification_worker_state WHERE key=?').get('digest:'+row.user_id+':'+date)){db.prepare('UPDATE notification_queue SET due_at=? WHERE id=?').run(nextDaily(now()),row.id);continue;}
     }
     first=row;break;
    }if(!first)return null;
    const digest=preferences(first.user_id)[first.category]==='daily';
    const selected=digest?candidates.filter(row=>row.user_id===first.user_id&&preferences(row.user_id)[row.category]==='daily'&&row.due_at<=now()&&validContext(row)): [first];
    const rows=selected.filter(row=>db.prepare("SELECT state FROM notification_queue WHERE id=?").get(row.id)?.state==='pending');
    const text=digest?'Tienes novedades en CONECTA:\n\n'+rows.map(row=>'• '+row.subject+'\n'+row.text_body.slice(0,240)+'\n'+BASE+row.link).join('\n\n').slice(0,17000)+'\n\nPreferencias de correo: '+BASE+'/preferencias':first.text_body+'\n\nPreferencias de correo: '+BASE+'/preferencias';
    if(digest){const date=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Havana',year:'numeric',month:'2-digit',day:'2-digit'}).format(now());db.prepare('INSERT OR IGNORE INTO notification_worker_state VALUES (?,?)').run('digest:'+first.user_id+':'+date,now());}
    const prepared=reserveMail(first.user_id,digest?'daily_digest':first.kind,digest?'CONECTA · Tu resumen diario':first.subject,text,digest?'/':first.link);
    if(!prepared){for(const row of rows)db.prepare("UPDATE notification_queue SET state='skipped',text_body='' WHERE id=?").run(row.id);return null;}
    for(const row of rows)db.prepare("UPDATE notification_queue SET state='sending',dispatch_id=? WHERE id=? AND state='pending'").run(prepared.id,row.id);
    return {prepared,rows};
   }).immediate();if(!job)break;
   let status;try{status=await deliver(job.prepared);}catch{status='unknown';}
   for(const row of job.rows)db.prepare("UPDATE notification_queue SET state=?,text_body='' WHERE id=? AND state='sending'").run(status==='accepted'?'sent':status,row.id);processed++;
  }
  db.prepare("INSERT INTO notification_worker_state VALUES ('last_run',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").run(now());
  db.prepare("DELETE FROM notification_queue WHERE state<>'pending' AND state<>'sending' AND created_at<?").run(now()-30*86400000);
  db.prepare('DELETE FROM password_reset_tokens WHERE expires_at<?').run(now());
  return {processed};
 }finally{db.prepare("UPDATE notification_worker_state SET value=0 WHERE key='lease'").run();}
 }
 return {preferences,savePreferences,enqueue,reserveMail,deliver,runDue};
}
module.exports={createNotificationEngine,nextDaily,CATEGORIES,MODES};
