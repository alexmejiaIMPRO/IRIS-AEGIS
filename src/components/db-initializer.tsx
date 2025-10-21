"use client"

import { useEffect, useState } from "react"

export function DbInitializer() {
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    const initDb = async () => {
      // Check if database has been initialized
      const dbInitialized = localStorage.getItem("qmsystem-db-initialized")

      if (!dbInitialized) {
        console.log("[v0] Initializing database for first time...")
        try {
          const response = await fetch("/api/init-db", { method: "POST" })
          if (response.ok) {
            localStorage.setItem("qmsystem-db-initialized", "true")
            console.log("[v0] Database initialized successfully")
            setInitialized(true)
          }
        } catch (error) {
          console.error("[v0] Failed to initialize database:", error)
        }
      } else {
        setInitialized(true)
      }
    }

    initDb()
  }, [])

  // Don't render anything, this is just for side effects
  return null
}
