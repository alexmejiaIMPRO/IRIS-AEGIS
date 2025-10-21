import { getDb, saveDatabase, users, dmtRecords, auditLogs, products, suppliers, customers, equipment } from "@/db"
import { eq, desc, or, like, count } from "drizzle-orm"
import { verifyPassword } from "./auth-utils"

// Session storage (in-memory for now, could be moved to Redis or database)
const sessions = new Map<string, { userId: number; username: string; expiresAt: number }>()

export const dbHelpers = {
  // User operations
  users: {
    findByUsername: async (username: string) => {
      const db = await getDb()
      const result = await db.select().from(users).where(eq(users.username, username)).limit(1)
      return result[0]
    },

    findById: async (id: number) => {
      const db = await getDb()
      const result = await db.select().from(users).where(eq(users.id, id)).limit(1)
      return result[0]
    },

    list: async () => {
      const db = await getDb()
      return await db.select().from(users).orderBy(desc(users.createdAt))
    },

    create: async (userData: {
      username: string
      email: string
      password: string
      fullName: string
      role: string
      department?: string
    }) => {
      const db = await getDb()
      const result = await db.insert(users).values(userData).returning()
      saveDatabase()
      return result[0]
    },

    update: async (id: number, updates: Partial<typeof users.$inferInsert>) => {
      const db = await getDb()
      const result = await db.update(users).set(updates).where(eq(users.id, id)).returning()
      saveDatabase()
      return result[0]
    },

    delete: async (id: number) => {
      const db = await getDb()
      await db.delete(users).where(eq(users.id, id))
      saveDatabase()
      return true
    },

    verifyPassword: async (username: string, password: string) => {
      const user = await dbHelpers.users.findByUsername(username)
      if (!user) return false
      return await verifyPassword(password, user.password)
    },
  },

  // DMT operations
  dmt: {
    list: async (search?: string) => {
      const db = await getDb()
      if (!search) {
        return await db.select().from(dmtRecords).orderBy(desc(dmtRecords.createdAt))
      }
      return await db
        .select()
        .from(dmtRecords)
        .where(
          or(
            like(dmtRecords.dmtNumber, `%${search}%`),
            like(dmtRecords.title, `%${search}%`),
            like(dmtRecords.description, `%${search}%`),
          ),
        )
        .orderBy(desc(dmtRecords.createdAt))
    },

    findById: async (id: number) => {
      const db = await getDb()
      const result = await db.select().from(dmtRecords).where(eq(dmtRecords.id, id)).limit(1)
      return result[0]
    },

    create: async (data: typeof dmtRecords.$inferInsert) => {
      const db = await getDb()
      const result = await db.insert(dmtRecords).values(data).returning()
      saveDatabase()
      return result[0]
    },

    update: async (id: number, data: Partial<typeof dmtRecords.$inferInsert>) => {
      const db = await getDb()
      const result = await db
        .update(dmtRecords)
        .set({ ...data, updatedAt: new Date().toISOString() })
        .where(eq(dmtRecords.id, id))
        .returning()
      saveDatabase()
      return result[0]
    },

    delete: async (id: number) => {
      const db = await getDb()
      await db.delete(dmtRecords).where(eq(dmtRecords.id, id))
      saveDatabase()
      return true
    },

    getStats: async () => {
      const db = await getDb()
      const total = await db.select({ count: count() }).from(dmtRecords)
      const open = await db.select({ count: count() }).from(dmtRecords).where(eq(dmtRecords.status, "Open"))
      const inProgress = await db
        .select({ count: count() })
        .from(dmtRecords)
        .where(eq(dmtRecords.status, "In Progress"))
      const closed = await db.select({ count: count() }).from(dmtRecords).where(eq(dmtRecords.status, "Closed"))

      return {
        total: total[0].count,
        open: open[0].count,
        inProgress: inProgress[0].count,
        closed: closed[0].count,
      }
    },
  },

  // Audit operations
  audit: {
    list: async (limit = 50) => {
      const db = await getDb()
      return await db.select().from(auditLogs).orderBy(desc(auditLogs.timestamp)).limit(limit)
    },

    create: async (log: typeof auditLogs.$inferInsert) => {
      const db = await getDb()
      const result = await db.insert(auditLogs).values(log).returning()
      saveDatabase()
      return result[0]
    },
  },

  // Entity operations (products, suppliers, customers, equipment)
  entity: {
    list: async (entityType: "products" | "suppliers" | "customers" | "equipment") => {
      const db = await getDb()
      const tableMap = { products, suppliers, customers, equipment }
      const table = tableMap[entityType]
      return await db.select().from(table).orderBy(desc(table.createdAt))
    },

    create: async (entityType: "products" | "suppliers" | "customers" | "equipment", data: any) => {
      const db = await getDb()
      const tableMap = { products, suppliers, customers, equipment }
      const table = tableMap[entityType]
      const result = await db.insert(table).values(data).returning()
      saveDatabase()
      return result[0]
    },

    delete: async (entityType: "products" | "suppliers" | "customers" | "equipment", id: number) => {
      const db = await getDb()
      const tableMap = { products, suppliers, customers, equipment }
      const table = tableMap[entityType]
      await db.delete(table).where(eq(table.id, id))
      saveDatabase()
      return true
    },
  },

  // Session management
  sessions: {
    create: (userId: number, username: string): string => {
      const sessionId = Math.random().toString(36).substring(2) + Date.now().toString(36)
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
