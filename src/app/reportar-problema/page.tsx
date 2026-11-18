import type {Metadata} from "next";
import {PageHeader} from "@/components/PageHeader";
import {ProblemReportForm} from "@/components/ProblemReportForm";
import {getSession} from "@/lib/session";
export const metadata:Metadata={title:"Reportar un problema o contactar"};
export default async function ReportPage(){const session=await getSession();return <main className="ui-page mx-auto max-w-3xl px-5 py-12"><PageHeader title="Cuéntanos qué ocurrió" description="Reporta un problema, señala información incorrecta o envíanos una consulta. El equipo de CONECTA la revisará." eyebrow="AYUDA · CONTACTO" compact/><section className="problem-report-panel"><p>Describe lo que estabas haciendo y en qué página ocurrió. Si dejas un correo, podremos responderte.</p><ProblemReportForm email={session?.email}/></section></main>;}
