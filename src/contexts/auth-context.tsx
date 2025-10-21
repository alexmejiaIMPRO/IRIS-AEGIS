"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { api } from "@/lib/api-client"
import { useRouter } from "next/navigation"

export interface User {
  id: string
  username: string
  role: "Admin" | "Engineer" | "Supervisor" | "Operator" | "Inspector" | "Manager"
  is_active: boolean
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const refreshUser = async () => {
    try {
      const userData = await api.auth.getCurrentUser()
      setUser(userData)
    } catch (error) {
      setUser(null)
    }
  }

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        await refreshUser()
      } catch (error) {
        console.error("[Auth] Failed to initialize:", error)
      } finally {
        setLoading(false)
      }
    }

    initializeAuth()
  }, [])

  const login = async (username: string, password: string) => {
    const response = await api.auth.login(username, password)
    setUser(response.user)
    router.push("/")
  }

  const logout = async () => {
    await api.auth.logout()
    setUser(null)
    router.push("/login")
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}