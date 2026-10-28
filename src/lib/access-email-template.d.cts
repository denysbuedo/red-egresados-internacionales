export function accessEmail(kind:"access_received"|"access_approved"|"access_rejected",data:{name:string;reason?:string}):{subject:string;text_body:string;html_body:string};
