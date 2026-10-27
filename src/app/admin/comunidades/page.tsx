import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { CommunityManager } from "@/components/CommunityManager";
export default async function AdminCommunities() {
  const session=await getSession();
  if(session?.role!=="admin")redirect("/");
  return <CommunityManager />;
}
