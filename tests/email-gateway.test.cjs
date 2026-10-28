const {test}=require('node:test');
const assert=require('node:assert/strict');
const {createEmailGateway}=require('../src/lib/email-gateway.cjs');
const config={clientId:'fixture',clientSecret:'fixture-secret'};
const correlationId='12345678-1234-4234-8234-123456789abc';
const message={recipient:'fixture@example.test',subject:'Aviso',text_body:'Mensaje'};
function token(claims={}){return {access_token:'header.'+Buffer.from(JSON.stringify({aud:['mes-api'],realm_access:{roles:['notification-sender']},exp:Math.floor(Date.now()/1000)+300,...claims})).toString('base64url')+'.signature',token_type:'Bearer',expires_in:300};}
const response=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json'}});
test('OAuth uses form credentials and fixed HTTPS endpoints; accepted means relay acceptance; concurrent calls share token',async()=>{
 const calls=[];const gateway=createEmailGateway({config,fetchImpl:async(url,options)=>{calls.push({url,options});return url.includes('/token')?response(token()):response({status:'accepted_by_relay'},202);}});
 const result=await Promise.all([gateway.send(message,correlationId),gateway.send(message,correlationId)]);assert.ok(result.every(r=>r.status==='accepted'));assert.equal(calls.filter(c=>c.url.includes('/token')).length,1);
 const auth=calls[0];assert.match(auth.url,/^https:\/\/identidad\.reduniv\.edu\.cu\//);assert.equal(auth.options.headers['Content-Type'],'application/x-www-form-urlencoded');assert.equal(auth.options.body.get('grant_type'),'client_credentials');assert.equal(auth.options.body.get('client_id'),'fixture');assert.equal(auth.options.body.get('client_secret'),'fixture-secret');
 const email=calls.find(c=>c.url.includes('/notifications/email'));assert.match(email.url,/^https:\/\/api\.reduniv\.edu\.cu\//);assert.equal(email.options.headers['X-Correlation-ID'],correlationId);assert.equal(email.options.redirect,'error');assert.deepEqual(JSON.parse(email.options.body),message);
});
test('wrong audience or missing role prevents email request',async()=>{
 for(const claims of [{aud:['other']},{realm_access:{roles:[]}}]){let calls=0;const gateway=createEmailGateway({config,fetchImpl:async()=>{calls++;return response(token(claims));}});assert.equal((await gateway.send(message,correlationId)).code,'OAUTH_MISSING_PERMISSION');assert.equal(calls,1);}
});
test('email timeout and internal error are uncertain, without retry',async()=>{
 for(const mode of ['timeout',500]){let calls=0;const gateway=createEmailGateway({config,fetchImpl:async url=>{calls++;if(url.includes('/token'))return response(token());if(mode==='timeout')throw new Error('secret upstream details');return response({code:'INTERNAL_ERROR',correlationId},mode);}});const result=await gateway.send(message,correlationId);assert.equal(result.status,'unknown');assert.equal(calls,2);assert.ok(!JSON.stringify(result).includes('secret'));}
});
test('relay rejection and unavailable configuration are not retried',async()=>{
 for(const status of [401,403,422,502,503]){let sends=0;const gateway=createEmailGateway({config,fetchImpl:async url=>{if(url.includes('/token'))return response(token());sends++;return response({code:'UPSTREAM',correlationId},status);}});assert.equal((await gateway.send(message,correlationId)).status,'failed');assert.equal(sends,1);}
});
test('unexpected success and malformed accepted response remain uncertain',async()=>{
 for(const status of [200,202]){let sends=0;const gateway=createEmailGateway({config,fetchImpl:async url=>url.includes('/token')?response(token()):(sends++,response({status:'other'},status))});assert.equal((await gateway.send(message,correlationId)).status,'unknown');assert.equal(sends,1);}
});
test('OAuth failure never calls email and does not leak secrets',async()=>{
 const gateway=createEmailGateway({config,fetchImpl:async()=>{throw new Error('fixture-secret');}});const result=await gateway.send(message,correlationId);assert.equal(result.status,'failed');assert.equal(result.code,'OAUTH_UNAVAILABLE');assert.ok(!JSON.stringify(result).includes('fixture-secret'));
});
