import type { UIMessage } from 'ai'
import { useAuth } from '@/contexts/auth-context'

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
 * - Logged in user        → localStorage  (permanent, survives refresh)
 */
export function useChatStorage() {
  const { isAuth } = useAuth()

  function getStorage(): Storage | null {
    if (typeof window === 'undefined') return null
    return isAuth ? localStorage : sessionStorage
  }

  function getIndex(): string[] {
    const storage = getStorage()
    if (!storage) return []
    try {
      return JSON.parse(storage.getItem('chat_index') || '[]')
    } catch {
      return []
    }
  }

  function setIndex(ids: string[]) {
    const storage = getStorage()
    if (!storage) return
    storage.setItem('chat_index', JSON.stringify(ids))
  }

  function getAllChats(): ChatEntry[] {
    const storage = getStorage()
    if (!storage) return []
    return getIndex()
      .map((id) => {
        try {
          const raw = storage.getItem('chat_' + id)
          return raw ? (JSON.parse(raw) as ChatEntry) : null
        } catch {
          return null
        }
      })
      .filter((c): c is ChatEntry => c !== null)
  }

  function getChat(id: string): ChatEntry | null {
    const storage = getStorage()
    if (!storage) return null
    try {
      const raw = storage.getItem('chat_' + id)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  }

  function saveChat(id: string, messages: UIMessage[], title: string) {
    const storage = getStorage()
    if (!storage) return

    const existing = getChat(id)
    const entry: ChatEntry = {
      id,
      title,
      createdAt: existing?.createdAt ?? Date.now(),
      updatedAt: Date.now(),
      messages,
    }
    storage.setItem('chat_' + id, JSON.stringify(entry))

    // Keep the index up to date (most recent first)
    const index = getIndex()
    const newIndex = [id, ...index.filter((i) => i !== id)]
    setIndex(newIndex)
  }

  function deleteChat(id: string) {
    const storage = getStorage()
    if (!storage) return
    storage.removeItem('chat_' + id)
    setIndex(getIndex().filter((i) => i !== id))
  }

  return { getAllChats, getChat, saveChat, deleteChat, isAuth }
}
