import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import ApprovalsPage from "@/app/admin/approvals/page";

export const dynamic = "force-dynamic";
export default async function UniversityPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "institution") redirect("/");
  return <main className="mx-auto max-w-7xl px-4 py-8">
    <h1 className="mb-6 text-2xl font-bold">{session.institutionName || "Universidad sin asignar"}</h1>
    <ApprovalsPage />
  </main>;
}
