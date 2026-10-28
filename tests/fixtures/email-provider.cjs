// Test-process preload only: no production URLs are contacted.
const {readFileSync,appendFileSync}=require('node:fs');
const original=globalThis.fetch;
globalThis.fetch=async function(input,options){
 const url=String(input);
 if(url.startsWith('https://identidad.reduniv.edu.cu/')||url.startsWith('https://api.reduniv.edu.cu/')){
  if(!process.env.NOTIFICATION_TEST_STATE||!process.env.NOTIFICATION_TEST_LOG)throw new Error('Test provider unavailable');
  const state=JSON.parse(readFileSync(process.env.NOTIFICATION_TEST_STATE,'utf8'));
  const response=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json'}});
  if(url.includes('/token'))return response({access_token:'header.'+Buffer.from(JSON.stringify({aud:['mes-api'],realm_access:{roles:['notification-sender']},exp:Math.floor(Date.now()/1000)+300})).toString('base64url')+'.signature',token_type:'Bearer',expires_in:300});
  const body=JSON.parse(options.body);const Database=require('better-sqlite3');const db=new Database(process.env.DATABASE_PATH,{readonly:true,fileMustExist:true});let accountStatus;try{accountStatus=db.prepare('SELECT status FROM users WHERE email=?').get(body.recipient)?.status;}finally{db.close();}
  appendFileSync(process.env.NOTIFICATION_TEST_LOG,JSON.stringify({accountStatus,recipient:body.recipient,subject:body.subject,textBody:body.text_body,htmlBody:body.html_body,correlationId:options.headers['X-Correlation-ID']})+'\n');
  if(state.mode==='timeout')throw new Error('Simulated timeout');
  return state.mode==='accepted'?response({status:'accepted_by_relay'},202):response({code:'SIMULATED',correlationId:options.headers['X-Correlation-ID']},state.mode);
 }
 return original(input,options);
};
