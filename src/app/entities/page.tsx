"use client"

import { AuthGuard } from "@/components/auth-guard"
import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { Users, Package, Wrench, Building2, FileText, ClipboardCheck, AlertCircle, Settings } from "lucide-react"

const entities = [
  { key: "employees", label: "Employees", icon: Users, color: "blue" },
  { key: "partnumbers", label: "Part Numbers", icon: Package, color: "green" },
  { key: "workcenters", label: "Work Centers", icon: Wrench, color: "purple" },
  { key: "customers", label: "Customers", icon: Building2, color: "orange" },
  { key: "dispositions", label: "Dispositions", icon: FileText, color: "cyan" },
  { key: "inspection_items", label: "Inspection Items", icon: ClipboardCheck, color: "pink" },
  { key: "failure_codes", label: "Failure Codes", icon: AlertCircle, color: "red" },
  { key: "car_types", label: "CAR Types", icon: Settings, color: "indigo" },
]

export default function EntitiesPage() {
  const router = useRouter()

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-6 py-8">
          <div className="bg-white rounded-xl shadow-xl p-6 mb-6">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">General Information Management</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              {entities.map((entity) => {
                const Icon = entity.icon
                return (
                  <Button
                    key={entity.key}
                    onClick={() => router.push(`/entities/${entity.key}`)}
                    className={`bg-gradient-to-br from-${entity.color}-500 to-${entity.color}-600 hover:from-${entity.color}-600 hover:to-${entity.color}-700 text-white font-semibold py-8 px-4 rounded-xl shadow-lg transition-all transform hover:scale-105 h-auto flex flex-col items-center gap-2`}
                  >
                    <Icon className="w-8 h-8" />
                    {entity.label}
                  </Button>
                )
              })}
            </div>
            <Button variant="secondary" onClick={() => router.push("/")}>
              ← Back
            </Button>
          </div>
        </main>
      </div>
    </AuthGuard>
  )
}
