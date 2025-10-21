import type { NextRequest } from "next/server"
import { dbHelpers } from "@/lib/db-helpers"

export async function getCurrentUser(request: NextRequest) {
  const sessionId = request.cookies.get("session_id")?.value

  if (!sessionId) {
    return null
  }

  const session = dbHelpers.sessions.get(sessionId)
  if (!session) {
    return null
  }

  const user = await dbHelpers.users.findById(session.userId)
  return user || null
}

export function requireAuth(user: any): boolean {
  return user !== null && user.isActive
}

export function requireAdmin(user: any): boolean {
  return requireAuth(user) && user.role === "Admin"
}
