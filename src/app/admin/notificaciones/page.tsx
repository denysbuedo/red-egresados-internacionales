import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { EmailNotifications } from "@/components/EmailNotifications";
export default async function NotificationsPage(){const session=await getSession();if(session?.role!=="admin")redirect("/");return <EmailNotifications />;}
