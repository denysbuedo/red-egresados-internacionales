
import { PageHeader } from "@/components/PageHeader";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession, getGraduateByUserId } from "@/lib/session";
import { PendingStatus } from "@/components/PendingStatus";

export const dynamic = "force-dynamic";
export default async function PendingPage() {
  const session = await getSession({ allowPending: true });
  if (!session) redirect("/login");
  if (session.status === "approved") redirect("/");
  const profile = await getGraduateByUserId(session.id);
  return (
    <main className="ui-page min-h-screen bg-gray-50 px-4 py-16">
      <div className="mx-auto max-w-xl rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <PageHeader title="Tu solicitud está pendiente de aprobación" description="La administración revisará tu solicitud para comenzar a colaborar." eyebrow="CONECTA · REGISTRO RECIBIDO" compact />
        <p className="mb-4 text-gray-600">Hola, {session.username}. Tu institución o la administración revisará tus datos antes de habilitar el acceso a la red.</p>
        {session.pendingUniversity && <p className="mb-6 font-medium text-gray-800">{session.pendingUniversity}</p>}
        {!profile?.employmentConfirmed && <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
          <p className="mb-3 text-sm text-gray-700">Para revisar tu solicitud necesitamos tu vínculo laboral con el MES o sus instituciones.</p>
          <Link href="/completar-perfil" className="font-semibold text-blue-800 underline">Completar vínculo laboral</Link>
        </div>}
        {profile?.memberType === "unspecified" && <p className="mb-6 text-sm text-gray-600">Al aprobarse tu acceso podrás completar tu institución, cargo, formación e intereses desde Mi perfil.</p>}
        <PendingStatus />
        <Link href="/" className="mt-6 inline-block text-sm text-blue-700">Volver al inicio</Link>
      </div>
    </main>
  );
}
