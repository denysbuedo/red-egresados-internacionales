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
  return { username, email: `${username}@example.test`, password, university,
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
    { cwd: process.cwd(), env: {...process.env, DATABASE_PATH:file,NODE_ENV:"production",NEXT_TELEMETRY_DISABLED:"1"}, stdio:["ignore","pipe","pipe"] });
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
  for (const path of ["/api/stats","/api/graduates","/api/graduates/2","/api/email-lists","/api/posts","/api/posts/1/comments","/api/posts/reactions?postId=1","/api/events","/api/groups","/api/groups/1/posts","/api/connections","/api/notifications","/api/admin/users","/api/admin/posts","/api/admin/approvals"]) {
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
