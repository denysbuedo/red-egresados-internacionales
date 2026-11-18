import { db } from "@/db";
import { notifications } from "@/db/schema";

export async function createNotification(
  userId: number,
  type: "connection_accepted" | "post_commented" | "comment_replied" | "problem_report",
  message: string,
  link?: string
) {
  try {
    await db.insert(notifications).values({
      userId,
      type,
      message,
      link: link || null,
      read: 0,
    });
  } catch (error) {
    console.error("Error creating notification:", error);
  }
}
