import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import ApprovalsPage from "@/app/admin/approvals/page";

export const dynamic = "force-dynamic";
export default async function UniversityPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "institution") redirect("/");
  return <main className="ui-page mx-auto max-w-7xl px-4 py-8">
    <p className="ui-context-label">{session.institutionName || "Institución sin asignar"}</p>
    <ApprovalsPage />
  </main>;
}
