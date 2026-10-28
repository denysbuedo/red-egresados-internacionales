const BASE='https://conecta.reduniv.edu.cu';
const escape=value=>String(value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
function accessEmail(kind,{name,reason}){
 const greeting='Hola, '+String(name||'').replace(/\s+/g,' ').trim().slice(0,150)+'.';
 let subject,paragraphs,link,label;
 if(kind==='access_received'){
  subject='CONECTA · Solicitud de acceso recibida';
  paragraphs=[greeting,'Hemos recibido tu solicitud de acceso a CONECTA. Tu cuenta está pendiente de revisión por la administración o los responsables institucionales autorizados.','Te avisaremos por correo cuando se resuelva la solicitud. Mientras tanto, puedes iniciar sesión para consultar su estado.'];
  link=BASE+'/pendiente';label='Consultar mi solicitud';
 }else if(kind==='access_approved'){
  subject='CONECTA · Tu cuenta ha sido aprobada';
  paragraphs=[greeting,'Tu cuenta en CONECTA ha sido aprobada. Ya puedes acceder a la red profesional y académica del Ministerio de Educación Superior.','Una vez dentro, completa tu perfil: institución, cargo, formación e intereses. Así podrás encontrar afinidades y participar en las comunidades.'];
  link=BASE+'/login';label='Entrar a CONECTA';
 }else if(kind==='access_rejected'){
  if(typeof reason!=='string'||!reason.trim())throw new Error('Rejection reason required');
  subject='CONECTA · Resultado de tu solicitud de acceso';
  paragraphs=[greeting,'Tu solicitud de acceso a CONECTA no fue aprobada.','Motivo de la decisión: '+reason.trim(),'Si necesitas aclarar o corregir información, comunícate con la administración de CONECTA o con el responsable de tu institución. Puedes consultar la orientación disponible en Ayuda.'];
  link=BASE+'/ayuda';label='Consultar ayuda';
 }else throw new Error('Unknown access email kind');
 const text_body=paragraphs.join('\n\n')+'\n\n'+label+': '+link+'\n\nCONECTA · Red profesional y académica del MES';
 const html_body='<div style="font-family:Arial,sans-serif;color:#102B46;max-width:620px;margin:auto;border:1px solid #D8E5ED;border-radius:14px;overflow:hidden"><div style="background:#102B46;padding:24px;color:white;font-size:25px;font-weight:bold">conecta<span style="color:#49DCCB">.</span></div><div style="padding:26px;line-height:1.8">'+paragraphs.map(p=>'<p>'+escape(p).replace(/\n/g,'<br>')+'</p>').join('')+'<p><a href="'+link+'" style="display:inline-block;background:#49DCCB;color:#102B46;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:bold">'+label+'</a></p><p style="font-size:12px;color:#637A8D">CONECTA · Red profesional y académica del MES</p></div></div>';
 return {subject,text_body,html_body};
}
module.exports={accessEmail};
