"use client";
import { ConnectionAction } from "./ConnectionAction";
export function ConnectButton({ graduateId }: { graduateId:number; graduateName:string }) {
  return <ConnectionAction graduateId={graduateId} />;
}
