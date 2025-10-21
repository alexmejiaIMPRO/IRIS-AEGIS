"use client"

import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { LogOut, Home, FileText, Users, ClipboardList, Settings } from "lucide-react"

export function Header() {
  const { user, logout } = useAuth()
  const router = useRouter()

  const handleLogout = async () => {
    await logout()
    router.push("/login")
  }

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <h1 className="text-2xl font-bold text-gray-800">QM System</h1>
            <nav className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => router.push("/")}>
                <Home className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
              <Button variant="ghost" size="sm" onClick={() => router.push("/dmt")}>
                <FileText className="w-4 h-4 mr-2" />
                DMT
              </Button>
              <Button variant="ghost" size="sm" onClick={() => router.push("/entities")}>
                <Settings className="w-4 h-4 mr-2" />
                Entities
              </Button>
              {user?.role === "Admin" && (
                <>
                  <Button variant="ghost" size="sm" onClick={() => router.push("/users")}>
                    <Users className="w-4 h-4 mr-2" />
                    Users
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => router.push("/audit")}>
                    <ClipboardList className="w-4 h-4 mr-2" />
                    Audit
                  </Button>
                </>
              )}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-800">{user?.username}</p>
              <p className="text-xs text-gray-500">{user?.role}</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
