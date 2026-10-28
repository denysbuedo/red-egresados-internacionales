import {redirect} from "next/navigation";
import {getSession} from "@/lib/session";
import {PageHeader} from "@/components/PageHeader";
import {NotificationPreferences} from "@/components/NotificationPreferences";
import {AccountSecurity} from "@/components/AccountSecurity";
export default async function Page(){if(!await getSession())redirect('/login?redirect=/preferencias');return <main className="ui-page ui-content-reading"><PageHeader title="Preferencias y seguridad" description="Elige qué correos recibir y cuida el acceso a tu cuenta." eyebrow="TU CUENTA · CONECTA" /><section className="member-section"><h2>Notificaciones por correo</h2><NotificationPreferences /></section><section className="member-section"><h2>Cambiar mi contraseña</h2><AccountSecurity mode="change" /></section></main>;}
