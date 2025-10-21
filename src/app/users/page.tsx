"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { AuthGuard } from "@/components/auth-guard"
import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { api } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"
import { Users, Plus, Trash2, CheckCircle, XCircle } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

export default function UsersPage() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    role: "Operator",
  })
  const { toast } = useToast()

  useEffect(() => {
    if (currentUser?.role === "Admin") {
      loadUsers()
    }
  }, [currentUser])

  const loadUsers = async () => {
    try {
      const data = await api.users.list()
      setUsers(data.users || [])
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.users.create(formData)
      toast({
        title: "Success",
        description: "User created successfully",
      })
      setFormData({ username: "", password: "", role: "Operator" })
      setShowCreateForm(false)
      loadUsers()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create user",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (userId: number) => {
    if (!confirm("Are you sure you want to delete this user?")) return

    try {
      await api.users.delete(userId)
      toast({
        title: "Success",
        description: "User deleted successfully",
      })
      loadUsers()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive",
      })
    }
  }

  const handleToggleActive = async (userId: number) => {
    try {
      await api.users.activate(userId)
      toast({
        title: "Success",
        description: "User status updated",
      })
      loadUsers()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update user status",
        variant: "destructive",
      })
    }
  }

  if (currentUser?.role !== "Admin") {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gray-50">
          <Header />
          <main className="container mx-auto px-6 py-8">
            <div className="bg-white rounded-xl shadow-xl p-8 text-center">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Access Denied</h2>
              <p className="text-gray-600">You do not have permission to view this page.</p>
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
          <div className="bg-white rounded-xl shadow-xl p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Users className="w-8 h-8 text-blue-600" />
                <h2 className="text-3xl font-bold text-gray-800">User Management</h2>
              </div>
              <Button onClick={() => setShowCreateForm(!showCreateForm)}>
                <Plus className="w-4 h-4 mr-2" />
                Create User
              </Button>
            </div>

            {showCreateForm && (
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 mb-6 border-2 border-blue-200">
                <h4 className="font-bold text-gray-800 mb-4 text-lg">Create New User</h4>
                <form onSubmit={handleCreate} className="space-y-4">
                  <div>
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="role">Role</Label>
                    <select
                      id="role"
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Admin">Admin</option>
                      <option value="Engineer">Engineer</option>
                      <option value="Supervisor">Supervisor</option>
                      <option value="Operator">Operator</option>
                    </select>
                  </div>
                  <div className="flex gap-3">
                    <Button type="submit">Create User</Button>
                    <Button type="button" variant="secondary" onClick={() => setShowCreateForm(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {loading ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading users...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Username</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>{user.id}</TableCell>
                        <TableCell className="font-medium">{user.username}</TableCell>
                        <TableCell>
                          <Badge
                            className={
                              user.role === "Admin"
                                ? "bg-purple-100 text-purple-700"
                                : user.role === "Engineer"
                                  ? "bg-blue-100 text-blue-700"
                                  : user.role === "Supervisor"
                                    ? "bg-green-100 text-green-700"
                                    : "bg-gray-100 text-gray-700"
                            }
                          >
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {user.is_active ? (
                            <Badge className="bg-green-100 text-green-700">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Active
                            </Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-700">
                              <XCircle className="w-3 h-3 mr-1" />
                              Inactive
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => handleToggleActive(user.id)}>
                              {user.is_active ? "Deactivate" : "Activate"}
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => handleDelete(user.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
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
