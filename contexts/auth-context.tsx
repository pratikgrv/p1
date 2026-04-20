'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { DEMO_USER, type User } from '@/lib/auth'

interface AuthContextValue {
  user: User | null
  isAuth: boolean
  signIn: () => void
  signOut: () => void
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isAuth: false,
  signIn: () => {},
  signOut: () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)

  // Restore auth state from localStorage on page load
  useEffect(() => {
    try {
      const stored = localStorage.getItem('auth_user')
      if (stored) {
        setUser(JSON.parse(stored))
      }
    } catch {
      // ignore corrupted storage
    }
  }, [])

  function signIn() {
    setUser(DEMO_USER)
    localStorage.setItem('auth_user', JSON.stringify(DEMO_USER))
  }

  function signOut() {
    setUser(null)
    localStorage.removeItem('auth_user')
  }

  return (
    <AuthContext.Provider value={{ user, isAuth: !!user, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
