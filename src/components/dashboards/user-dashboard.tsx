"use client"

import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FileText, Clock, CheckCircle, Plus, ClipboardList } from "lucide-react"
import type { DashboardStats } from "@/types"

interface UserDashboardProps {
  stats: DashboardStats | null
}

export function UserDashboard({ stats }: UserDashboardProps) {
  const router = useRouter()

  if (!stats) return null

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-8 text-white">
        <h2 className="text-3xl font-bold mb-2">Welcome back</h2>
        <p className="text-green-100">Track your reports and stay updated with your quality tasks.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card
          className="stat-card p-6 cursor-pointer hover:shadow-lg hover:border-blue-300 transition-all"
          onClick={() => router.push("/dmt")}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-1">{stats.my_reports || 0}</p>
          <p className="text-sm text-gray-500">My Total Reports</p>
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
          <p className="text-3xl font-bold text-gray-900 mb-1">{stats.my_open_reports || 0}</p>
          <p className="text-sm text-gray-500">Open Reports</p>
        </Card>

        <Card
          className="stat-card p-6 cursor-pointer hover:shadow-lg hover:border-green-300 transition-all"
          onClick={() => router.push("/dmt?search=closed")}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-1">{stats.my_closed_reports || 0}</p>
          <p className="text-sm text-gray-500">Closed Reports</p>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => router.push("/dmt/create")}
            className="flex items-center gap-3 p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition group"
          >
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition">
              <Plus className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-gray-900">New Report</p>
              <p className="text-xs text-gray-500">Create DMT report</p>
            </div>
          </button>

          <button
            onClick={() => router.push("/dmt")}
            className="flex items-center gap-3 p-4 bg-green-50 hover:bg-green-100 rounded-lg transition group"
          >
            <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-gray-900">View Reports</p>
              <p className="text-xs text-gray-500">Browse all reports</p>
            </div>
          </button>

          <button
            onClick={() => router.push("/audit")}
            className="flex items-center gap-3 p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition group"
          >
            <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition">
              <ClipboardList className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-gray-900">Audit Log</p>
              <p className="text-xs text-gray-500">View activity</p>
            </div>
          </button>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">My Recent Reports</h3>
        <div className="space-y-3">
          {stats.recent_reports && stats.recent_reports.length > 0 ? (
            stats.recent_reports.map((report) => (
              <div
                key={report[0]}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
              >
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">Report #{report[0]}</p>
                  <p className="text-sm text-gray-600 mt-1">Part: {report[1] || "N/A"}</p>
                  <p className="text-xs text-gray-500 mt-1">Assigned to: {report[4] || "Unassigned"}</p>
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
                  <p className="text-xs text-gray-500 mt-2">{report[3].substring(0, 10)}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No reports yet</p>
              <Button onClick={() => router.push("/dmt/create")} className="mt-4">
                Create Your First Report
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
