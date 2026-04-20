import type { UIMessage } from 'ai'
import { useAuth } from '@/contexts/auth-context'
import { useCallback } from 'react'

export interface ChatEntry {
  id: string
  title: string
  createdAt: number
  updatedAt: number
  messages: UIMessage[]
}

/**
 * Unified chat storage hook.
 * - Guest (not logged in) → sessionStorage (temp, tab-scoped)
 * - Logged in user        → PostgreSQL via API call
 */
export function useChatStorage() {
  const { isAuth } = useAuth()

  // ─── Guest Helpers (sessionStorage) ───
  function getSessionIndex(): string[] {
    if (typeof window === 'undefined') return []
    try {
      return JSON.parse(sessionStorage.getItem('chat_index') || '[]')
    } catch {
      return []
    }
  }

  function setSessionIndex(ids: string[]) {
    sessionStorage.setItem('chat_index', JSON.stringify(ids))
  }

  // ─── Unified Methods ───
  
  const getAllChats = useCallback(async (): Promise<ChatEntry[]> => {
    if (!isAuth) {
      if (typeof window === 'undefined') return []
      return getSessionIndex()
        .map((id) => {
          try {
            const raw = sessionStorage.getItem('chat_' + id)
            return raw ? (JSON.parse(raw) as ChatEntry) : null
          } catch {
            return null
          }
        })
        .filter((c): c is ChatEntry => c !== null)
    }

    try {
      const res = await fetch('/api/chats')
      if (res.ok) {
        return await res.json()
      }
      return []
    } catch {
      return []
    }
  }, [isAuth])

  // Synchronous getter strictly for guest initial load since guests don't have SSR
  const getGuestChat = useCallback((id: string): ChatEntry | null => {
    if (isAuth || typeof window === 'undefined') return null
    try {
      const raw = sessionStorage.getItem('chat_' + id)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  }, [isAuth])

  const saveChat = useCallback(async (id: string, messages: UIMessage[], title: string) => {
    if (!isAuth) {
      const existing = getGuestChat(id)
      const entry: ChatEntry = {
        id,
        title,
        createdAt: existing?.createdAt ?? Date.now(),
        updatedAt: Date.now(),
        messages,
      }
      sessionStorage.setItem('chat_' + id, JSON.stringify(entry))
      const index = getSessionIndex()
      setSessionIndex([id, ...index.filter((i) => i !== id)])
      return
    }

    try {
      await fetch('/api/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, title, messages }),
      })
    } catch (e) {
      console.error('Failed to save chat to DB', e)
    }
  }, [isAuth, getGuestChat])

  const deleteChat = useCallback(async (id: string) => {
    if (!isAuth) {
      sessionStorage.removeItem('chat_' + id)
      setSessionIndex(getSessionIndex().filter((i) => i !== id))
      return
    }

    try {
      await fetch(`/api/chats/${id}`, { method: 'DELETE' })
    } catch (e) {
      console.error('Failed to delete chat', e)
    }
  }, [isAuth])

  return { getAllChats, getGuestChat, saveChat, deleteChat, isAuth }
}
