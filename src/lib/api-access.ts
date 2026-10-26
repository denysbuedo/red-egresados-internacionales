import "server-only";
import { NextResponse } from "next/server";
import { getSession, type SessionUser } from "./session";

// A cookie authenticates a browser, so mutations must also come from its origin.
export function checkRequestOrigin(request: Request): NextResponse | null {
  if (["GET", "HEAD", "OPTIONS"].includes(request.method)) return null;
  const origin = request.headers.get("origin");
  try {
    const url = new URL(origin || "");
    const expectedHost = request.headers.get("host") || new URL(request.url).host;
    if (!["https:", "http:"].includes(url.protocol) || url.host !== expectedHost ||
        request.headers.get("sec-fetch-site") === "cross-site") throw new Error("origin");
  } catch {
    return NextResponse.json({ error: "Origen de la solicitud no permitido" }, { status: 403 });
  }
  return null;
}

export async function authorizeApi(request: Request, roles?: SessionUser["role"][], options: { allowPending?: boolean } = {}) {
  const originError = checkRequestOrigin(request);
  if (originError) return originError;
  const session = await getSession({ allowPending: true });
  if (!session) return NextResponse.json({ error: "Debes iniciar sesión" }, { status: 401 });
  if (session.status !== "approved" && !(options.allowPending && session.status === "pending")) {
    return NextResponse.json({ error: "Tu cuenta debe estar aprobada", redirect: "/pendiente" }, { status: 403 });
  }
  if (roles && !roles.includes(session.role)) {
    return NextResponse.json({ error: "No tienes permisos para esta acción" }, { status: 403 });
  }
  return null;
}
