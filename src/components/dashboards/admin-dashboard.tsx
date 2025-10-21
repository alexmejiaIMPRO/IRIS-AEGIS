"use client"

import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, FileText, Clock, ClipboardList } from "lucide-react"
import type { DashboardStats } from "@/types"

interface AdminDashboardProps {
  stats: DashboardStats | null
}

export function AdminDashboard({ stats }: AdminDashboardProps) {
  const router = useRouter()

  if (!stats) return null

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-8 text-white">
        <h2 className="text-3xl font-bold mb-2">Welcome back, Admin</h2>
        <p className="text-blue-100">Here's what's happening with your quality management system today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card
          className="stat-card p-6 cursor-pointer hover:shadow-lg hover:border-blue-300 transition-all"
          onClick={() => router.push("/users")}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-1">{stats.total_users}</p>
          <p className="text-sm text-gray-500">Total Users</p>
        </Card>

        <Card
          className="stat-card p-6 cursor-pointer hover:shadow-lg hover:border-green-300 transition-all"
          onClick={() => router.push("/dmt")}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-1">{stats.total_reports}</p>
          <p className="text-sm text-gray-500">Total Reports</p>
        </Card>

        <Card
          className="stat-card p-6 cursor-pointer hover:shadow-lg hover:border-orange-300 transition-all"
          onClick={() => router.push("/dmt?search=open")}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-1">{stats.open_reports}</p>
          <p className="text-sm text-gray-500">Open Reports</p>
        </Card>

        <Card
          className="stat-card p-6 cursor-pointer hover:shadow-lg hover:border-purple-300 transition-all"
          onClick={() => router.push("/audit")}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <ClipboardList className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-1">{stats.recent_audits}</p>
          <p className="text-sm text-gray-500">Today's Audits</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Reports</h3>
          <div className="space-y-3">
            {stats.recent_reports.map((report) => (
              <div
                key={report[0]}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
              >
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Report #{report[0]}</p>
                  <p className="text-sm text-gray-500">{report[1] || "N/A"}</p>
                </div>
                <div className="text-right">
                  <Badge
                    className={
                      report[2] === "open"
                        ? "bg-orange-100 text-orange-700"
                        : report[2] === "closed"
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-700"
                    }
                  >
                    {report[2]}
                  </Badge>
                  <p className="text-xs text-gray-500 mt-1">{report[4]}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Users</h3>
          <div className="space-y-3">
            {stats.recent_users.map((userItem, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">{userItem[0][0].toUpperCase()}</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{userItem[0]}</p>
                    <p className="text-sm text-gray-500">{userItem[1]}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
