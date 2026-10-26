import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession({ allowPending: true });
  if (!session) redirect("/login");
  if (session.status !== "approved") redirect("/pendiente");
  if (session.role !== "admin") redirect("/");
  return children;
}
