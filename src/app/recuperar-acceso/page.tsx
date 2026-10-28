import {AccountSecurity} from "@/components/AccountSecurity";
import {PageHeader} from "@/components/PageHeader";
import Link from "next/link";
export const metadata={title:"Recuperar mi acceso",referrer:"no-referrer" as const,robots:{index:false,follow:false}};
export default function Page(){return <main className="ui-page ui-content-reading"><PageHeader title="Recuperar mi acceso" description="Solicita un enlace temporal para elegir una nueva contraseña." eyebrow="CONECTA · ACCESO SEGURO" compact /><section className="member-section"><AccountSecurity mode="forgot" /></section><Link href="/login" className="conecta-auth-link">Volver al acceso</Link></main>;}
