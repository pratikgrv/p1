import { ChatInterface } from '@/components/chat-interface'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { db } from '@/db'
import { chat } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import type { UIMessage } from 'ai'
import { notFound, redirect } from 'next/navigation'

// Each chat has its own URL: /chat/[id]
// Authenticated user chats are pre-fetched securely on the server!
export default async function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const session = await auth.api.getSession({
    headers: await headers()
  })

  // Guests and anonymous users have no persistent chats — send them home.
  // This covers both direct navigation and page refresh after a guest session.
  if (!session || session.user.isAnonymous) {
    redirect('/')
  }

  // Auth user: fetch their chat from the DB
  const [entry] = await db
    .select({ messages: chat.messages })
    .from(chat)
    .where(and(eq(chat.id, id), eq(chat.userId, session.user.id)))
    .limit(1)

  if (!entry) {
    notFound()
  }

  const serverInitialMessages = (entry.messages ?? []) as UIMessage[]

  return <ChatInterface chatId={id} serverInitialMessages={serverInitialMessages} />
}
