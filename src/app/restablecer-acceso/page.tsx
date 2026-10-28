import {AccountSecurity} from "@/components/AccountSecurity";
import {PageHeader} from "@/components/PageHeader";
import Link from "next/link";
export const metadata={title:"Elige una nueva contraseña",referrer:"no-referrer" as const,robots:{index:false,follow:false}};
export default function Page(){return <main className="ui-page ui-content-reading"><PageHeader title="Elige una nueva contraseña" description="El enlace es de un solo uso y caduca a los 30 minutos." eyebrow="CONECTA · ACCESO SEGURO" compact /><section className="member-section"><AccountSecurity mode="reset" /></section><Link href="/login" className="conecta-auth-link">Volver al acceso</Link></main>;}
