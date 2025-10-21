"use client"

import { useEffect, useState, useMemo } from "react"
import { AuthGuard } from "@/components/auth-guard"
import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { api } from "@/lib/api-client"
import { useRouter, useSearchParams } from "next/navigation"
import { FileText, Download } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function DMTPage() {
  const [records, setRecords] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  const searchQuery = useMemo(() => searchParams.get("search") || "", [searchParams])
  const [search, setSearch] = useState(searchQuery)

  useEffect(() => {
    const loadRecords = async () => {
      try {
        setLoading(true)
        const data = await api.dmt.list(searchQuery)
        setRecords(data.records || [])
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load DMT records",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadRecords()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery])

  useEffect(() => {
    setSearch(searchQuery)
  }, [searchQuery])

  const handleExport = async (format: "csv" | "json", days?: number) => {
    try {
      let endpoint = `/dmt/export/${format}`
      if (days) {
        endpoint += `?days=${days}`
      }
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}${endpoint}`, {
        credentials: "include",
      })
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `dmt-export-${days ? `${days}days` : "all"}.${format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast({
        title: "Success",
        description: `Exported ${days ? `last ${days} days` : "all"} records as ${format.toUpperCase()}`,
      })
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
            <h2 className="text-3xl font-bold text-gray-800 mb-6">DMT Management Dashboard</h2>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 mb-6 border-2 border-purple-200">
              <h4 className="font-bold text-gray-800 mb-4 text-lg">📊 Export Data</h4>
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => handleExport("csv", 1)} variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  CSV (1 Day)
                </Button>
                <Button onClick={() => handleExport("csv", 7)} variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  CSV (7 Days)
                </Button>
                <Button onClick={() => handleExport("csv")} variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  CSV (All)
                </Button>
                <Button onClick={() => handleExport("json", 1)} variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  JSON (1 Day)
                </Button>
                <Button onClick={() => handleExport("json", 7)} variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  JSON (7 Days)
                </Button>
                <Button onClick={() => handleExport("json")} variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  JSON (All)
                </Button>
              </div>
            </div>

            <div className="flex justify-between items-center mb-6">
              <div className="flex gap-4">
                <Input
                  placeholder="Search DMT records..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      router.push(`/dmt?search=${search}`)
                    }
                  }}
                  className="w-64"
                />
                <Button onClick={() => router.push(`/dmt?search=${search}`)}>Search</Button>
              </div>

              <Button onClick={() => router.push("/dmt/create")}>Create New DMT</Button>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading DMT records...</p>
              </div>
            ) : records.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No DMT records found</p>
                <Button onClick={() => router.push("/dmt/create")}>Create Your First DMT</Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Report #</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Part Num</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Operation</TableHead>
                      <TableHead>Employee</TableHead>
                      <TableHead>Shop Order</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Assigned To</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {records.map((record) => (
                      <TableRow
                        key={record.id}
                        className="cursor-pointer hover:bg-blue-50"
                        onClick={() => router.push(`/dmt/edit/${record.id}`)}
                      >
                        <TableCell className="font-bold text-blue-700">#{record.report_number}</TableCell>
                        <TableCell>{record.date || ""}</TableCell>
                        <TableCell>{record.customer || ""}</TableCell>
                        <TableCell>{record.part_num || ""}</TableCell>
                        <TableCell>{record.qty || "0"}</TableCell>
                        <TableCell>{record.operation || ""}</TableCell>
                        <TableCell>{record.employee_name || ""}</TableCell>
                        <TableCell>{record.shop_order || ""}</TableCell>
                        <TableCell>
                          <Badge
                            className={
                              record.status === "open" ? "bg-yellow-200 text-yellow-800" : "bg-green-200 text-green-800"
                            }
                          >
                            {record.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{record.assigned_to || "Unassigned"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </main>
      </div>
    </AuthGuard>
  )
}
