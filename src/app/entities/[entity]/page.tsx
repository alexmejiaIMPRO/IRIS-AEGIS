"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { AuthGuard } from "@/components/auth-guard"
import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { api } from "@/lib/api-client"
import { useParams, useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { Download, Plus, Edit, Trash2 } from "lucide-react"

const entityInfo: Record<string, { label: string; icon: string }> = {
  employees: { label: "Employee", icon: "👤" },
  partnumbers: { label: "Part Number", icon: "📦" },
  workcenters: { label: "Work Center", icon: "🔧" },
  customers: { label: "Customer", icon: "🏢" },
  dispositions: { label: "Disposition", icon: "📋" },
  inspection_items: { label: "Inspection Item", icon: "✅" },
  failure_codes: { label: "Failure Code", icon: "⚠️" },
  car_types: { label: "CAR Type", icon: "⚙️" },
}

export default function EntityPage() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [newItemName, setNewItemName] = useState("")
  const [newEmployeeNumber, setNewEmployeeNumber] = useState("")
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const entity = params.entity as string

  const info = entityInfo[entity] || { label: "Item", icon: "📄" }

  useEffect(() => {
    loadItems()
  }, [entity, search])

  const loadItems = async () => {
    try {
      const data = await api.entities.list(entity, search)
      setItems(data.items || [])
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load items",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const data: any = { name: newItemName }
      if (entity === "employees" && newEmployeeNumber) {
        data.employee_number = newEmployeeNumber
      }
      await api.entities.create(entity, data)
      toast({
        title: "Success",
        description: `${info.label} created successfully`,
      })
      setNewItemName("")
      setNewEmployeeNumber("")
      loadItems()
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to create ${info.label.toLowerCase()}`,
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm(`Are you sure you want to delete this ${info.label.toLowerCase()}?`)) return

    try {
      await api.entities.delete(entity, id)
      toast({
        title: "Success",
        description: `${info.label} deleted successfully`,
      })
      loadItems()
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to delete ${info.label.toLowerCase()}`,
        variant: "destructive",
      })
    }
  }

  const handleExport = async (format: "csv" | "json") => {
    try {
      const blob = await api.entities.export(entity, format)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${entity}-export.${format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export data",
        variant: "destructive",
      })
    }
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-6 py-8">
          <div className="bg-white rounded-xl shadow-xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-4xl">{info.icon}</span>
              <h3 className="text-3xl font-bold text-gray-800">{info.label} Management</h3>
            </div>

            <div className="mb-6">
              <Input
                type="text"
                placeholder={`Search ${info.label.toLowerCase()}s...`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full"
              />
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 mb-6 border-2 border-blue-200">
              <h4 className="font-bold text-gray-800 mb-4 text-lg">Add New {info.label}</h4>
              <form onSubmit={handleCreate} className="space-y-3">
                <div className="flex gap-3">
                  <Input
                    type="text"
                    placeholder={`Enter ${info.label.toLowerCase()} name`}
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    required
                    className="flex-1"
                  />
                  {entity === "employees" && (
                    <Input
                      type="text"
                      placeholder="Employee number (e.g., EMP-1001)"
                      value={newEmployeeNumber}
                      onChange={(e) => setNewEmployeeNumber(e.target.value)}
                      className="w-64"
                    />
                  )}
                </div>
                <div className="flex gap-3">
                  <Button type="submit" className="bg-green-500 hover:bg-green-600">
                    <Plus className="w-4 h-4 mr-2" />
                    Add
                  </Button>
                  <Button type="button" variant="secondary" onClick={() => setNewItemName("")}>
                    Cancel
                  </Button>
                </div>
              </form>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 mb-6 border-2 border-purple-200">
              <h4 className="font-bold text-gray-800 mb-4 text-lg">Export Data</h4>
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => handleExport("json")} variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Export JSON
                </Button>
                <Button onClick={() => handleExport("csv")} variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading items...</p>
              </div>
            ) : items.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <div className="text-4xl mb-2">📭</div>
                <p className="text-lg">No items found</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="mb-4 text-sm text-gray-600 font-semibold">Showing {items.length} records</div>
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-5 flex items-center justify-between hover:shadow-lg transition-all border-2 border-transparent hover:border-blue-200"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge className="bg-blue-100 text-blue-700">{item.id}</Badge>
                        {entity === "employees" && item.employee_number && (
                          <Badge className="bg-purple-100 text-purple-700">{item.employee_number}</Badge>
                        )}
                        <span className="text-xs text-gray-400">{item.created_at}</span>
                      </div>
                      <p className="font-bold text-gray-800 text-lg">{item.name}</p>
                      {item.updated_at !== item.created_at && (
                        <p className="text-xs text-gray-500 mt-1">Updated: {item.updated_at}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toast({ title: "Edit functionality coming soon" })}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(item.id)}>
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <Button variant="secondary" onClick={() => router.push("/entities")} className="mt-6">
              ← Back
            </Button>
          </div>
        </main>
      </div>
    </AuthGuard>
  )
}
