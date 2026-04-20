import { ChatInterface } from '@/components/chat-interface'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { db } from '@/db'
import { chat } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import type { UIMessage } from 'ai'
import { notFound } from 'next/navigation'

// Each chat has its own URL: /chat/[id]
// Authenticated user chats are pre-fetched securely on the server!
export default async function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  
  let serverInitialMessages: UIMessage[] = []

  const session = await auth.api.getSession({
    headers: await headers()
  });

  // If user is logged in and NOT anonymous, try to fetch from DB
  if (session && !session.user.isAnonymous) {
    const [entry] = await db
      .select({ messages: chat.messages })
      .from(chat)
      .where(and(eq(chat.id, id), eq(chat.userId, session.user.id)))
      .limit(1)

    if (!entry) {
      // Not found in DB for a registered user
      notFound()
    }

    if (entry.messages) {
      serverInitialMessages = entry.messages as UIMessage[]
    }
  }
  
  return <ChatInterface chatId={id} serverInitialMessages={serverInitialMessages} />
}
