import { ChatInterface } from '@/components/chat-interface'
import { randomUUID } from 'crypto'

// Home page — pre-generates a UUID server-side and passes it to the chat component.
// On first send, ChatInterface silently updates the URL via history.replaceState
// (no navigation, no server round-trip, no notFound() flash).

export default function HomePage() {
  const newChatId = randomUUID()
  return <ChatInterface chatId={newChatId} isNewChat />
}
