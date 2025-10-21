"use client"

import { useEffect, useState } from "react"
import { AuthGuard } from "@/components/auth-guard"
import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import { api } from "@/lib/api-client"
import { useRouter } from "next/navigation"
import { Users, FileText, Clock, ClipboardList } from "lucide-react"

export default function DashboardPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await api.dashboard.getStats()
        setStats(data)
      } catch (error) {
        console.error("Failed to load stats:", error)
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      loadStats()
    }
  }, [user])

  if (loading) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gray-50">
          <Header />
          <main className="container mx-auto px-6 py-8">
            <div className="text-center py-12">
              <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading dashboard...</p>
            </div>
          </main>
        </div>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-6 py-8">
          <div className="space-y-6">
            {/* Welcome Header */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-8 text-white">
              <h2 className="text-3xl font-bold mb-2">Welcome back, {user?.username}!</h2>
              <p className="text-blue-100">Here's what's happening with your quality management system today.</p>
            </div>

            {/* Stats Cards */}
            {user?.role === "Admin" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Button
                  onClick={() => router.push("/users")}
                  className="stat-card bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-lg hover:border-blue-300 transition-all h-auto flex flex-col items-start text-left"
                  variant="ghost"
                >
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <p className="text-3xl font-bold text-gray-900 mb-1">{stats?.total_users || 0}</p>
                  <p className="text-sm text-gray-500">Total Users</p>
                </Button>

                <Button
                  onClick={() => router.push("/dmt")}
                  className="stat-card bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-lg hover:border-green-300 transition-all h-auto flex flex-col items-start text-left"
                  variant="ghost"
                >
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                    <FileText className="w-6 h-6 text-green-600" />
                  </div>
                  <p className="text-3xl font-bold text-gray-900 mb-1">{stats?.total_reports || 0}</p>
                  <p className="text-sm text-gray-500">Total Reports</p>
                </Button>

                <Button
                  onClick={() => router.push("/dmt?search=open")}
                  className="stat-card bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-lg hover:border-orange-300 transition-all h-auto flex flex-col items-start text-left"
                  variant="ghost"
                >
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                    <Clock className="w-6 h-6 text-orange-600" />
                  </div>
                  <p className="text-3xl font-bold text-gray-900 mb-1">{stats?.open_reports || 0}</p>
                  <p className="text-sm text-gray-500">Open Reports</p>
                </Button>

                <Button
                  onClick={() => router.push("/audit")}
                  className="stat-card bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-lg hover:border-purple-300 transition-all h-auto flex flex-col items-start text-left"
                  variant="ghost"
                >
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                    <ClipboardList className="w-6 h-6 text-purple-600" />
                  </div>
                  <p className="text-3xl font-bold text-gray-900 mb-1">{stats?.recent_audits || 0}</p>
                  <p className="text-sm text-gray-500">Today's Audits</p>
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Button
                  onClick={() => router.push("/dmt")}
                  className="stat-card bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-lg hover:border-blue-300 transition-all h-auto flex flex-col items-start text-left"
                  variant="ghost"
                >
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                    <FileText className="w-6 h-6 text-blue-600" />
                  </div>
                  <p className="text-3xl font-bold text-gray-900 mb-1">{stats?.my_reports || 0}</p>
                  <p className="text-sm text-gray-500">My Total Reports</p>
                </Button>

                <Button
                  onClick={() => router.push("/dmt?search=open")}
                  className="stat-card bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-lg hover:border-orange-300 transition-all h-auto flex flex-col items-start text-left"
                  variant="ghost"
                >
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                    <Clock className="w-6 h-6 text-orange-600" />
                  </div>
                  <p className="text-3xl font-bold text-gray-900 mb-1">{stats?.my_open_reports || 0}</p>
                  <p className="text-sm text-gray-500">Open Reports</p>
                </Button>

                <Button
                  onClick={() => router.push("/dmt?search=closed")}
                  className="stat-card bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-lg hover:border-green-300 transition-all h-auto flex flex-col items-start text-left"
                  variant="ghost"
                >
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                    <FileText className="w-6 h-6 text-green-600" />
                  </div>
                  <p className="text-3xl font-bold text-gray-900 mb-1">{stats?.my_closed_reports || 0}</p>
                  <p className="text-sm text-gray-500">Closed Reports</p>
                </Button>
              </div>
            )}

            {/* Recent Activity */}
            {stats?.recent_reports && stats.recent_reports.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Reports</h3>
                <div className="space-y-3">
                  {stats.recent_reports.map((report: any[], index: number) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition cursor-pointer"
                      onClick={() => router.push(`/dmt/edit/${report[0]}`)}
                    >
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">Report #{report[0]}</p>
                        <p className="text-sm text-gray-500">{report[1] || "N/A"}</p>
                      </div>
                      <div className="text-right">
                        <span
                          className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                            report[2] === "open"
                              ? "bg-orange-100 text-orange-700"
                              : report[2] === "closed"
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {report[2]}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </AuthGuard>
  )
}