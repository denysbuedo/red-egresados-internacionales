import type Database from "better-sqlite3";
export type Category="connections"|"communities"|"events"|"activity";
export type Preferences=Record<Category,"off"|"immediate"|"daily">;
export type Prepared={id:string;message:{recipient:string;subject:string;text_body:string;html_body?:string}};
export function createNotificationEngine(db:Database.Database,options?:{env?:NodeJS.ProcessEnv;fetchImpl?:typeof fetch;now?:()=>number}):{preferences(id:number):Preferences;savePreferences(id:number,value:Preferences):Preferences;enqueue(event:{key:string;userId:number;category:Category;kind:string;subject:string;text:string;link:string;contextType?:string;contextId?:number}):number|null;reserveMail(userId:number,kind:string,subject:string,text:string,link?:string,actorId?:number|null):Prepared|null;deliver(prepared:Prepared|null):Promise<string>;runDue():Promise<{processed:number;locked?:boolean}>};
