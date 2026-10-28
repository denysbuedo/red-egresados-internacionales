import Image from "next/image";
import Link from "next/link";
import { LoginForm } from "@/components/LoginForm";

export default function LoginPage() {
  return <main className="conecta-auth">
    <section className="conecta-auth-card" aria-label="Acceso a CONECTA">
      <Image src="/brand/conecta-isotipo.svg" alt="" width={50} height={50} className="conecta-auth-symbol" unoptimized />
      <LoginForm />
      <p className="mt-6 border-t border-gray-200 pt-5 text-sm text-gray-600">¿Todavía no tienes cuenta? <Link href="/register" className="conecta-auth-link">Solicita tu acceso.</Link></p>
      <p className="mt-3 text-xs leading-relaxed text-gray-500">Las solicitudes están sujetas a revisión institucional.</p>
    </section>
    <div className="conecta-auth-footer"><p>¿Necesitas recuperar tu acceso? <Link href="/recuperar-acceso" className="conecta-auth-link">Recuperar mi contraseña.</Link></p><p className="mt-3">Ministerio de Educación Superior de Cuba · RedUniv</p></div>
  </main>;
}
