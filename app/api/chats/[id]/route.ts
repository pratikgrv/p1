import { auth } from "@/lib/auth";
import { db } from "@/db";
import { chat } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { headers } from "next/headers";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    
    if (!session) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { id } = await params;

    const [chatEntry] = await db
      .select()
      .from(chat)
      .where(and(eq(chat.id, id), eq(chat.userId, session.user.id)))
      .limit(1);

    if (!chatEntry) {
      return new Response("Not found", { status: 404 });
    }

    return Response.json({
      id: chatEntry.id,
      title: chatEntry.title,
      messages: chatEntry.messages || [],
      createdAt: chatEntry.createdAt.getTime(),
      updatedAt: chatEntry.updatedAt.getTime(),
    });
  } catch (err) {
    console.error("Error fetching chat:", err);
    return new Response("Internal Server Error", { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    
    if (!session) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { id } = await params;

    await db
      .delete(chat)
      .where(and(eq(chat.id, id), eq(chat.userId, session.user.id)));

    return Response.json({ success: true });
  } catch (err) {
    console.error("Error deleting chat:", err);
    return new Response("Internal Server Error", { status: 500 });
  }
}
