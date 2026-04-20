'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { ChatSidebar } from '@/components/chat-sidebar'
import { MessageSquare } from 'lucide-react'

export default function HistoryPage() {
  const { isAuth, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuth) {
      router.push('/')
    }
  }, [isAuth, isLoading, router])

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading your history...</p>
        </div>
      </div>
    )
  }

  if (!isAuth) return null

  return (
    <div className="flex h-full flex-col overflow-y-auto px-4 py-8 md:px-8">
      <div className="mx-auto w-full max-w-3xl">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <MessageSquare className="size-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Your Chat History</h1>
            <p className="text-muted-foreground">
              Manage and revisit your past conversations.
            </p>
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <ChatSidebar />
        </div>
      </div>
    </div>
  )
}
