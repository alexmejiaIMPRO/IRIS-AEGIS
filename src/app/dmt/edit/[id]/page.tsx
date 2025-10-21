"use client"

import { useEffect, useState } from "react"
import { AuthGuard } from "@/components/auth-guard"
import { Header } from "@/components/layout/header"
import { DMTForm } from "@/components/dmt/dmt-form"
import { api } from "@/lib/api-client"
import { useParams } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

export default function EditDMTPage() {
  const [record, setRecord] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const params = useParams()
  const { toast } = useToast()
  const dmtId = Number(params.id)

  useEffect(() => {
    const loadRecord = async () => {
      try {
        const data = await api.dmt.get(dmtId)
        setRecord(data.record)
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load DMT record",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadRecord()
  }, [dmtId])

  if (loading) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gray-50">
          <Header />
          <main className="container mx-auto px-6 py-8">
            <div className="text-center py-12">
              <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading DMT record...</p>
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
          <DMTForm record={record} />
        </main>
      </div>
    </AuthGuard>
  )
}
