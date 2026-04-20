'use client'

import { useParams } from 'next/navigation'
import { ChatInterface } from '@/components/chat-interface'

// Each chat has its own URL: /chat/[id]
// Works for both guests (sessionStorage) and logged-in users (localStorage)
export default function ChatPage() {
  const { id } = useParams() as { id: string }
  return <ChatInterface chatId={id} />
}
