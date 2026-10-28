type Result={status:"accepted"|"failed"|"unknown";code:string;correlationId:string};
export function createEmailGateway(options:{config:{clientId?:string;clientSecret?:string};fetchImpl?:typeof fetch;now?:()=>number}):{send(message:{recipient:string;subject:string;text_body:string;html_body?:string},correlationId:string):Promise<Result>};
