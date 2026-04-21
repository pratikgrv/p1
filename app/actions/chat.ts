'use server'

import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { db } from '@/db'
import { chat } from '@/db/schema'

/**
 * Pre-creates an empty chat row so the server page (/chat/[id]) can find it
 * immediately on first load — preventing the notFound() flash for auth users.
 *
 * Only runs for non-anonymous authenticated users.
 * Guests are handled entirely via sessionStorage on the client.
 */
export async function createChatAction(chatId: string, firstMessage: string) {
  const session = await auth.api.getSession({ headers: await headers() })

  // Skip for guests / anonymous — they use sessionStorage
  if (!session || session.user.isAnonymous) return

  await db.insert(chat).values({
    id: chatId,
    userId: session.user.id,
    title: firstMessage.length > 40 ? firstMessage.slice(0, 40) + '…' : firstMessage,
    messages: [],
  })
}
