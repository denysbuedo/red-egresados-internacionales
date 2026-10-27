const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { spawn } = require("node:child_process");
const { mkdtempSync, rmSync } = require("node:fs");
const { join } = require("node:path");
const { tmpdir } = require("node:os");
const net = require("node:net");
const { once } = require("node:events");
const { randomBytes, createHash } = require("node:crypto");
const Database = require("better-sqlite3");
const bcrypt = require("bcryptjs");
const { migrate } = require("../scripts/migrate.cjs");

let dir, db, server, base, password;
const cookies = {};
const uniA = "Universidad de prueba A", uniB = "Universidad de prueba B";
async function call(path, { method = "GET", cookie, body, origin = true } = {}) {
  const headers = {};
  if (origin) headers.Origin = origin === true ? base : origin;
  if (cookie) headers.Cookie = cookie;
  if (body !== undefined) headers["Content-Type"] = "application/json";
  return fetch(base + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body), redirect: "manual" });
}
async function login(username) {
  const response = await call("/api/auth/login", { method: "POST", body: { username, password } });
  assert.equal(response.status, 200, `login ${username}`);
  const setCookie = response.headers.get("set-cookie");
  assert.match(setCookie, /HttpOnly/i); assert.match(setCookie, /Secure/i); assert.match(setCookie, /SameSite=lax/i);
  return setCookie.split(";")[0];
}
function profile(username, university = uniA) {
  return { username, email: `${username}@example.test`, password, university, memberType: "staff", employmentConfirmed: true,
    name: "Egresado de prueba", country: "Cuba", career: "Informática", graduationYear: 2020,
    currentProfession: "Desarrollador", role: "admin", status: "approved" };
}
before(async () => {
  dir = mkdtempSync(join(tmpdir(), "egresados-http-")); const file = join(dir,"test.db"); migrate(file);
  db = new Database(file); password = randomBytes(24).toString("base64url");
  const passwordHash = bcrypt.hashSync(password, 10);
  for (const [id, name, role, university] of [[1,"admin","admin",null],[2,"member","user",uniA],[3,"other","user",uniB],[4,"institution","institution",uniA],[5,"editor","editor",null]]) {
    db.prepare("INSERT INTO users (id,username,email,password_hash,role,status,institution_name,pending_university) VALUES (?,?,?,?,?,'approved',?,?)")
      .run(id,name,`${name}@example.test`,passwordHash,role,role==='institution'?university:null,university);
    db.prepare("INSERT INTO graduates (id,user_id,name,email,country,university,career,graduation_year,current_profession) VALUES (?,?,?,?,?,?,?,2020,'Prueba')")
      .run(id,id,name,`${name}@example.test`,'Cuba',university || uniA,'Informática');
    db.prepare("UPDATE users SET graduate_id=? WHERE id=?").run(id,id);
  }
  db.prepare("INSERT INTO connections (id,sender_id,receiver_id,status) VALUES (1,3,5,'pending')").run();
  const listener = net.createServer(); listener.listen(0,"127.0.0.1"); await once(listener,"listening");
  const port = listener.address().port; await new Promise(r=>listener.close(r)); base = `http://127.0.0.1:${port}`;
  server = spawn(process.execPath,["node_modules/next/dist/bin/next","start","-H","127.0.0.1","-p",String(port)],
    { cwd: process.cwd(), env: {...process.env, DATABASE_PATH:file,UPLOADS_PATH:join(dir,"uploads"),NODE_ENV:"production",NEXT_TELEMETRY_DISABLED:"1"}, stdio:["ignore","pipe","pipe"] });
  // Drain output without printing request bodies, cookies or fixture passwords.
  server.stdout.resume(); server.stderr.resume();
  for (let i=0;i<80;i++) {
    try { if ((await call("/login")).status === 200) break; } catch { /* startup */ }
    if (i===79 || server.exitCode!==null) throw new Error("HTTP test server did not start");
    await new Promise(r=>setTimeout(r,250));
  }
  for (const name of ["admin","member","institution","editor"]) cookies[name] = await login(name);
});
after(async () => {
  if (server && server.exitCode===null) { server.kill(); await once(server,"exit"); }
  if (db) db.close();
  if (dir) rmSync(dir,{recursive:true,force:true});
});

test("all business APIs require authentication; legacy cookies cannot impersonate admin", async () => {
  for (const path of ["/api/stats","/api/members","/api/members/2","/api/graduates","/api/graduates/2","/api/email-lists","/api/posts","/api/posts/1/comments","/api/posts/reactions?postId=1","/api/events","/api/groups","/api/groups/1/posts","/api/connections","/api/notifications","/api/admin/users","/api/admin/posts","/api/admin/approvals"]) {
    assert.equal((await call(path)).status,401,path);
  }
  const legacy = 'session='+Buffer.from(JSON.stringify({userId:1,createdAt:Date.now()})).toString('base64');
  assert.equal((await call('/api/admin/users',{cookie:legacy})).status,401);
  assert.equal((await call('/api/auth/me',{cookie:cookies.admin+'modified'})).status,401);
});

test("CSRF rejects missing or foreign origins, including login and logout", async () => {
  for (const origin of [false,"https://attacker.example"]) {
    assert.equal((await call('/api/auth/login',{method:'POST',origin,body:{username:'admin',password}})).status,403);
    assert.equal((await call('/api/auth/logout',{method:'POST',origin,cookie:cookies.admin})).status,403);
    assert.equal((await call('/api/graduates/2',{method:'PUT',origin,cookie:cookies.member,body:{bio:'injected'}})).status,403);
  }
});

test("registration creates pending user and profile atomically and ignores requested privilege", async () => {
  const response = await call('/api/auth/register-complete',{method:'POST',body:profile('newmember')});
  assert.equal(response.status,201); cookies.pending=response.headers.get('set-cookie').split(';')[0];
  const current=await (await call('/api/auth/me',{cookie:cookies.pending})).json();
  assert.equal(current.user.role,'user'); assert.equal(current.user.status,'pending'); assert.ok(current.graduate.id);
  assert.equal((await call('/pendiente',{cookie:cookies.pending})).status,200);
  assert.equal((await call('/api/graduates',{cookie:cookies.pending})).status,403);
  assert.equal((await call('/api/admin/approvals',{cookie:cookies.pending})).status,403);
  // A conflicting graduate email must not leave an orphaned account.
  db.prepare("INSERT INTO graduates (name,email,country,university,career,graduation_year,current_profession) VALUES ('collision','collision@example.test','Cuba',?,'Prueba',2020,'Prueba')").run(uniA);
  assert.equal((await call('/api/auth/register-complete',{method:'POST',body:profile('collision')})).status,409);
  assert.equal(db.prepare("SELECT count(*) AS n FROM users WHERE username='collision'").get().n,0);
  assert.equal((await call('/api/auth/register-complete',{method:'POST',body:{...profile('weak'),password:'short'}})).status,400);
});

test("institution approvals are limited to their university; approval opens existing session", async () => {
  const b=await call('/api/auth/register-complete',{method:'POST',body:profile('othercampus',uniB)});
  assert.equal(b.status,201); cookies.otherPending=b.headers.get('set-cookie').split(';')[0];
  const rows=await (await call('/api/admin/approvals',{cookie:cookies.institution})).json();
  assert.ok(rows.some(r=>r.username==='newmember')); assert.ok(rows.every(r=>r.graduateUniversity===uniA));
  const target=db.prepare("SELECT id FROM users WHERE username='newmember'").get().id;
  const outside=db.prepare("SELECT id FROM users WHERE username='othercampus'").get().id;
  assert.equal((await call('/api/admin/approvals',{method:'PUT',cookie:cookies.institution,body:{userId:outside,action:'approve'}})).status,403);
  assert.equal((await call('/api/admin/approvals',{method:'PUT',cookie:cookies.member,body:{userId:target,action:'approve'}})).status,403);
  assert.equal((await call('/api/admin/approvals',{method:'PUT',cookie:cookies.institution,body:{userId:1,action:'reject',reason:'invalid'}})).status,403);
  assert.equal((await call('/api/admin/approvals',{method:'PUT',cookie:cookies.institution,body:{userId:target,action:'approve'}})).status,200);
  const current=await (await call('/api/auth/me',{cookie:cookies.pending})).json(); assert.equal(current.user.status,'approved');
  assert.equal((await call('/api/graduates',{cookie:cookies.pending})).status,200);
  assert.equal((await call('/directorio',{cookie:cookies.pending})).status,200);
  assert.equal((await call('/pendiente',{cookie:cookies.pending})).status,307);
  assert.equal((await call('/api/admin/approvals',{method:'PUT',cookie:cookies.admin,body:{userId:outside,action:'reject',reason:'Datos incompletos'}})).status,200);
  assert.equal((await call('/api/auth/me',{cookie:cookies.otherPending})).status,401);
  assert.equal((await call('/api/auth/login',{method:'POST',body:{username:'othercampus',password}})).status,403);
});

test("members cannot edit other profiles, cancel others' connections or export mailing lists", async () => {
  const before=db.prepare('SELECT name FROM graduates WHERE id=3').get().name;
  assert.equal((await call('/api/graduates/3',{method:'PUT',cookie:cookies.member,body:{name:'injected'}})).status,403);
  assert.equal((await call('/api/graduates/3',{method:'DELETE',cookie:cookies.member})).status,403);
  assert.equal(db.prepare('SELECT name FROM graduates WHERE id=3').get().name,before);
  assert.equal((await call('/api/connections?id=1',{method:'DELETE',cookie:cookies.member})).status,404);
  assert.ok(db.prepare('SELECT id FROM connections WHERE id=1').get());
  assert.equal((await call('/api/email-lists',{cookie:cookies.member})).status,403);
  assert.equal((await call('/api/email-lists',{cookie:cookies.institution})).status,403);
  assert.equal((await call('/api/email-lists',{cookie:cookies.admin})).status,200);
  const profiles=await (await call('/api/graduates',{cookie:cookies.member})).json();
  assert.ok(profiles.every(p=>!('email' in p) && !('phone' in p) && !('userId' in p)));
});

test("logout revokes replay and expiry is enforced server-side", async () => {
  const cookie=await login('member@example.test');
  assert.equal((await call('/api/auth/logout',{method:'POST',cookie})).status,200);
  assert.equal((await call('/api/auth/me',{cookie})).status,401);
  const expiring=await login('member'); const token=expiring.slice(expiring.indexOf('=')+1);
  db.prepare('UPDATE sessions SET expires_at=0 WHERE token_hash=?').run(createHash('sha256').update(token).digest('hex'));
  assert.equal((await call('/api/auth/me',{cookie:expiring})).status,401);
});

test("login throttling persists and limits repeated guesses", async () => {
  for(let i=0;i<10;i++) assert.equal((await call('/api/auth/login',{method:'POST',body:{username:'absent',password:'wrong-password'}})).status,401);
  const blocked=await call('/api/auth/login',{method:'POST',body:{username:'absent',password:'wrong-password'}});
  assert.equal(blocked.status,429); assert.equal(blocked.headers.get('retry-after'),'900');
});

test("editor can publish content but cannot administer users, institutions have a working panel", async () => {
  assert.equal((await call('/universidad',{cookie:cookies.institution})).status,200);
  assert.equal((await call('/admin/posts',{cookie:cookies.editor})).status,200);
  assert.equal((await call('/api/admin/users',{cookie:cookies.editor})).status,403);
  assert.equal((await call('/api/admin/approvals',{cookie:cookies.editor})).status,403);
  const news=await call('/api/admin/posts',{method:'POST',cookie:cookies.editor,body:{title:'Noticia de prueba',content:'Contenido editorial de prueba suficientemente largo.'}});
  assert.equal(news.status,201); assert.equal((await news.json()).authorId,5);
  const event=await call('/api/events',{method:'POST',cookie:cookies.editor,body:{title:'Evento de prueba',description:'Encuentro académico',date:'2027-01-01T12:00:00Z',type:'virtual'}});
  assert.equal(event.status,201); assert.equal((await event.json()).organizerId,5);
  assert.equal((await call('/api/admin/users',{method:'PUT',cookie:cookies.admin,body:{id:2,role:'superadmin'}})).status,400);
  assert.equal((await call('/api/admin/users',{method:'PUT',cookie:cookies.admin,body:{id:2,role:'institution'}})).status,400);
  assert.equal((await call('/api/graduates/2',{method:'PUT',cookie:cookies.member,body:{website:'javascript:alert(1)'}})).status,400);
});


test("first stage accepts workers without graduation requirements, not student registration", async () => {
  assert.equal((await call('/api/auth/register-complete',{method:'POST',body:{...profile('studentonly'),memberType:'student'}})).status,403);
  assert.equal(db.prepare("SELECT count(*) n FROM users WHERE username='studentonly'").get().n,0);
  assert.equal((await call('/api/auth/register-complete',{method:'POST',body:{...profile('notconfirmed'),employmentConfirmed:false}})).status,400);
  for (const memberType of ['teacher','researcher','specialist','technician','administrative','manager','staff']) {
    const response=await call('/api/auth/register-complete',{method:'POST',body:{...profile('worker_'+memberType),memberType,graduationYear:null,career:''}});
    assert.equal(response.status,201,memberType);
  }
  const response=await call('/api/auth/register-complete',{method:'POST',body:{...profile('centralworker'),institution:'Ministerio de Educación Superior',memberType:'specialist',graduationYear:null,career:''}});
  assert.equal(response.status,201);
  const cookie=response.headers.get('set-cookie').split(';')[0];
  const account=await (await call('/api/auth/me',{cookie})).json();
  assert.equal(account.user.pendingInstitution,'Ministerio de Educación Superior');
  assert.equal(account.graduate.graduationYear,null);
  assert.equal(account.graduate.memberType,'specialist'); assert.equal(account.graduate.employmentConfirmed,true);
  const registrationHtml=await (await call('/register')).text();
  assert.ok(!registrationHtml.includes('value="student"'));
  assert.ok(registrationHtml.includes('employmentConfirmed'));
});

test("generic member and institution routes keep legacy profile identifiers and permissions", async () => {
  const canonical=await (await call('/api/members/2',{cookie:cookies.member})).json();
  const legacy=await (await call('/api/graduates/2',{cookie:cookies.member})).json();
  assert.deepEqual(canonical,legacy); assert.equal(canonical.id,2);
  assert.equal((await call('/miembros/2',{cookie:cookies.member})).status,200);
  assert.equal((await call('/institucion',{cookie:cookies.institution})).status,200);
});

test("legacy affiliation is self-service and requires a new scoped institutional approval", async () => {
  assert.equal((await call('/api/auth/affiliation',{method:'POST',body:{}})).status,401);
  assert.equal((await call('/api/members/2',{method:'PUT',cookie:cookies.member,body:{memberType:'student'}})).status,400);
  const unchanged=db.prepare('SELECT university FROM graduates WHERE user_id=3').get().university;
  const body={institution:uniB,memberType:'researcher',currentProfession:'Investigador',currentCompany:'Centro de investigación',employmentConfirmed:true,userId:3,role:'admin'};
  assert.equal((await call('/api/auth/affiliation',{method:'POST',cookie:cookies.member,origin:'https://attacker.example',body})).status,403);
  assert.equal((await call('/api/auth/affiliation',{method:'POST',cookie:cookies.member,body})).status,200);
  assert.equal(db.prepare('SELECT university FROM graduates WHERE user_id=3').get().university,unchanged);
  assert.equal(db.prepare('SELECT role FROM users WHERE id=2').get().role,'user');
  assert.equal((await call('/api/members',{cookie:cookies.member})).status,403);
  assert.equal((await call('/completar-perfil',{cookie:cookies.member})).status,200);
  assert.equal((await call('/api/admin/approvals',{method:'PUT',cookie:cookies.institution,body:{userId:2,action:'approve'}})).status,403);
  assert.equal((await call('/api/admin/approvals',{method:'PUT',cookie:cookies.admin,body:{userId:2,action:'approve'}})).status,200);
  assert.equal((await call('/api/members',{cookie:cookies.member})).status,200);
  // Historical records cannot be approved before submitting employment details.
  db.prepare("UPDATE users SET status='pending' WHERE id=3").run();
  assert.equal((await call('/api/admin/approvals',{method:'PUT',cookie:cookies.admin,body:{userId:3,action:'approve'}})).status,409);
});

test("professional contributions keep type and resource and filter correctly", async () => {
  assert.equal((await call('/api/posts',{method:'POST',cookie:cookies.member,body:{content:'A valid contribution',postType:'publication',referenceUrl:'javascript:alert(1)'}})).status,400);
  assert.equal((await call('/api/posts',{method:'POST',cookie:cookies.member,body:{content:'A valid contribution',postType:'social-game'}})).status,400);
  const publication=await call('/api/posts',{method:'POST',cookie:cookies.member,body:{content:'Resultado científico de prueba',postType:'publication',referenceUrl:'https://doi.org/10.0000/example'}});
  assert.equal(publication.status,201); const p=await publication.json(); assert.equal(p.postType,'publication');
  const project=await call('/api/posts',{method:'POST',cookie:cookies.member,body:{content:'Proyecto de colaboración de prueba',postType:'project',referenceUrl:'https://example.test/project'}});
  assert.equal(project.status,201);
  const list=await (await call('/api/posts?type=publication',{cookie:cookies.member})).json();
  assert.ok(list.some(row=>row.id===p.id)); assert.ok(list.every(row=>row.postType==='publication'));
  const html=await (await call('/?type=project',{cookie:cookies.member})).text();
  assert.ok(html.includes('Proyecto de colaboración de prueba')); assert.ok(html.includes('Consultar recurso original'));
  assert.ok(!html.includes('Resultado científico de prueba'));
});

test("pending accounts without a profile can complete only their own employment profile", async () => {
  const id=db.prepare("INSERT INTO users (username,email,password_hash,role,status) VALUES ('incomplete','incomplete@example.test',?,'user','pending')").run(bcrypt.hashSync(password,10)).lastInsertRowid;
  const cookie=await login('incomplete');
  assert.equal((await call('/completar-perfil',{cookie})).status,200);
  const response=await call('/api/members',{method:'POST',cookie,body:{name:'Perfil pendiente',country:'Cuba',institution:uniA,memberType:'technician',currentProfession:'Técnico',employmentConfirmed:true,graduationYear:null,userId:1,role:'admin'}});
  assert.equal(response.status,201); const created=await response.json();
  assert.equal(created.userId,Number(id)); assert.equal(created.graduationYear,null);
  assert.equal(db.prepare('SELECT role FROM users WHERE id=?').get(id).role,'user');
  assert.equal((await call('/api/members',{cookie})).status,403);
  assert.equal((await call('/api/admin/approvals',{method:'PUT',cookie:cookies.institution,body:{userId:Number(id),action:'approve'}})).status,200);
  assert.equal((await call('/api/members',{cookie})).status,200);
});

test("CONECTA identity, logos, metadata and public links match the supplied kit", async () => {
  const home=await call('/'); assert.equal(home.status,200); const html=await home.text();
  assert.ok(html.includes('Donde la ciencia y la tecnología se encuentran.'));
  assert.ok(html.includes('conecta-logo-principal.svg')); assert.ok(html.includes('og-conecta-1200x630.png'));
  assert.ok(html.includes('Próximamente')); assert.ok(!html.includes('Red MES'));
  for(const path of ['/ayuda','/privacidad','/login','/register']) assert.equal((await call(path)).status,200,path);
  const login=await (await call('/login')).text();
  assert.ok(login.includes('Bienvenido a CONECTA')); assert.ok(login.includes('Correo electrónico o usuario'));
  const logo=await call('/brand/conecta-logo-principal.svg'); assert.equal(logo.status,200);
  const fs=require('node:fs');
  assert.deepEqual(Buffer.from(await logo.arrayBuffer()),fs.readFileSync('diseño/01_Logotipos/SVG/conecta-logo-principal.svg'));
  const icon=await call('/brand/favicon.svg'); assert.equal(icon.status,200);
});

test("workspace shows real upcoming events and approved people without exposing private contact data", async () => {
  const future=Math.floor(Date.now()/1000)+86400*20, past=future-86400*40;
  const insert=db.prepare("INSERT INTO events (title,description,date,type,organizer_id) VALUES (?, 'Encuentro de prueba', ?, 'virtual', 2)");
  const upcoming=insert.run('Workspace future event',future).lastInsertRowid;
  const expired=insert.run('Workspace past event',past).lastInsertRowid;
  try {
    const response=await call('/',{cookie:cookies.institution});assert.equal(response.status,200);
    const html=await response.text();
    assert.ok(html.includes('TU ESPACIO EN CONECTA'));
    assert.ok(html.includes('Workspace future event'));assert.ok(!html.includes('Workspace past event'));
    assert.ok(html.includes('Personas de la comunidad'));assert.ok(html.includes('other'));
    assert.ok(!html.includes('othercampus@example.test'));assert.ok(!html.includes('other@example.test'));
    assert.ok(html.includes('Mi institución'));assert.ok(html.includes('Actualizar mi vínculo'));
    assert.ok(!html.includes('href="/admin"'));
    const anonymous=await (await call('/')).text();assert.ok(!anonymous.includes('Workspace future event'));
    const pending=await call('/',{cookie:cookies.otherPending});assert.equal(pending.status,200);
    assert.ok(!(await pending.text()).includes('TU ESPACIO EN CONECTA'));
  } finally { db.prepare('DELETE FROM events WHERE id IN (?,?)').run(upcoming,expired); }
});

test("image uploads validate content, protect access and survive as local post attachments", async () => {
  const sharp=require('sharp');
  const bytes=await sharp({create:{width:2400,height:1200,channels:3,background:'#49DCCB'}}).png().withMetadata({orientation:1}).toBuffer();
  const upload=async (cookie,content=bytes,type='image/png',origin=base) => {
    const form=new FormData();form.set('file',new Blob([content],{type}),'uploaded.png');
    return fetch(base+'/api/media',{method:'POST',headers:{Origin:origin,...(cookie?{Cookie:cookie}:{})},body:form});
  };
  assert.equal((await upload()).status,401);
  assert.equal((await upload(cookies.editor,bytes,'image/png','https://attacker.test')).status,403);
  const pending=await login('centralworker');assert.equal((await upload(pending)).status,403);
  assert.equal((await upload(cookies.editor,Buffer.from('<svg></svg>'),'image/svg+xml')).status,400);
  assert.equal((await upload(cookies.editor,Buffer.from('<svg></svg>'),'image/png')).status,400);
  assert.equal((await upload(cookies.editor,Buffer.alloc(8*1024*1024+1))).status,413);
  const response=await upload(cookies.editor);assert.equal(response.status,201);
  const {url}=await response.json();assert.match(url,/^\/api\/media\/[a-f0-9-]+\.webp$/);
  assert.equal((await call(url)).status,401);
  assert.equal((await call(url,{cookie:pending})).status,403);
  const image=await call(url,{cookie:cookies.editor});assert.equal(image.status,200);
  assert.equal(image.headers.get('content-type'),'image/webp');assert.equal(image.headers.get('cache-control'),'private, no-store');
  const saved=Buffer.from(await image.arrayBuffer());const metadata=await sharp(saved).metadata();
  assert.equal(metadata.format,'webp');assert.ok(metadata.width<=2048 && metadata.height<=2048);assert.equal(metadata.exif,undefined);
  assert.equal((await call('/api/media/not-a-filename',{cookie:cookies.editor})).status,404);
  const news=await call('/api/admin/posts',{method:'POST',cookie:cookies.editor,body:{title:'Imagen almacenada',content:'Noticia con imagen guardada directamente en CONECTA.',imageUrl:url}});
  assert.equal(news.status,201);assert.equal((await news.json()).imageUrl,url);
  assert.equal((await call('/api/admin/posts',{method:'POST',cookie:cookies.editor,body:{title:'Imagen invalida',content:'Una imagen con direccion no permitida.',imageUrl:'file:///etc/passwd'}})).status,400);
});

test("professional profile editor saves own data and uploaded portrait without changing credentials or affiliation", async () => {
  const owner=await login('editor');
  const original=db.prepare('SELECT * FROM users WHERE id=5').get();
  const profile=db.prepare('SELECT * FROM graduates WHERE id=5').get();
  const photo=db.prepare("SELECT image_url FROM admin_posts WHERE title='Imagen almacenada'").get().image_url;
  const editing=await call('/miembros/5/editar',{cookie:owner});assert.equal(editing.status,200);
  assert.ok((await editing.text()).includes('Un perfil que hable de ti.'));
  assert.equal((await call('/miembros/2/editar',{cookie:owner})).status,404);
  const payload={name:'Profesional de prueba actualizado',email:'editor.contact@example.test',country:'Cuba',city:'La Habana',currentProfession:'Investigador',currentCompany:'Centro de prueba',career:'Gestión del conocimiento',graduationYear:null,bio:'Colaboración científica y ciencia abierta.',skills:'Ciencia abierta, Datos',interests:'Redes académicas',languages:'Español, Inglés',phone:'+53 50000000',website:'https://example.test',linkedin:'https://linkedin.com/in/example',photoUrl:photo,userId:1,role:'admin',employmentConfirmed:true};
  const saved=await call('/api/members/5',{method:'PUT',cookie:owner,body:payload});assert.equal(saved.status,200);
  const record=db.prepare('SELECT * FROM graduates WHERE id=5').get();assert.equal(record.name,payload.name);assert.equal(record.photo_url,photo);assert.equal(record.graduation_year,0);assert.equal(record.user_id,5);
  assert.equal(record.member_type,profile.member_type);assert.equal(record.employment_confirmed,profile.employment_confirmed);
  assert.deepEqual(db.prepare('SELECT * FROM users WHERE id=5').get(),original);
  const html=await (await call('/miembros/5?actualizado=1',{cookie:owner})).text();
  assert.ok(html.includes('Tu perfil se actualizó correctamente.'));assert.ok(html.includes(payload.bio));assert.ok(html.includes('Conocimientos y habilidades'));assert.ok(html.includes('href="/miembros/5/editar"'));
  const locked=await (await call('/miembros/5',{cookie:cookies.member})).text();assert.ok(!locked.includes(payload.email));assert.ok(!locked.includes(payload.phone));assert.ok(!locked.includes('href="/miembros/5/editar"'));
  assert.equal((await call('/api/members/5',{method:'PUT',cookie:owner,body:{name:'   '}})).status,400);
  assert.equal((await call('/api/members/5',{method:'PUT',cookie:owner,body:{email:'not-an-email'}})).status,400);
  assert.equal((await call('/api/members/5',{method:'PUT',cookie:owner,body:{photoUrl:'javascript:alert(1)'}})).status,400);
  assert.equal((await call('/api/members/5',{method:'PUT',cookie:owner,body:{photoUrl:false}})).status,400);
  assert.equal((await call('/api/members/5',{method:'PUT',cookie:owner,body:{institution:'Otra institución'}})).status,409);
  const conflict=await call('/api/members/5',{method:'PUT',cookie:owner,body:{email:'member@example.test'}});assert.equal(conflict.status,409);
});
