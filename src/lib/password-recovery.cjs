const {randomBytes,createHash}=require('node:crypto');
const {createNotificationEngine}=require('./notification-engine.cjs');
const digest=value=>createHash('sha256').update(value).digest('hex');
function createPasswordRecovery(db,{hashPassword,verifyPassword,engine=createNotificationEngine(db),now=Date.now}){
 function validPassword(value){return typeof value==='string'&&value.length>=12&&Buffer.byteLength(value)<=72;}
 async function request(identifier){
  const user=db.prepare("SELECT id,email FROM users WHERE lower(email)=lower(?) AND status IN ('approved','pending')").get(identifier);if(!user)return;
  const recent=db.prepare('SELECT count(*) n FROM password_reset_tokens WHERE user_id=? AND created_at>?').get(user.id,now()-3600000).n;if(recent>=3)return;
  const token=randomBytes(32).toString('base64url');
  const prepared=db.transaction(()=>{
   const mail=engine.reserveMail(user.id,'password_reset','CONECTA · Recupera tu acceso','Has solicitado restablecer tu contraseña. El enlace caduca en 30 minutos y solo puede usarse una vez. Si no lo solicitaste, ignora este mensaje. No compartas el enlace.','/restablecer-acceso#token='+token);
   if(mail && db.prepare('SELECT status FROM email_dispatches WHERE id=?').get(mail.id).status==='prepared')db.prepare('INSERT INTO password_reset_tokens VALUES (?,?,?,?)').run(digest(token),user.id,now()+1800000,now());
   return mail;
  }).immediate();
  try{const state=await engine.deliver(prepared);if(state==='failed'||state==='not_sent')db.prepare('DELETE FROM password_reset_tokens WHERE token_hash=?').run(digest(token));}catch{/* Keep single-use token for an uncertain delivery; never retry. */}
 }
 async function reset(token,password){
  if(typeof token!=='string'||!/^[A-Za-z0-9_-]{43}$/.test(token)||!validPassword(password))throw new Error('Enlace inválido o contraseña fuera de los límites (12 caracteres y 72 bytes).');
  const hash=digest(token);if(!db.prepare("SELECT 1 FROM password_reset_tokens t JOIN users u ON u.id=t.user_id WHERE token_hash=? AND expires_at>? AND u.status IN ('approved','pending')").get(hash,now()))throw new Error('El enlace no es válido o ha caducado. Solicita uno nuevo.');
  const passwordHash=await hashPassword(password);
  const prepared=db.transaction(()=>{
   const row=db.prepare("SELECT t.user_id FROM password_reset_tokens t JOIN users u ON u.id=t.user_id WHERE token_hash=? AND expires_at>? AND u.status IN ('approved','pending')").get(hash,now());if(!row)throw new Error('El enlace no es válido o ha caducado. Solicita uno nuevo.');
   db.prepare('UPDATE users SET password_hash=?,updated_at=? WHERE id=?').run(passwordHash,Math.floor(now()/1000),row.user_id);
   db.prepare('DELETE FROM sessions WHERE user_id=?').run(row.user_id);db.prepare('DELETE FROM password_reset_tokens WHERE user_id=?').run(row.user_id);
   return engine.reserveMail(row.user_id,'password_changed','CONECTA · Contraseña actualizada','La contraseña de tu cuenta ha cambiado y se han cerrado todas las sesiones anteriores. Si no realizaste este cambio, contacta con la administración de CONECTA.','/login');
  }).immediate();return prepared;
 }
 async function change(userId,current,password){
  const user=db.prepare("SELECT password_hash FROM users WHERE id=? AND status='approved'").get(userId);
  if(typeof current!=='string'||Buffer.byteLength(current)>72||!user||!await verifyPassword(current,user.password_hash))throw new Error('La contraseña actual no es correcta.');
  if(!validPassword(password))throw new Error('La nueva contraseña debe tener al menos 12 caracteres y como máximo 72 bytes.');
  const hash=await hashPassword(password);
  return db.transaction(()=>{
   const changed=db.prepare('UPDATE users SET password_hash=?,updated_at=? WHERE id=? AND password_hash=?').run(hash,Math.floor(now()/1000),userId,user.password_hash);if(!changed.changes)throw new Error('La cuenta cambió. Vuelve a iniciar sesión.');
   db.prepare('DELETE FROM sessions WHERE user_id=?').run(userId);db.prepare('DELETE FROM password_reset_tokens WHERE user_id=?').run(userId);
   return engine.reserveMail(userId,'password_changed','CONECTA · Contraseña actualizada','Has cambiado tu contraseña. Todas las sesiones anteriores se han cerrado. Si no reconoces este cambio, contacta con la administración.','/login');
  }).immediate();
 }
 return {request,reset,change};
}
module.exports={createPasswordRecovery};
