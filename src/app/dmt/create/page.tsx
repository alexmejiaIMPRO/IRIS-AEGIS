"use client"

import { AuthGuard } from "@/components/auth-guard"
import { Header } from "@/components/layout/header"
import { DMTForm } from "@/components/dmt/dmt-form"

export default function CreateDMTPage() {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-6 py-8">
          <DMTForm />
        </main>
      </div>
    </AuthGuard>
  )
}
