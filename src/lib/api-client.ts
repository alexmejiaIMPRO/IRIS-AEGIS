// API client for communicating with Next.js backend
const API_BASE_URL = "/api"

export class APIError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
    this.name = "APIError"
  }
}

async function fetchAPI(endpoint: string, options: RequestInit = {}): Promise<Response> {
  const url = `${API_BASE_URL}${endpoint}`

  const response = await fetch(url, {
    ...options,
    credentials: "include", // Important for cookies
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  })

  if (!response.ok && response.status !== 422) {
    const error = await response.text()
    throw new APIError(response.status, error || response.statusText)
  }

  return response
}

import { clientDb } from "./client-db"

async function getCurrentUsername(): Promise<string> {
  const sessionStr = localStorage.getItem("qmsystem-session")
  if (!sessionStr) return "system"
  const session = JSON.parse(sessionStr)
  return session.username || "system"
}

export const api = {
  // Auth endpoints
  auth: {
    login: async (username: string, password: string) => {
      const isValid = await clientDb.users.verifyPassword(username, password)

      if (!isValid) {
        throw new APIError(401, "Invalid credentials")
      }

      const user = await clientDb.users.findByUsername(username)

      if (!user || !user.isActive) {
        throw new APIError(401, "Invalid credentials")
      }

      // Store session in localStorage
      const session = {
        userId: user.id,
        username: user.username,
        role: user.role,
        expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
      }
      localStorage.setItem("qmsystem-session", JSON.stringify(session))

      return { user }
    },

    logout: async () => {
      localStorage.removeItem("qmsystem-session")
      return { success: true }
    },

    getCurrentUser: async () => {
      const sessionStr = localStorage.getItem("qmsystem-session")
      if (!sessionStr) return null

      const session = JSON.parse(sessionStr)
      if (session.expiresAt < Date.now()) {
        localStorage.removeItem("qmsystem-session")
        return null
      }

      const user = await clientDb.users.findById(session.userId)
      return user
    },
  },

  // Users endpoints
  users: {
    list: async () => {
      return await clientDb.users.list()
    },

    create: async (userData: any) => {
      return await clientDb.users.create(userData)
    },

    update: async (userId: number, userData: any) => {
      return await clientDb.users.update(userId, userData)
    },

    delete: async (userId: number) => {
      await clientDb.users.delete(userId)
      return { success: true }
    },

    activate: async (userId: number) => {
      await clientDb.users.update(userId, { isActive: true })
      return { success: true }
    },
  },

  // DMT endpoints
  dmt: {
    list: async (search?: string) => {
      return await clientDb.dmt.list(search)
    },

    get: async (id: number) => {
      const record = await clientDb.dmt.findById(id)
      return { record }
    },

    create: async (data: any) => {
      const isSession = data.save_as_session === true
      const { save_as_session, ...dmtData } = data

      // Generate DMT number
      const allRecords = await clientDb.dmt.list("", true)
      const dmtNumber = `DMT-${String(allRecords.length + 1).padStart(5, "0")}`

      const username = await getCurrentUsername()
      return await clientDb.dmt.create(
        {
          ...dmtData,
          dmtNumber,
          isSession,
        },
        username,
      )
    },

    update: async (id: number, data: any) => {
      const isSession = data.save_as_session === true
      const { save_as_session, ...dmtData } = data

      const username = await getCurrentUsername()
      return await clientDb.dmt.update(
        id,
        {
          ...dmtData,
          isSession,
        },
        username,
      )
    },

    delete: async (id: number) => {
      const username = await getCurrentUsername()
      await clientDb.dmt.delete(id, username)
      return { success: true }
    },

    advanceWorkflow: async (id: number) => {
      const record = await clientDb.dmt.findById(id)
      if (!record) throw new Error("Record not found")

      // Simple workflow advancement logic
      const stages = ["Draft", "Review", "Approved", "Implemented"]
      const currentIndex = stages.indexOf(record.workflowStage)
      if (currentIndex < stages.length - 1) {
        const username = await getCurrentUsername()
        await clientDb.dmt.update(id, { workflowStage: stages[currentIndex + 1] }, username)
      }
      return { success: true }
    },

    close: async (id: number) => {
      const username = await getCurrentUsername()
      await clientDb.dmt.update(id, { status: "Closed" }, username)
      return { success: true }
    },

    reopen: async (id: number) => {
      const username = await getCurrentUsername()
      await clientDb.dmt.update(id, { status: "Open" }, username)
      return { success: true }
    },

    export: async (format: "csv" | "excel") => {
      const records = await clientDb.dmt.list()
      // Simple CSV export
      const csv = [
        ["ID", "DMT Number", "Title", "Description", "Status", "Created At"].join(","),
        ...records.map((r) => [r.id, r.dmtNumber, r.title, r.description, r.status, r.createdAt].join(",")),
      ].join("\n")
      return new Blob([csv], { type: "text/csv" })
    },
  },

  // Entities endpoints
  entities: {
    list: async (entity: string, search = "") => {
      const items = await clientDb.entity.list(entity as any)
      if (!search) return items

      // Simple search filter
      return items.filter((item: any) =>
        Object.values(item).some((val) => String(val).toLowerCase().includes(search.toLowerCase())),
      )
    },

    create: async (entity: string, data: any) => {
      const username = await getCurrentUsername()
      return await clientDb.entity.create(entity as any, data, username)
    },

    delete: async (entity: string, id: number) => {
      const username = await getCurrentUsername()
      await clientDb.entity.delete(entity as any, id, username)
      return { success: true }
    },

    export: async (entity: string, format: "csv" | "json") => {
      const items = await clientDb.entity.list(entity as any)
      if (format === "json") {
        return new Blob([JSON.stringify(items, null, 2)], { type: "application/json" })
      }
      // CSV export
      if (items.length === 0) return new Blob([""], { type: "text/csv" })

      const headers = Object.keys(items[0]).join(",")
      const rows = items.map((item: any) => Object.values(item).join(","))
      const csv = [headers, ...rows].join("\n")
      return new Blob([csv], { type: "text/csv" })
    },
  },

  // Audit endpoints
  audit: {
    list: async () => {
      const logs = await clientDb.audit.list(100)
      return { logs }
    },
  },

  // Dashboard stats
  dashboard: {
    getStats: async () => {
      const dmtStats = await clientDb.dmt.getStats()
      const allUsers = await clientDb.users.list()
      const recentAudits = await clientDb.audit.list(10)
      const recentReports = await clientDb.dmt.list()

      return {
        total_users: allUsers.length,
        total_reports: dmtStats.total,
        open_reports: dmtStats.open,
        recent_audits: recentAudits.length,
        recent_reports: recentReports.slice(0, 5).map((r) => [r.id, r.dmtNumber, r.title, r.status, r.createdAt]),
        recent_users: allUsers.slice(0, 5).map((u) => [u.username, u.role]),
      }
    },
  },

  // General info
  generalInfo: {
    get: async () => {
      // Return default general info
      return {
        company_name: "Quality Management System",
        address: "",
        phone: "",
        email: "",
      }
    },

    update: async (data: any) => {
      // Store in localStorage
      localStorage.setItem("qmsystem-general-info", JSON.stringify(data))
      return data
    },
  },
}
