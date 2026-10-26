import { NextResponse } from "next/server";
import { clearSession } from "@/lib/session";
import { checkRequestOrigin } from "@/lib/api-access";

export async function POST(request: Request) {
  const denied = checkRequestOrigin(request);
  if (denied) return denied;
  await clearSession();
  return NextResponse.json({ message: "Logout exitoso" });
}
