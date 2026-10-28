import type Database from "better-sqlite3";
import type {Prepared,createNotificationEngine} from "./notification-engine.cjs";
export function createPasswordRecovery(db:Database.Database,options:{hashPassword:(value:string)=>Promise<string>;verifyPassword:(value:string,hash:string)=>Promise<boolean>;engine?:ReturnType<typeof createNotificationEngine>;now?:()=>number}):{request(identifier:string):Promise<void>;reset(token:string,password:string):Promise<Prepared|null>;change(userId:number,current:string,password:string):Promise<Prepared|null>};
