import type { Metadata } from "next";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { AdminNav } from "@/components/AdminNav";
export const metadata: Metadata = { title: "Gestión institucional", description: "Administración de CONECTA" };
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login?redirect=/admin");
  if (!["admin", "editor"].includes(session.role)) redirect("/");
  return <div className="ui-admin"><div className="ui-admin-topline"><span>ESPACIO DE GESTIÓN · CONECTA</span><span>{session.username}</span></div><div className="ui-admin-grid"><AdminNav role={session.role} /><main className="ui-admin-main ui-surface">{children}</main></div></div>;
}
