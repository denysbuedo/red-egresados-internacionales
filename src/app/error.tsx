"use client";
import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="ui-page"><div className="ui-content ui-content-reading"><PageHeader eyebrow="CONECTA · INTÉNTALO DE NUEVO" title="No pudimos cargar esta página." description="Puedes volver a intentarlo o continuar desde el inicio." /><section className="ui-empty"><span aria-hidden="true">↻</span><h2>Retomemos la conversación</h2><p>Si el problema persiste, consulta con la administración de la plataforma.</p><div><button onClick={reset} className="conecta-cta">Volver a intentar</button><Link href="/" className="ui-text-link">Ir al inicio</Link></div></section></div></main>;
}
