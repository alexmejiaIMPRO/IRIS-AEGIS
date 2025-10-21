"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { api } from "@/lib/api-client"
import { useRouter } from "next/navigation"
import { isDatabaseInitialized, setInitializationPromise, markInitializationComplete } from "@/lib/client-db"
import { seedDatabase } from "@/db/seed"

export interface User {
  id: number
  username: string
  role: "Admin" | "Engineer" | "Supervisor" | "Operator"
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
  const [dbReady, setDbReady] = useState(false)
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
    const initializeApp = async () => {
      try {
        if (!isDatabaseInitialized()) {
          console.log("[v0] Initializing database for first time...")
          const seedPromise = seedDatabase()
          setInitializationPromise(seedPromise)
          await seedPromise
          markInitializationComplete()
        }
        setDbReady(true)
        await refreshUser()
      } catch (error) {
        console.error("[v0] Failed to initialize app:", error)
      } finally {
        setLoading(false)
      }
    }

    initializeApp()
  }, [])

  const login = async (username: string, password: string) => {
    await api.auth.login(username, password)
    await refreshUser()
    router.push("/")
  }

  const logout = async () => {
    await api.auth.logout()
    setUser(null)
    router.push("/login")
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {dbReady ? (
        children
      ) : (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Initializing database...</p>
          </div>
        </div>
      )}
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
