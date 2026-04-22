'use client'

import { useChat } from '@ai-sdk/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
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
  /**
   * Always provided:
   *  - Home page  → a fresh UUID generated server-side
   *  - Chat page  → the [id] URL param
   */
  chatId: string
  /** True only when rendered by the home page (/) */
  isNewChat?: boolean
  /** Pre-fetched messages from the server (auth users on /chat/[id]) */
  serverInitialMessages?: UIMessage[]
}

export function ChatInterface({
  chatId,
  isNewChat = false,
  serverInitialMessages,
}: ChatInterfaceProps) {
  const router = useRouter()
  const storage = useChatStorage()
  const { user, isAuth, isLoading: authLoading } = useAuth()
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  /** Tracks previous isAuth value to detect login/logout transitions */
  const prevIsAuth = useRef<boolean | null>(null)

  /**
   * Tracks whether we have already called replaceState to update the URL.
   * Using a ref so it doesn't trigger re-renders.
   * - Home page: starts false → set to true after first send
   * - Chat page: starts true  → replaceState never needed
   */
  const hasNavigated = useRef(!isNewChat)

  /**
   * Controls the welcome screen vs. messages pane.
   * Home page starts on WelcomeScreen; hides on first send.
   */
  const [showWelcome, setShowWelcome] = useState(
    isNewChat && !serverInitialMessages?.length,
  )

  const [localMessageCount, setLocalMessageCount] = useState<number | null>(null)

  useEffect(() => {
    if (user?.isAnonymous) {
      const lastAt = new Date(user.lastMessageAt)
      const isNewDay = lastAt.toDateString() !== new Date().toDateString()
      setLocalMessageCount(isNewDay ? 0 : user.messageCount || 0)
    } else {
      setLocalMessageCount(null)
    }
  }, [user?.isAnonymous, user?.messageCount, user?.lastMessageAt])

  const { messages, sendMessage, status, stop, error } = useChat({
    id: chatId,
    messages: serverInitialMessages ?? [],
    onFinish: ({ messages: allMessages }) => {
      // Guests: no persistence — refresh on /chat/[id] redirects to home.
      // Auth users: save to DB via API.
      if (!isAuth) return
      const title = getTitleFromMessages(allMessages)
      storage.saveChat(chatId, allMessages, title)
    },
  })

  // ── Login / Logout transitions ────────────────────────────────────────────
  // Compares current isAuth against the previously recorded value to detect
  // direction of change (login vs logout) without an extra state variable.
  useEffect(() => {
    if (authLoading) return

    const wasAuth = prevIsAuth.current
    prevIsAuth.current = isAuth

    // Skip the very first render — just record the initial state.
    if (wasAuth === null) return

    if (wasAuth && !isAuth) {
      // ── Logged OUT ────────────────────────────────────────────────────────
      // Guest can't access an auth-owned chat, so redirect home regardless
      // of whether this is a new chat or an existing one.
      router.replace('/')
      return
    }

    if (!wasAuth && isAuth) {
      // ── Logged IN ─────────────────────────────────────────────────────────
      // The conversation existed only in React state (useChat in-memory).
      // Persist it to the DB now so a future refresh works correctly.
      if (messages.length > 0) {
        const title = getTitleFromMessages(messages)
        storage.saveChat(chatId, messages, title)
      }
    }
  }, [isAuth, authLoading]) // eslint-disable-line

  // ── Auto-scroll ───────────────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, status])

  // ─── Handlers ─────────────────────────────────────────────────────────────

  function handleSend() {
    const text = input.trim()
    if (!text) return
    if (status !== 'ready' && status !== 'error') return

    setInput('')

    if (!hasNavigated.current) {
      // First message from home page:
      // Silently update the URL without triggering any Next.js navigation
      // or server re-render. The component stays fully alive.
      window.history.replaceState(null, '', `/chat/${chatId}`)
      hasNavigated.current = true
      setShowWelcome(false)
    }

    if (user?.isAnonymous && localMessageCount !== null) {
      setLocalMessageCount((prev) => (prev || 0) + 1)
    }

    sendMessage({ text })
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const isStreaming = status === 'streaming' || status === 'submitted'
  const messagesLeft = user?.isAnonymous && localMessageCount !== null 
    ? Math.max(0, 10 - localMessageCount) 
    : null;

  return (
    <div className="flex h-full flex-col">
      {/* ── Header ── */}
      {user?.isAnonymous && (
        <div className="flex shrink-0 items-center justify-center border-b border-border bg-muted/20 px-6 py-2">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <Sparkles className="h-3 w-3" />
            <span>Guest Messages Left: {messagesLeft} / 10</span>
          </div>
        </div>
      )}

      {/* ── Error Banner ── */}
      {error && (
        <div className="bg-destructive/10 px-4 py-2 text-center text-sm font-medium text-destructive">
          {error.message || 'An error occurred.'}
        </div>
      )}

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
