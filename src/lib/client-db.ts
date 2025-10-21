import { drizzle } from "drizzle-orm/sql-js"
import initSqlJs, { type Database as SqlJsDatabase } from "sql.js"
import * as schema from "@/db/schema"
import { eq, desc, or, like } from "drizzle-orm"
import { verifyPassword } from "./auth-utils"

let db: ReturnType<typeof drizzle>
let sqlJsDb: SqlJsDatabase
let isInitialized = false
let initPromise: Promise<void> | null = null

async function initDatabase() {
  if (db) return db

  console.log("[v0] Initializing database for first time...")

  const wasmBinary = await fetch("/sql-wasm.wasm").then((res) => res.arrayBuffer())

  const SQL = await initSqlJs({
    wasmBinary,
  })

  // Try to load existing database from localStorage
  const savedDb = typeof window !== "undefined" ? localStorage.getItem("qmsystem-db") : null

  if (savedDb) {
    const buffer = Uint8Array.from(atob(savedDb), (c) => c.charCodeAt(0))
    sqlJsDb = new SQL.Database(buffer)
    console.log("[v0] Loaded existing database from localStorage")
  } else {
    sqlJsDb = new SQL.Database()
    console.log("[v0] Created new database")
  }

  db = drizzle(sqlJsDb, { schema })
  isInitialized = true

  return db
}

// Save database to localStorage
export function saveDatabase() {
  if (typeof window !== "undefined" && sqlJsDb) {
    const data = sqlJsDb.export()
    const buffer = Buffer.from(data)
    localStorage.setItem("qmsystem-db", buffer.toString("base64"))
  }
}

// Get database instance
export async function getDb() {
  if (!db) {
    await initDatabase()
  }
  return db
}

// Check if database is initialized
export function isDatabaseInitialized() {
  return isInitialized && typeof window !== "undefined" && localStorage.getItem("qmsystem-db") !== null
}

// Export schema for use in queries
export const { users, dmtRecords, auditLogs, products, suppliers, customers, equipment } = schema

// Client-side database helpers
export const clientDb = {
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

    create: async (userData: typeof users.$inferInsert) => {
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
      const user = await clientDb.users.findByUsername(username)
      if (!user) return false
      return await verifyPassword(password, user.password)
    },
  },

  // DMT operations
  dmt: {
    list: async (search?: string, includeSession = false) => {
      const db = await getDb()
      if (!search) {
        const allRecords = await db.select().from(dmtRecords).orderBy(desc(dmtRecords.createdAt))
        return includeSession ? allRecords : allRecords.filter((r) => !r.isSession)
      }
      const results = await db
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
      return includeSession ? results : results.filter((r) => !r.isSession)
    },

    findById: async (id: number) => {
      const db = await getDb()
      const result = await db.select().from(dmtRecords).where(eq(dmtRecords.id, id)).limit(1)
      return result[0]
    },

    create: async (data: typeof dmtRecords.$inferInsert, username?: string) => {
      const db = await getDb()
      const result = await db.insert(dmtRecords).values(data).returning()
      saveDatabase()
      if (username) {
        await logAudit("dmt_records", result[0].id, "CREATE", username, `Created DMT ${result[0].dmtNumber}`)
      }
      return result[0]
    },

    update: async (id: number, data: Partial<typeof dmtRecords.$inferInsert>, username?: string) => {
      const db = await getDb()
      const result = await db
        .update(dmtRecords)
        .set({ ...data, updatedAt: new Date().toISOString() })
        .where(eq(dmtRecords.id, id))
        .returning()
      saveDatabase()
      if (username && result[0]) {
        await logAudit("dmt_records", id, "UPDATE", username, `Updated DMT ${result[0].dmtNumber}`)
      }
      return result[0]
    },

    delete: async (id: number, username?: string) => {
      const db = await getDb()
      const record = await clientDb.dmt.findById(id)
      await db.delete(dmtRecords).where(eq(dmtRecords.id, id))
      saveDatabase()
      if (username && record) {
        await logAudit("dmt_records", id, "DELETE", username, `Deleted DMT ${record.dmtNumber}`)
      }
      return true
    },

    getStats: async () => {
      const db = await getDb()
      const allRecords = await db.select().from(dmtRecords)
      const publishedRecords = allRecords.filter((r) => !r.isSession)

      return {
        total: publishedRecords.length,
        open: publishedRecords.filter((r) => r.status === "Open").length,
        inProgress: publishedRecords.filter((r) => r.status === "In Progress").length,
        closed: publishedRecords.filter((r) => r.status === "Closed").length,
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

  // Entity operations
  entity: {
    list: async (entityType: "products" | "suppliers" | "customers" | "equipment") => {
      const db = await getDb()
      const tableMap = { products, suppliers, customers, equipment }
      const table = tableMap[entityType]
      return await db.select().from(table).orderBy(desc(table.createdAt))
    },

    create: async (entityType: "products" | "suppliers" | "customers" | "equipment", data: any, username?: string) => {
      const db = await getDb()
      const tableMap = { products, suppliers, customers, equipment }
      const table = tableMap[entityType]
      const result = await db.insert(table).values(data).returning()
      saveDatabase()
      if (username) {
        await logAudit(entityType, result[0].id, "CREATE", username, `Created ${entityType} ${data.name}`)
      }
      return result[0]
    },

    update: async (
      entityType: "products" | "suppliers" | "customers" | "equipment",
      id: number,
      data: any,
      username?: string,
    ) => {
      const db = await getDb()
      const tableMap = { products, suppliers, customers, equipment }
      const table = tableMap[entityType]
      const result = await db.update(table).set(data).where(eq(table.id, id)).returning()
      saveDatabase()
      if (username && result[0]) {
        await logAudit(entityType, id, "UPDATE", username, `Updated ${entityType} ${data.name || result[0].name}`)
      }
      return result[0]
    },

    delete: async (entityType: "products" | "suppliers" | "customers" | "equipment", id: number, username?: string) => {
      const db = await getDb()
      const tableMap = { products, suppliers, customers, equipment }
      const table = tableMap[entityType]
      const entity = await db.select().from(table).where(eq(table.id, id)).limit(1)
      await db.delete(table).where(eq(table.id, id))
      saveDatabase()
      if (username && entity[0]) {
        await logAudit(entityType, id, "DELETE", username, `Deleted ${entityType} ${entity[0].name}`)
      }
      return true
    },
  },
}

// Audit logging helper function
async function logAudit(entityType: string, entityId: string | number, action: string, user: string, details?: string) {
  try {
    await clientDb.audit.create({
      entityType,
      entityId: String(entityId),
      action,
      user,
      details: details || "",
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[v0] Failed to log audit:", error)
  }
}

export async function waitForDatabaseReady() {
  if (initPromise) {
    await initPromise
  }
  // Ensure database is initialized
  await getDb()
}

export function setInitializationPromise(promise: Promise<void>) {
  initPromise = promise
}

export function markInitializationComplete() {
  initPromise = null
}
