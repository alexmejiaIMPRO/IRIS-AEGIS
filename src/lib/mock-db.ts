// Mock database for v0 preview - simulates backend data storage
import type { User, DMTRecord, AuditLog, DashboardStats } from "@/types"

// Password hashing simulation (in production, use bcrypt)
function hashPassword(password: string): string {
  // Simple hash for demo - DO NOT use in production
  return Buffer.from(password).toString("base64")
}

function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash
}

// Initial mock data
const mockUsers: User[] = [
  {
    id: 1,
    username: "admin",
    role: "Admin",
    is_active: true,
  },
  {
    id: 2,
    username: "john_engineer",
    role: "Engineer",
    is_active: true,
  },
  {
    id: 3,
    username: "sarah_supervisor",
    role: "Supervisor",
    is_active: true,
  },
]

// Store passwords separately (in real app, this would be in database)
const mockPasswords: Record<string, string> = {
  admin: hashPassword("admin123"),
  john_engineer: hashPassword("engineer123"),
  sarah_supervisor: hashPassword("supervisor123"),
}

const mockDMTRecords: DMTRecord[] = [
  {
    id: 1,
    dmt_number: "DMT-2024-001",
    title: "Quality Issue - Product A",
    description: "Defect found in batch 12345",
    status: "Open",
    workflow_stage: "Investigation",
    created_by: "john_engineer",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 2,
    dmt_number: "DMT-2024-002",
    title: "Process Improvement",
    description: "Optimize assembly line workflow",
    status: "Closed",
    workflow_stage: "Completed",
    created_by: "sarah_supervisor",
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
]

const mockAuditLogs: AuditLog[] = [
  {
    id: 1,
    action: "CREATE",
    entity_type: "DMT",
    entity_id: 1,
    user: "john_engineer",
    timestamp: new Date().toISOString(),
    details: "Created DMT record DMT-2024-001",
  },
  {
    id: 2,
    action: "UPDATE",
    entity_type: "DMT",
    entity_id: 2,
    user: "sarah_supervisor",
    timestamp: new Date().toISOString(),
    details: "Closed DMT record DMT-2024-002",
  },
]

// Session storage (in production, use proper session management)
const sessions: Map<string, { userId: number; username: string; expiresAt: number }> = new Map()

export const mockDB = {
  // User operations
  users: {
    findByUsername: (username: string): User | undefined => {
      return mockUsers.find((u) => u.username === username)
    },

    findById: (id: number): User | undefined => {
      return mockUsers.find((u) => u.id === id)
    },

    list: (): User[] => {
      return mockUsers
    },

    create: (userData: { username: string; password: string; role: User["role"] }): User => {
      const newUser: User = {
        id: mockUsers.length + 1,
        username: userData.username,
        role: userData.role,
        is_active: true,
      }
      mockUsers.push(newUser)
      mockPasswords[userData.username] = hashPassword(userData.password)
      return newUser
    },

    update: (id: number, updates: Partial<User>): User | null => {
      const index = mockUsers.findIndex((u) => u.id === id)
      if (index === -1) return null
      mockUsers[index] = { ...mockUsers[index], ...updates }
      return mockUsers[index]
    },

    delete: (id: number): boolean => {
      const index = mockUsers.findIndex((u) => u.id === id)
      if (index === -1) return false
      mockUsers.splice(index, 1)
      return true
    },

    verifyPassword: (username: string, password: string): boolean => {
      const hash = mockPasswords[username]
      if (!hash) return false
      return verifyPassword(password, hash)
    },
  },

  // DMT operations
  dmt: {
    list: (search?: string): DMTRecord[] => {
      if (!search) return mockDMTRecords
      const lowerSearch = search.toLowerCase()
      return mockDMTRecords.filter(
        (r) =>
          r.dmt_number.toLowerCase().includes(lowerSearch) ||
          r.title.toLowerCase().includes(lowerSearch) ||
          r.description.toLowerCase().includes(lowerSearch),
      )
    },

    findById: (id: number): DMTRecord | undefined => {
      return mockDMTRecords.find((r) => r.id === id)
    },

    create: (data: Omit<DMTRecord, "id" | "created_at" | "updated_at">): DMTRecord => {
      const newRecord: DMTRecord = {
        ...data,
        id: mockDMTRecords.length + 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      mockDMTRecords.push(newRecord)
      return newRecord
    },

    update: (id: number, data: Partial<DMTRecord>): DMTRecord | null => {
      const index = mockDMTRecords.findIndex((r) => r.id === id)
      if (index === -1) return null
      mockDMTRecords[index] = {
        ...mockDMTRecords[index],
        ...data,
        updated_at: new Date().toISOString(),
      }
      return mockDMTRecords[index]
    },

    delete: (id: number): boolean => {
      const index = mockDMTRecords.findIndex((r) => r.id === id)
      if (index === -1) return false
      mockDMTRecords.splice(index, 1)
      return true
    },
  },

  // Audit operations
  audit: {
    list: (): AuditLog[] => {
      return mockAuditLogs
    },

    create: (log: Omit<AuditLog, "id" | "timestamp">): AuditLog => {
      const newLog: AuditLog = {
        ...log,
        id: mockAuditLogs.length + 1,
        timestamp: new Date().toISOString(),
      }
      mockAuditLogs.push(newLog)
      return newLog
    },
  },

  // Dashboard stats
  dashboard: {
    getStats: (username?: string): DashboardStats => {
      const totalUsers = mockUsers.length
      const totalReports = mockDMTRecords.length
      const openReports = mockDMTRecords.filter((r) => r.status === "Open").length
      const recentAudits = mockAuditLogs.length

      const recentReports = mockDMTRecords
        .slice(-5)
        .map((r): [number, string, string, string, string] => [r.id, r.dmt_number, r.title, r.status, r.created_at])

      const recentUsers = mockUsers.slice(-5).map((u): [string, string] => [u.username, u.role])

      const stats: DashboardStats = {
        total_users: totalUsers,
        total_reports: totalReports,
        open_reports: openReports,
        recent_audits: recentAudits,
        recent_reports: recentReports,
        recent_users: recentUsers,
      }

      // Add user-specific stats if username provided
      if (username) {
        const userReports = mockDMTRecords.filter((r) => r.created_by === username)
        stats.my_reports = userReports.length
        stats.my_open_reports = userReports.filter((r) => r.status === "Open").length
        stats.my_closed_reports = userReports.filter((r) => r.status === "Closed").length
      }

      return stats
    },
  },

  // Session management
  sessions: {
    create: (userId: number, username: string): string => {
      const sessionId = Math.random().toString(36).substring(2)
      const expiresAt = Date.now() + 24 * 60 * 60 * 1000 // 24 hours
      sessions.set(sessionId, { userId, username, expiresAt })
      return sessionId
    },

    get: (sessionId: string): { userId: number; username: string } | null => {
      const session = sessions.get(sessionId)
      if (!session) return null
      if (session.expiresAt < Date.now()) {
        sessions.delete(sessionId)
        return null
      }
      return { userId: session.userId, username: session.username }
    },

    delete: (sessionId: string): void => {
      sessions.delete(sessionId)
    },
  },
}
