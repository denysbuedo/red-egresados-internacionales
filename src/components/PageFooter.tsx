"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
export function PageFooter() {
  const pathname = usePathname();
  if (pathname === "/") return null;
  return <footer className="ui-footer"><div><strong>CONECTA</strong><span>Conocimiento que conecta. Innovación que avanza.</span></div><nav aria-label="Información de CONECTA"><Link href="/ayuda">Ayuda</Link><Link href="/privacidad">Privacidad</Link><Link href="/terminos">Términos</Link><Link href="/estatutos">Estatutos</Link></nav><p>Ministerio de Educación Superior de Cuba · RedUniv</p></footer>;
}
