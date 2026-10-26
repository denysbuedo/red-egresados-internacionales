import ProfileRegistrationPage from "@/app/egresados/registro/page";
import { getSession, getGraduateByUserId } from "@/lib/session";
import { redirect } from "next/navigation";
import { AffiliationForm } from "@/components/AffiliationForm";
export const dynamic = "force-dynamic";

export default async function CompleteAffiliationPage() {
  const session = await getSession({ allowPending: true });
  if (!session) redirect("/login");
  const profile = await getGraduateByUserId(session.id);
  if (!profile) return <ProfileRegistrationPage />;
  return <main className="mx-auto max-w-2xl px-4 py-12">
    <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
      <h1 className="text-2xl font-bold text-gray-900">Tu vínculo laboral con la red</h1>
      <p className="mt-3 text-gray-600">Red MES está dirigida, en esta primera etapa, a trabajadores del Ministerio de Educación Superior y de sus instituciones. Confirma tu institución y actividad profesional.</p>
      <p className="mt-2 text-sm text-gray-500">Si tienes una cuenta de miembro, el acceso quedará pendiente hasta que la institución valide esta información.</p>
      <AffiliationForm initial={{ institution: profile.university, memberType: profile.memberType,
        currentProfession: profile.currentProfession, currentCompany: profile.currentCompany || "" }} />
    </div>
  </main>;
}
