'use client'

import { useChat } from '@ai-sdk/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect, useRef, useMemo } from 'react'
import { Square, Sparkles, ArrowUp } from 'lucide-react'
import type { UIMessage } from 'ai'
import { useChatStorage } from '@/hooks/use-chat-storage'
import { useAuth } from '@/contexts/auth-context'

// ─── Helpers ────────────────────────────────────────────────────────────────

function getTitleFromMessages(messages: UIMessage[]): string {
  const firstUser = messages.find((m) => m.role === 'user')
  if (!firstUser) return 'New Chat'
  const textPart = firstUser.parts?.find((p) => p.type === 'text') 
  const text = textPart?.text || 'New Chat'
  return text.length > 40 ? text.slice(0, 40) + '…' : text
}

const SUGGESTIONS = [
  'Explain a concept in simple terms',
  'Help me debug my code',
  'Write a professional email',
  'Brainstorm ideas for my project',
]

// ─── Sub-components ──────────────────────────────────────────────────────────

function MessageBubble({ message }: { message: UIMessage }) {
  const isUser = message.role === 'user'
  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="mr-3 mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
          <Sparkles className="h-4 w-4 text-primary" />
        </div>
      )}
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? 'bg-primary text-primary-foreground rounded-br-sm'
            : 'bg-muted text-foreground rounded-bl-sm'
        }`}
      >
        {message.parts.map((part, i) =>
          part.type === 'text' ? (
            <span key={i} className="whitespace-pre-wrap">
              {part.text}
            </span>
          ) : null,
        )}
      </div>
    </div>
  )
}

function ThinkingIndicator() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
        <Sparkles className="h-4 w-4 text-primary" />
      </div>
      <div className="flex gap-1 rounded-2xl bg-muted px-4 py-3">
        <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:0ms]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:150ms]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:300ms]" />
      </div>
    </div>
  )
}

function WelcomeScreen({
  onSuggestionClick,
}: {
  onSuggestionClick: (text: string) => void
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-6 text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
        <Sparkles className="h-8 w-8 text-primary" />
      </div>
      <h1 className="font-heading mb-2 text-3xl text-foreground">
        How can I help you?
      </h1>
      <p className="mb-10 text-muted-foreground">
        Start a conversation or pick a suggestion below.
      </p>
      <div className="grid w-full max-w-xl grid-cols-1 gap-2 sm:grid-cols-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => onSuggestionClick(s)}
            className="rounded-xl border border-border bg-muted/50 px-4 py-3 text-left text-sm text-muted-foreground transition hover:border-primary/40 hover:bg-muted hover:text-foreground"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────

interface ChatInterfaceProps {
  chatId?: string // undefined = home / new chat page
  serverInitialMessages?: UIMessage[]
}

export function ChatInterface({ chatId, serverInitialMessages }: ChatInterfaceProps) {
  const router = useRouter()
  const storage = useChatStorage()
  const { isAuth, isLoading: authLoading } = useAuth()
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Synchronous render-time read of sessionStorage to get correct initial state
  // without any useEffect flash. Also reads the pending message key so we know
  // if this is a brand-new guest chat (not a broken/invalid URL).
  const { guestInitialMessages, pendingMessage } = useMemo(() => {
    if (!chatId || typeof window === 'undefined' || serverInitialMessages?.length) {
      return { guestInitialMessages: [] as UIMessage[], pendingMessage: null }
    }
    const pending = sessionStorage.getItem(`pending_${chatId}`)
    try {
      const raw = sessionStorage.getItem('chat_' + chatId)
      const entry = raw ? (JSON.parse(raw) as { messages: UIMessage[] }) : null
      return {
        guestInitialMessages: entry?.messages ?? [],
        pendingMessage: pending,
      }
    } catch {
      return { guestInitialMessages: [] as UIMessage[], pendingMessage: pending }
    }
  }, [chatId]) // excludes serverInitialMessages intentionally — runs once per chatId

  const initialMessages = serverInitialMessages?.length
    ? serverInitialMessages
    : guestInitialMessages

  const { messages, sendMessage, status, stop } = useChat({
    id: chatId ?? '__home__',
    messages: initialMessages,
    onFinish: ({ messages: allMessages }) => {
      if (!chatId) return
      const title = getTitleFromMessages(allMessages)
      storage.saveChat(chatId, allMessages, title)
    },
  })

  // Auto-send the pending message for a brand-new guest chat.
  // Read directly from sessionStorage inside the effect — NOT from the useMemo closure —
  // so React StrictMode's double-invocation finds it empty on the second run.
  useEffect(() => {
    if (!chatId) return
    const pending = sessionStorage.getItem(`pending_${chatId}`)
    if (!pending) return
    sessionStorage.removeItem(`pending_${chatId}`)
    sendMessage({ text: pending })
  }, [chatId]) // eslint-disable-line

  // Redirect guests who hit an invalid/expired chatId.
  // Only fires when we have no pending message and no stored messages — i.e. a truly broken link.
  // Authenticated users are handled on the server via notFound().
  useEffect(() => {
    if (!chatId || authLoading || isAuth || pendingMessage) return
    const guestChat = storage.getGuestChat(chatId)
    if (!guestChat && initialMessages.length === 0) {
      router.replace('/')
    }
  }, [chatId, isAuth, authLoading]) // eslint-disable-line

  // Scroll as messages stream in — pure DOM side-effect, useEffect is correct here
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, status])


  function handleSend() {
    const text = input.trim()
    if (!text) return
    if (status !== 'ready' && status !== 'error') return

    setInput('')

    if (!chatId) {
      // Home page: generate a new chat ID, store the message, navigate
      const newId = crypto.randomUUID()
      sessionStorage.setItem(`pending_${newId}`, text)
      router.push('/chat/' + newId)
      return
    }

    // Already in a chat: send directly
    sendMessage({ text })
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const isStreaming = status === 'streaming' || status === 'submitted'

  // Welcome screen shows only on the home page (no chatId).
  // On a chat page, we always show the messages pane — even if messages are
  // empty while loading, to avoid suggestion flash on refresh.
  const showWelcome = !chatId

  return (
    <div className="flex h-full flex-col">
      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto">
        {showWelcome ? (
          <WelcomeScreen onSuggestionClick={(s) => setInput(s)} />
        ) : (
          <div className="mx-auto max-w-3xl space-y-6 px-4 py-6">
            {messages.map((m) => (
              <MessageBubble key={m.id} message={m} />
            ))}
            {status === 'submitted' && <ThinkingIndicator />}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* ── Input bar ── */}
      <div className="shrink-0 bg-background">
        <div className="relative mx-auto flex max-w-3xl items-center gap-2 rounded-2xl border border-border bg-muted/30 px-4 py-3 shadow-sm focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20 transition">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value)
              // Auto-grow textarea
              e.target.style.height = 'auto'
              e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px'
            }}
            onKeyDown={handleKeyDown}
            placeholder="Message…"
            disabled={isStreaming}
            rows={1}
            className="max-h-40 min-h-7 flex-1 resize-none bg-transparent text-md text-foreground placeholder:text-muted-foreground focus:outline-none disabled:opacity-50"
          />

          {isStreaming ? (
            <button
              type="button"
              onClick={() => stop()}
              title="Stop generation"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-destructive text-destructive-foreground transition hover:bg-destructive/80"
            >
              <Square className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSend}
              disabled={!input.trim()}
              title="Send message"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground transition hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ArrowUp className="h-4 w-4" />
            </button>
          )}
        </div>
        <p className="mt-2 text-center text-xs text-muted-foreground/60">
          {isAuth ? 'Chats are saved to your account.' : 'Guest mode — chats are temporary.'}
        </p>
      </div>
    </div>
  )
}
