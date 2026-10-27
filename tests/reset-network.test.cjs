const {test}=require('node:test');
const assert=require('node:assert/strict');
const Database=require('better-sqlite3');
const {mkdtempSync,rmSync}=require('node:fs');
const {tmpdir}=require('node:os');const {join}=require('node:path');
const {migrate}=require('../scripts/migrate.cjs');
const {resetNetwork}=require('../scripts/reset-network.cjs');

test('network reset keeps exact admin account, profile, sessions and migrations and clears business data',()=>{
 const dir=mkdtempSync(join(tmpdir(),'conecta-reset-')),file=join(dir,'test.db');migrate(file);const db=new Database(file);db.pragma('foreign_keys = ON');
 try {
  for(const [id,name,role] of [[1,'dinfo','admin'],[2,'other','user']]) {
   db.prepare("INSERT INTO users (id,username,email,password_hash,role,status) VALUES (?,?,?,'hash-unchanged',?,'approved')").run(id,name,name+'@example.test',role);
   db.prepare("INSERT INTO graduates (id,user_id,name,email,country,university,career,graduation_year,current_profession) VALUES (?,?,?,?,'Cuba','Institucion','Carrera',2020,'Profesional')").run(id,id,name,name+'@example.test');
   db.prepare('UPDATE users SET graduate_id=? WHERE id=?').run(id,id);
   db.prepare('INSERT INTO sessions (token_hash,user_id,expires_at) VALUES (?,?,?)').run('token'+id,id,Date.now()+1000000);
   db.prepare("INSERT INTO user_posts (graduate_id,content) VALUES (?,'contenido')").run(id);
  }
  db.prepare("INSERT INTO connections (sender_id,receiver_id,status) VALUES (1,2,'accepted')").run();
  db.prepare("INSERT INTO admin_posts (title,content,author_name,author_id) VALUES ('noticia','contenido','dinfo',1)").run();
  const account=db.prepare('SELECT * FROM users WHERE id=1').get(),profile=db.prepare('SELECT * FROM graduates WHERE id=1').get(),migrations=db.prepare('SELECT * FROM app_migrations').all();
  assert.throws(()=>resetNetwork(db,'missing'),/administrator/);assert.equal(db.prepare('SELECT count(*) AS n FROM users').get().n,2);
  db.exec("CREATE TRIGGER block_reset BEFORE DELETE ON graduates BEGIN SELECT RAISE(ABORT,'blocked reset test'); END");
  assert.throws(()=>resetNetwork(db,'dinfo'),/blocked reset test/);
  assert.equal(db.prepare('SELECT count(*) AS n FROM users').get().n,2);
  assert.equal(db.prepare('SELECT count(*) AS n FROM user_posts').get().n,2);
  assert.equal(db.prepare('SELECT count(*) AS n FROM sessions').get().n,2);
  db.exec('DROP TRIGGER block_reset');
  const counts=resetNetwork(db,'dinfo');
  assert.equal(counts.users,1);assert.equal(counts.graduates,1);assert.equal(counts.sessions,1);
  for(const [table,count] of Object.entries(counts)) if(!['users','graduates','sessions','app_migrations'].includes(table)) assert.equal(count,0,table);
  assert.deepEqual(db.prepare('SELECT * FROM users').get(),account);assert.deepEqual(db.prepare('SELECT * FROM graduates').get(),profile);assert.deepEqual(db.prepare('SELECT * FROM app_migrations').all(),migrations);
  assert.deepEqual(db.pragma('foreign_key_check'),[]);assert.equal(db.pragma('integrity_check',{simple:true}),'ok');
 } finally {db.close();rmSync(dir,{recursive:true,force:true});}
});
