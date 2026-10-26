import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { PendingStatus } from "@/components/PendingStatus";

export const dynamic = "force-dynamic";
export default async function PendingPage() {
  const session = await getSession({ allowPending: true });
  if (!session) redirect("/login");
  if (session.status === "approved") redirect("/");
  return (
    <main className="min-h-screen bg-gray-50 px-4 py-16">
      <div className="mx-auto max-w-xl rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <p className="mb-2 text-sm font-semibold text-blue-700">Registro recibido</p>
        <h1 className="mb-4 text-3xl font-bold text-gray-900">Tu solicitud está pendiente de aprobación</h1>
        <p className="mb-4 text-gray-600">Hola, {session.username}. La universidad revisará tus datos antes de habilitar el acceso a la red.</p>
        {session.pendingUniversity && <p className="mb-6 font-medium text-gray-800">{session.pendingUniversity}</p>}
        <PendingStatus />
        <Link href="/" className="mt-6 inline-block text-sm text-blue-700">Volver al inicio</Link>
      </div>
    </main>
  );
}
