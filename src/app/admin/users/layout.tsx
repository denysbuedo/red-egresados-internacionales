import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
export default async function AdminOnly({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session || session.role !== "admin") redirect("/");
  return children;
}
