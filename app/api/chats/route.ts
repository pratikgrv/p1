import { auth } from "@/lib/auth";
import { db } from "@/db";
import { chat } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { headers } from "next/headers";
import type { UIMessage } from "ai";

export async function GET(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    
    if (!session) {
      return new Response("Unauthorized", { status: 401 });
    }

    // List all chats for user, we don't need to load the full messages array to save bandwidth if possible,
    // but Drizzle jsonb doesn't easily let us select everything minus one column without explicitly listing.
    // We'll select just id, title, createdAt, updatedAt.
    const userChats = await db
      .select({
        id: chat.id,
        title: chat.title,
        createdAt: chat.createdAt,
        updatedAt: chat.updatedAt,
      })
      .from(chat)
      .where(eq(chat.userId, session.user.id))
      .orderBy(desc(chat.updatedAt));

    // Standardize to the expected ChatEntry format, but with empty messages.
    // Client should GET /api/chats/[id] to hydrate messages.
    const result = userChats.map(c => ({
      ...c,
      createdAt: c.createdAt.getTime(),
      updatedAt: c.updatedAt.getTime(),
      messages: [],
    }));

    return Response.json(result);
  } catch (err) {
    console.error("Error fetching chats:", err);
    return new Response("Internal Server Error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    
    if (!session) {
      return new Response("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { id, title, messages } = body as { id: string, title?: string, messages: UIMessage[] };

    if (!id || !messages) {
      return new Response("Missing required fields", { status: 400 });
    }

    const effectiveTitle = title || "New Chat";

    // Insert or update
    await db.insert(chat).values({
      id,
      userId: session.user.id,
      title: effectiveTitle,
      messages: messages as any,
    }).onConflictDoUpdate({
      target: chat.id,
      set: {
        title: effectiveTitle,
        messages: messages as any,
        updatedAt: new Date(),
      }
    });

    return Response.json({ success: true });
  } catch (err) {
    console.error("Error saving chat:", err);
    return new Response("Internal Server Error", { status: 500 });
  }
}
