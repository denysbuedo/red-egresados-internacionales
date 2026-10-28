const Database=require('better-sqlite3');
const {createNotificationEngine}=require('../src/lib/notification-engine.cjs');
const db=new Database(require('./database-path.cjs').databasePath(),{fileMustExist:true});db.pragma('foreign_keys=ON');db.pragma('busy_timeout=5000');
createNotificationEngine(db).runDue().then(result=>{console.log('Notification worker:',JSON.stringify(result));}).catch(()=>{console.error('Notification worker failed; no automatic resend of claimed messages');process.exitCode=1;}).finally(()=>db.close());
