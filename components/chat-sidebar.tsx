'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { MessageSquare, Trash2, Clock, LogIn } from 'lucide-react'
import { useChatStorage, type ChatEntry } from '@/hooks/use-chat-storage'
import { useAuth } from '@/contexts/auth-context'

function timeAgo(ts: number): string {
  const diff = Date.now() - ts
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

interface ChatSidebarProps {
  currentChatId?: string
  onNavigate?: () => void // called when user clicks a chat (to close dialog)
}

export function ChatSidebar({ currentChatId, onNavigate }: ChatSidebarProps) {
  const { isAuth, signIn } = useAuth()
  const storage = useChatStorage()
  const [chats, setChats] = useState<ChatEntry[]>([])

  // Load chats on mount and whenever auth changes
  useEffect(() => {
    setChats(storage.getAllChats().sort((a, b) => b.updatedAt - a.updatedAt))
  }, [isAuth])

  function handleDelete(e: React.MouseEvent, id: string) {
    e.preventDefault()
    e.stopPropagation()
    storage.deleteChat(id)
    setChats((prev) => prev.filter((c) => c.id !== id))
  }

  // Guest: prompt them to sign in for permanent history
  if (!isAuth) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-12 text-center px-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
          <Clock className="h-7 w-7 text-muted-foreground" />
        </div>
        <div>
          <p className="font-medium text-foreground">No saved history</p>
          <p className="mt-1 text-sm text-muted-foreground">
            You're in guest mode. Sign in to save chats permanently.
          </p>
        </div>
        <button
          onClick={signIn}
          className="mt-2 flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
        >
          <LogIn className="h-4 w-4" />
          Sign in as Demo User
        </button>
      </div>
    )
  }

  // Logged-in: empty state
  if (chats.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-12 text-center px-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
          <MessageSquare className="h-7 w-7 text-muted-foreground" />
        </div>
        <div>
          <p className="font-medium text-foreground">No chats yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Start a conversation and it will appear here.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1 py-2">
      {chats.map((chat) => {
        const isActive = chat.id === currentChatId
        return (
          <Link
            key={chat.id}
            href={`/chat/${chat.id}`}
            onClick={onNavigate}
            className={`group flex items-center justify-between rounded-xl px-3 py-2.5 transition ${
              isActive
                ? 'bg-primary/10 text-primary'
                : 'text-foreground hover:bg-muted'
            }`}
          >
            <div className="flex min-w-0 items-center gap-3">
              <MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{chat.title}</p>
                <p className="text-xs text-muted-foreground">{timeAgo(chat.updatedAt)}</p>
              </div>
            </div>
            <button
              onClick={(e) => handleDelete(e, chat.id)}
              title="Delete chat"
              className="ml-2 shrink-0 rounded-lg p-1 text-muted-foreground opacity-0 transition hover:text-destructive group-hover:opacity-100"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </Link>
        )
      })}
    </div>
  )
}
