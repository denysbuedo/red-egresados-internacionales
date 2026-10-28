const {test}=require('node:test');const assert=require('node:assert/strict');const {accessEmail}=require('../src/lib/access-email-template.cjs');
test('three account lifecycle emails use CONECTA identity, fixed links, safe markup and no credentials',()=>{
 for(const kind of ['access_received','access_approved','access_rejected']){
  const mail=accessEmail(kind,{name:'Ana <script> & equipo',reason:'Información <incompleta> & pendiente'});
  assert.ok(mail.subject.startsWith('CONECTA'));assert.ok(mail.subject.length<=200);assert.ok(mail.text_body.length<=20000);assert.ok(mail.html_body.length<=50000);assert.ok(!mail.html_body.includes('<script>'));assert.ok(mail.html_body.includes('&lt;script&gt;'));assert.ok(!mail.text_body.includes('servicio de notificaciones de RedUniv'));assert.ok(!mail.text_body.includes('contraseña:'));
  assert.ok(mail.text_body.includes('https://conecta.reduniv.edu.cu/'+(kind==='access_received'?'pendiente':kind==='access_approved'?'login':'ayuda')));
  if(kind==='access_rejected'){assert.ok(mail.text_body.includes('Información <incompleta> & pendiente'));assert.ok(mail.html_body.includes('Información &lt;incompleta&gt; &amp; pendiente'));}
 }
 assert.throws(()=>accessEmail('access_rejected',{name:'Ana'}),/reason/);
});
