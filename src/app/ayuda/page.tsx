
import { PageHeader } from "@/components/PageHeader";
import Link from "next/link";
export const metadata = { title: "Ayuda" };
export default function HelpPage() {
  return <main className="ui-page mx-auto max-w-3xl px-5 py-14"><PageHeader title="¿Cómo podemos ayudarte?" description="Orientación para acceder y participar en la comunidad." eyebrow="CONECTA · ESTAMOS PARA AYUDARTE" compact /><div className="mt-8 space-y-7 rounded-2xl border border-gray-200 bg-white p-7">
    <section><h2 className="text-lg font-semibold">Solicitar acceso</h2><p className="mt-2 leading-relaxed text-gray-600">En esta etapa, CONECTA está dirigida a trabajadores del MES y sus instituciones. Completa el formulario y declara tu vínculo laboral. La solicitud será revisada antes de habilitar el acceso.</p><Link href="/register" className="conecta-auth-link mt-3 inline-block">Solicitar acceso</Link></section>
    <section><h2 className="text-lg font-semibold">Mi solicitud sigue pendiente</h2><p className="mt-2 leading-relaxed text-gray-600">Inicia sesión para consultar el estado y completar la información de tu vínculo laboral. Si necesitas asistencia, comunícate con el responsable de tu institución o con la administración de la plataforma.</p></section>
    <section><h2 className="text-lg font-semibold">Recuperar mi acceso</h2><p className="mt-2 leading-relaxed text-gray-600">Solicita asistencia a la administración de la plataforma o a tu responsable institucional. No compartas tu contraseña en publicaciones, comentarios o mensajes públicos. La plataforma todavía no dispone de recuperación automática por correo.</p></section>
    <section><h2 className="text-lg font-semibold">¿Está disponible la integración con GitHub?</h2><p className="mt-2 leading-relaxed text-gray-600">Todavía no. Puedes compartir enlaces a recursos en tus aportes, pero la vinculación de cuentas y repositorios es una función prevista para una etapa posterior.</p></section>
  </div><Link href="/" className="conecta-auth-link mt-7 inline-block">Volver a CONECTA</Link></main>;
}
