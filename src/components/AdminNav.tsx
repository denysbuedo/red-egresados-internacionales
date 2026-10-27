"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandLogo } from "./BrandLogo";
export function AdminNav({ role }: { role: string }) {
  const pathname = usePathname();
  const links = [
    ...(role === "admin" ? [{ href:"/admin",label:"Resumen",icon:"◇" },{ href:"/admin/approvals",label:"Aprobaciones",icon:"◎" },{ href:"/admin/users",label:"Usuarios",icon:"◉" }] : []),
    { href:"/admin/posts",label:"Noticias",icon:"▤" }, { href:"/admin/events/new",label:"Crear evento",icon:"▦" },
    ...(role === "admin" ? [{ href:"/listas-correo",label:"Listas de correo",icon:"↗" }] : []),
  ];
  return <aside className="ui-admin-rail"><div className="ui-admin-brand"><BrandLogo inverse /><p>GESTIÓN INSTITUCIONAL</p></div><nav aria-label="Administración de CONECTA">{links.map(link => {
    const active = link.href === "/admin" ? pathname === link.href : pathname.startsWith(link.href);
    return <Link key={link.href} href={link.href} aria-current={active ? "page" : undefined}><span aria-hidden="true">{link.icon}</span>{link.label}<span aria-hidden="true">↗</span></Link>;
  })}</nav><Link href="/" className="ui-admin-back">← Volver a la comunidad</Link></aside>;
}
