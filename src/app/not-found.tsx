import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
export default function NotFound() {
  return <main className="ui-page"><div className="ui-content ui-content-reading"><PageHeader eyebrow="CONECTA · PÁGINA NO ENCONTRADA" title="Sigamos conectando." description="Esta página no existe o no está disponible para tu cuenta." /><section className="ui-empty"><span aria-hidden="true">◇</span><h2>Hay otras formas de continuar</h2><p>Vuelve al inicio o explora las personas de la comunidad.</p><div><Link href="/" className="conecta-cta">Ir al inicio →</Link><Link href="/directorio" className="ui-text-link">Explorar Personas</Link></div></section></div></main>;
}
