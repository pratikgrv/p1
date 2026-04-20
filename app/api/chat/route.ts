import { convertToModelMessages, streamText, UIMessage } from 'ai';
import { google } from "@ai-sdk/google"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { db } from "@/db"
import { user } from "@/db/schema"
import { eq } from "drizzle-orm"

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })

    if (!session) {
      return new Response("Unauthorized", { status: 401 })
    }

    const [dbUser] = await db.select().from(user).where(eq(user.id, session.user.id))

    if (!dbUser) {
      return new Response("User not found", { status: 401 })
    }

    if (dbUser.isAnonymous && dbUser.messageCount >= 10) {
      return new Response("Guest message limit reached. Please connect your wallet to continue.", {
        status: 403
      })
    }

    // Increment message count
    await db.update(user).set({ messageCount: dbUser.messageCount + 1 }).where(eq(user.id, dbUser.id))

    const { messages }: { messages: UIMessage[] } = await req.json();

    const result = streamText({
      // The AI framework string-based model resolution handles gateway pass-through.
      model: google("gemini-2.5-flash"),
      system: "You are a helpful, smart, and concisely polite assistant.",
      messages: await convertToModelMessages(messages),
    })

    return result.toUIMessageStreamResponse();
  } catch (err) {
    console.error('Error in chat API route:', err);
    return new Response(JSON.stringify({ error: (err as Error).message || 'Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
