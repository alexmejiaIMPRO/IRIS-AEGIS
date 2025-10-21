// API client for communicating with FastAPI backend
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001"

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
    credentials: "include", // Important for cookies/sessions
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  })

  if (!response.ok && response.status !== 422) {
    let errorText = response.statusText
    
    // --- CORRECTION: Try to parse JSON first, then fall back to text ---
    try {
      const errorJson = await response.json()
      // Use the 'detail' field from FastAPI error response if available
      errorText = errorJson.detail || JSON.stringify(errorJson)
    } catch (e) {
      // If JSON parsing fails, read the response as plain text
      errorText = await response.text() || response.statusText
    }
    
    throw new APIError(response.status, errorText)
  }

  return response
}

export const api = {
  // Auth endpoints
  auth: {
    login: async (username: string, password: string) => {
      const response = await fetchAPI("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      })
      return await response.json()
    },

    logout: async () => {
      const response = await fetchAPI("/api/auth/logout", {
        method: "POST",
      })
      return await response.json()
    },

    getCurrentUser: async () => {
      try {
        const response = await fetchAPI("/api/auth/me")
        return await response.json()
      } catch (error) {
        if (error instanceof APIError && error.status === 401) {
          return null
        }
        throw error
      }
    },
  },

  // Users endpoints
  users: {
    list: async () => {
      const response = await fetchAPI("/api/users")
      return await response.json()
    },

    create: async (userData: any) => {
      const response = await fetchAPI("/api/users", {
        method: "POST",
        body: JSON.stringify(userData),
      })
      return await response.json()
    },

    update: async (userId: number, userData: any) => {
      const response = await fetchAPI(`/api/users/${userId}`, {
        method: "PUT",
        body: JSON.stringify(userData),
      })
      return await response.json()
    },

    delete: async (userId: number) => {
      const response = await fetchAPI(`/api/users/${userId}`, {
        method: "DELETE",
      })
      return await response.json()
    },

    activate: async (userId: number) => {
      const response = await fetchAPI(`/api/users/${userId}/activate`, {
        method: "POST",
      })
      return await response.json()
    },
  },

  // DMT endpoints
  dmt: {
    list: async (search?: string) => {
      const params = search ? `?search=${encodeURIComponent(search)}` : ""
      const response = await fetchAPI(`/api/dmt${params}`)
      return await response.json()
    },

    get: async (id: number) => {
      const response = await fetchAPI(`/api/dmt/${id}`)
      return await response.json()
    },

    create: async (data: any) => {
      const response = await fetchAPI("/api/dmt", {
        method: "POST",
        body: JSON.stringify(data),
      })
      return await response.json()
    },

    update: async (id: number, data: any) => {
      const response = await fetchAPI(`/api/dmt/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      })
      return await response.json()
    },

    delete: async (id: number) => {
      const response = await fetchAPI(`/api/dmt/${id}`, {
        method: "DELETE",
      })
      return await response.json()
    },

    close: async (id: number) => {
      const response = await fetchAPI(`/api/dmt/${id}/close`, {
        method: "POST",
      })
      return await response.json()
    },

    reopen: async (id: number) => {
      const response = await fetchAPI(`/api/dmt/${id}/reopen`, {
        method: "POST",
      })
      return await response.json()
    },

    export: async (format: "csv" | "json", days?: number) => {
      const params = days ? `?days=${days}` : ""
      const response = await fetchAPI(`/api/dmt/export/${format}${params}`)
      return await response.blob()
    },
  },

  // Entities endpoints
  entities: {
    list: async (entity: string, search = "") => {
      const params = search ? `?search=${encodeURIComponent(search)}` : ""
      const response = await fetchAPI(`/api/entities/${entity}${params}`)
      return await response.json()
    },

    create: async (entity: string, data: any) => {
      const response = await fetchAPI(`/api/entities/${entity}`, {
        method: "POST",
        body: JSON.stringify(data),
      })
      return await response.json()
    },

    update: async (entity: string, id: number, data: any) => {
      const response = await fetchAPI(`/api/entities/${entity}/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      })
      return await response.json()
    },

    delete: async (entity: string, id: number) => {
      const response = await fetchAPI(`/api/entities/${entity}/${id}`, {
        method: "DELETE",
      })
      return await response.json()
    },

    export: async (entity: string, format: "csv" | "json") => {
      const response = await fetchAPI(`/api/entities/${entity}/export/${format}`)
      return await response.blob()
    },
  },

  // Audit endpoints
  audit: {
    list: async () => {
      const response = await fetchAPI("/api/audit")
      return await response.json()
    },
  },

  // Dashboard stats
  dashboard: {
    getStats: async () => {
      const response = await fetchAPI("/api/dashboard/stats")
      return await response.json()
    },
  },
}