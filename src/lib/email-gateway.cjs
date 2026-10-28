const TOKEN_URL='https://identidad.reduniv.edu.cu/realms/interoperabilidad/protocol/openid-connect/token';
const EMAIL_URL='https://api.reduniv.edu.cu/api/v1/notifications/email';
function createEmailGateway({config,fetchImpl=fetch,now=Date.now}) {
  let cached=null, pending=null;
  async function token() {
    if(cached && cached.until>now()+30000)return cached.value;
    if(pending)return pending;
    pending=(async()=>{
      if(!config.clientId || !config.clientSecret)throw new Error('OAUTH_NOT_CONFIGURED');
      const response=await fetchImpl(TOKEN_URL,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'client_credentials',client_id:config.clientId,client_secret:config.clientSecret}),redirect:'error',signal:AbortSignal.timeout(15000)});
      if(!response.ok)throw new Error('OAUTH_REJECTED');
      const data=await response.json();
      if(typeof data.access_token!=='string'||data.token_type?.toLowerCase()!=='bearer')throw new Error('OAUTH_INVALID_RESPONSE');
      let claims;try{claims=JSON.parse(Buffer.from(data.access_token.split('.')[1],'base64url').toString('utf8'));}catch{throw new Error('OAUTH_INVALID_RESPONSE');}
      const audience=Array.isArray(claims.aud)?claims.aud:[claims.aud];
      const roles=[...(claims.realm_access?.roles||[]),...Object.values(claims.resource_access||{}).flatMap(resource=>resource.roles||[])];
      if(!audience.includes('mes-api')||!roles.includes('notification-sender'))throw new Error('OAUTH_MISSING_PERMISSION');
      const until=Math.min(Number(claims.exp)*1000,now()+Number(data.expires_in)*1000);
      if(!Number.isFinite(until)||until<=now()+5000)throw new Error('OAUTH_INVALID_RESPONSE');
      cached={value:data.access_token,until};return cached.value;
    })();
    try{return await pending;}finally{pending=null;}
  }
  async function send(message,correlationId) {
    let bearer;
    try{bearer=await token();}catch(error){return {status:'failed',code:['OAUTH_NOT_CONFIGURED','OAUTH_REJECTED','OAUTH_INVALID_RESPONSE','OAUTH_MISSING_PERMISSION'].includes(error.message)?error.message:'OAUTH_UNAVAILABLE',correlationId};}
    try {
      const response=await fetchImpl(EMAIL_URL,{method:'POST',headers:{Authorization:'Bearer '+bearer,'Content-Type':'application/json','X-Correlation-ID':correlationId},body:JSON.stringify(message),redirect:'error',signal:AbortSignal.timeout(20000)});
      const data=await response.json().catch(()=>null);
      const returnedId=typeof data?.correlationId==='string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(data.correlationId)?data.correlationId:correlationId;
      if(response.status===202 && data?.status==='accepted_by_relay')return {status:'accepted',code:'accepted_by_relay',correlationId:returnedId};
      if(response.status===401)cached=null;
      return {status:response.status>=500 && response.status!==502 && response.status!==503 || response.status===408 || response.ok?'unknown':'failed',code:'RELAY_HTTP_'+response.status,correlationId:returnedId};
    } catch {return {status:'unknown',code:'RELAY_RESULT_UNKNOWN',correlationId};}
  }
  return {send};
}
module.exports={createEmailGateway};
