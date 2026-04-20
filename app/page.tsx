import { ChatInterface } from '@/components/chat-interface'

// Home page — renders the chat interface with no chatId.
// When the user sends their first message, ChatInterface will:
//   1. Generate a new chat ID
//   2. Store the message in sessionStorage as "pending_<id>"
//   3. Navigate to /chat/<id>
//   4. The chat page auto-sends the pending message

export default function HomePage() {
  return <ChatInterface />
}
