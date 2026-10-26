import "server-only";
import { cookies } from "next/headers";
import { db, sqlite } from "@/db";
import { users, graduates } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createSessionStore, MAX_AGE } from "./session-store.cjs";

const SESSION_COOKIE_NAME = process.env.NODE_ENV === "production" ? "__Host-session" : "session";
export const sessionStore = createSessionStore(sqlite);
export type SessionUser = Pick<typeof users.$inferSelect,
  "id" | "username" | "email" | "role" | "status" | "pendingUniversity" | "institutionName" | "graduateId">;

export async function getSession(options: { allowPending?: boolean } = {}): Promise<SessionUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  const userId = sessionStore.find(token);
  if (!userId) return null;
  const user = db.select({
    id: users.id, username: users.username, email: users.email, role: users.role,
    status: users.status, pendingUniversity: users.pendingUniversity,
    institutionName: users.institutionName, graduateId: users.graduateId,
  }).from(users).where(eq(users.id, userId)).get();
  if (!user || !["pending", "approved"].includes(user.status)) return null;
  if (!options.allowPending && user.status !== "approved") return null;
  return user;
}

export async function setSession(user: { id: number }): Promise<void> {
  const cookieStore = await cookies();
  sessionStore.revoke(cookieStore.get(SESSION_COOKIE_NAME)?.value);
  const token = sessionStore.create(user.id);
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true, secure: process.env.NODE_ENV === "production",
    sameSite: "lax", maxAge: MAX_AGE, path: "/",
  });
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  sessionStore.revoke(cookieStore.get(SESSION_COOKIE_NAME)?.value);
  cookieStore.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 0,
  });
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  return getSession({ allowPending: true });
}

export async function getGraduateByUserId(userId: number) {
  return db.select().from(graduates).where(eq(graduates.userId, userId)).get() || null;
}
