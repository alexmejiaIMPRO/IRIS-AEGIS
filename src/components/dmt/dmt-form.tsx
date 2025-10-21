"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { api } from "@/lib/api-client"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { Printer } from "lucide-react"

interface DMTFormProps {
  record?: any
}

export function DMTForm({ record }: DMTFormProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    work_center: record?.work_center || "",
    part_num: record?.part_num || "",
    operation: record?.operation || "",
    employee_name: record?.employee_name || "",
    qty: record?.qty || "",
    customer: record?.customer || "",
    shop_order: record?.shop_order || "",
    serial_number: record?.serial_number || "",
    inspection_item: record?.inspection_item || "",
    date: record?.date || new Date().toISOString().split("T")[0],
    prepared_by: record?.prepared_by || "",
    description: record?.description || "",
    car_type: record?.car_type || "",
    car_cycle: record?.car_cycle || "",
    car_second_cycle_date: record?.car_second_cycle_date || "",
    // Process Analysis fields
    process_description: record?.process_description || "",
    analysis: record?.analysis || "",
    analysis_by: record?.analysis_by || "",
    // Engineering fields - These are required by the backend
    disposition: record?.disposition || "",
    disposition_date: record?.disposition_date || "",
    engineer: record?.engineer || "",
    failure_code: record?.failure_code || "",
    rework_hours: record?.rework_hours || "",
    responsible_dept: record?.responsible_dept || "",
    material_scrap_cost: record?.material_scrap_cost || "",
    others_cost: record?.others_cost || "",
    engineering_remarks: record?.engineering_remarks || "",
    repair_process: record?.repair_process || "",
    // Quality fields
    disposition_approval_date: record?.disposition_approval_date || "",
    disposition_approved_by: record?.disposition_approved_by || "",
    sdr_number: record?.sdr_number || "",
    dmt_approval_date: record?.dmt_approval_date || "",
    car_closed_date: record?.car_closed_date || "",
    return_to_disposition: record?.return_to_disposition || false,
    to_engineer: record?.to_engineer || false,
    // New fields from Python routes
    title: record?.title || "",
    category: record?.category || "Process",
    severity: record?.severity || "Minor",
    department: record?.department || "",
    raisedBy: record?.raisedBy || user?.id,
    assignedTo: record?.assignedTo || null,
    rootCause: record?.rootCause || "",
    correctiveAction: record?.correctiveAction || "",
    preventiveAction: record?.preventiveAction || "",
    targetDate: record?.targetDate || "",
  })

  const handleChange = (field: string, value: string | boolean | number | null) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent, saveAsSession = false) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (!saveAsSession) {
        // Validation check for user-critical fields
        const requiredFields = ["title", "description", "category", "severity", "department"]
        const missingFields = requiredFields.filter((field) => !formData[field as keyof typeof formData])

        if (missingFields.length > 0) {
          toast({
            title: "Validation Error",
            description: `Please fill in all required fields: ${missingFields.join(", ")}`,
            variant: "destructive",
          })
          setLoading(false)
          return
        }
      }

      // FIX: Ensure all required fields by the Pydantic model are present and correctly typed (especially numbers).
      const dataToSend = {
        ...formData,
        save_as_session: saveAsSession,
        // CRITICAL FIX: Convert number fields to float (0 if empty string) to satisfy Pydantic/FastAPI
        rework_hours: parseFloat(formData.rework_hours as string || "0"),
        material_scrap_cost: parseFloat(formData.material_scrap_cost as string || "0"),
        others_cost: parseFloat(formData.others_cost as string || "0"),
        // Ensure all required string fields are safely included with an empty string default
        disposition: formData.disposition || "",
        disposition_date: formData.disposition_date || "",
        engineer: formData.engineer || "",
        failure_code: formData.failure_code || "",
        responsible_dept: formData.responsible_dept || "",
        engineering_remarks: formData.engineering_remarks || "",
        repair_process: formData.repair_process || "",
      }

      if (record) {
        await api.dmt.update(record.id, dataToSend)
        toast({
          title: "Success",
          description: saveAsSession ? "DMT saved as session (draft)" : "DMT record updated successfully",
        })
      } else {
        await api.dmt.create(dataToSend)
        toast({
          title: "Success",
          description: saveAsSession ? "DMT saved as session (draft)" : "DMT record created successfully",
        })
      }
      router.push("/dmt")
    } catch (error) {
      console.error("[v0] Error saving DMT:", error)
      toast({
        title: "Error",
        description: `Failed to ${record ? "update" : "create"} DMT record. Check console for details.`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = (type: "dmt" | "car" | "mrb") => {
    toast({
      title: "Print",
      description: `Printing ${type.toUpperCase()} report...`,
    })
    window.print()
  }

  const canEdit = !record || record.status !== "Closed"
  const isAdmin = user?.role === "Admin"

  return (
    <div className="bg-white rounded-xl shadow-xl p-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-800">
          {record ? `Edit DMT Report #${record.dmtNumber}` : "Create New DMT Report"}
        </h2>

        {record && (
          <div className="flex gap-2 items-center">
            <Badge className={record.status === "Open" ? "bg-green-200 text-green-700" : "bg-red-200 text-red-700"}>
              {record.status?.toUpperCase()}
            </Badge>
            {record.isSession && <Badge className="bg-orange-200 text-orange-700">SESSION (DRAFT)</Badge>}
          </div>
        )}
      </div>

      <div
        id="form-error-message"
        className="hidden mb-4 p-4 bg-red-100 border-2 border-red-400 text-red-700 rounded-lg"
      >
        <strong>Error:</strong> <span id="error-text"></span>
      </div>

      <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
        {/* General Information Section (Old/Legacy) */}
        <div
          className={`bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border-2 border-blue-200 ${!isAdmin && canEdit ? "opacity-60" : ""}`}
        >
          <h3 className="text-xl font-bold text-gray-800 mb-4">
            📋 General Information <span className="text-red-600">*</span>
            {!isAdmin && record?.status !== "Closed" && (
              <span className="text-sm font-normal text-gray-600 ml-2">(Admin Only)</span>
            )}
            {record?.status === "Closed" && (
              <span className="text-sm font-normal text-red-600 ml-2">(Closed - Read Only)</span>
            )}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="work_center">
                Work Center <span className="text-red-600">*</span>
              </Label>
              <Input
                id="work_center"
                value={formData.work_center}
                onChange={(e) => handleChange("work_center", e.target.value)}
                disabled={!canEdit || !isAdmin}
                required
              />
            </div>

            <div>
              <Label htmlFor="part_num">
                Part Number <span className="text-red-600">*</span>
              </Label>
              <Input
                id="part_num"
                value={formData.part_num}
                onChange={(e) => handleChange("part_num", e.target.value)}
                disabled={!canEdit || !isAdmin}
                required
              />
            </div>

            <div>
              <Label htmlFor="operation">
                Operation <span className="text-red-600">*</span>
              </Label>
              <Input
                id="operation"
                value={formData.operation}
                onChange={(e) => handleChange("operation", e.target.value)}
                disabled={!canEdit || !isAdmin}
                required
              />
            </div>

            <div>
              <Label htmlFor="employee_name">
                Employee <span className="text-red-600">*</span>
              </Label>
              <Input
                id="employee_name"
                placeholder="Search by name, ID, or employee number..."
                value={formData.employee_name}
                onChange={(e) => handleChange("employee_name", e.target.value)}
                disabled={!canEdit || !isAdmin}
                required
              />
            </div>

            <div>
              <Label htmlFor="qty">
                Quantity <span className="text-red-600">*</span>
              </Label>
              <Input
                id="qty"
                type="text"
                value={formData.qty}
                onChange={(e) => handleChange("qty", e.target.value)}
                disabled={!canEdit || !isAdmin}
                required
              />
            </div>

            <div>
              <Label htmlFor="customer">
                Customer <span className="text-red-600">*</span>
              </Label>
              <Input
                id="customer"
                value={formData.customer}
                onChange={(e) => handleChange("customer", e.target.value)}
                disabled={!canEdit || !isAdmin}
                required
              />
            </div>

            <div>
              <Label htmlFor="shop_order">
                Shop Order <span className="text-red-600">*</span>
              </Label>
              <Input
                id="shop_order"
                value={formData.shop_order}
                onChange={(e) => handleChange("shop_order", e.target.value)}
                disabled={!canEdit || !isAdmin}
                required
              />
            </div>

            <div>
              <Label htmlFor="serial_number">
                Serial Number <span className="text-red-600">*</span>
              </Label>
              <Input
                id="serial_number"
                value={formData.serial_number}
                onChange={(e) => handleChange("serial_number", e.target.value)}
                disabled={!canEdit || !isAdmin}
                required
              />
            </div>

            <div>
              <Label htmlFor="inspection_item">
                Inspection Item <span className="text-red-600">*</span>
              </Label>
              <Input
                id="inspection_item"
                value={formData.inspection_item}
                onChange={(e) => handleChange("inspection_item", e.target.value)}
                disabled={!canEdit || !isAdmin}
                required
              />
            </div>

            <div>
              <Label htmlFor="date">
                Date <span className="text-red-600">*</span>
              </Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => handleChange("date", e.target.value)}
                disabled={!canEdit || !isAdmin}
                required
              />
            </div>

            <div>
              <Label htmlFor="prepared_by">
                Prepared By <span className="text-red-600">*</span>
              </Label>
              <Input
                id="prepared_by"
                value={formData.prepared_by}
                onChange={(e) => handleChange("prepared_by", e.target.value)}
                disabled={!canEdit || !isAdmin}
                required
              />
            </div>
          </div>
        </div>

        {/* Defect Description Section (Old/Legacy) */}
        <div
          className={`bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-6 border-2 border-red-200 ${!isAdmin && canEdit ? "opacity-60" : ""}`}
        >
          <h3 className="text-xl font-bold text-gray-800 mb-4">
            ⚠️ Defect Description <span className="text-red-600">*</span>
            {!isAdmin && record?.status !== "Closed" && (
              <span className="text-sm font-normal text-gray-600 ml-2">(Admin Only)</span>
            )}
            {record?.status === "Closed" && (
              <span className="text-sm font-normal text-red-600 ml-2">(Closed - Read Only)</span>
            )}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="description">
                Description <span className="text-red-600">*</span>
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                disabled={!canEdit || !isAdmin}
                required
                rows={3}
              />
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="car_type">
                  CAR Type <span className="text-red-600">*</span>
                </Label>
                <Input
                  id="car_type"
                  value={formData.car_type}
                  onChange={(e) => handleChange("car_type", e.target.value)}
                  disabled={!canEdit || !isAdmin}
                  required
                />
              </div>

              <div>
                <Label htmlFor="car_cycle">
                  CAR Cycle <span className="text-red-600">*</span>
                </Label>
                <Input
                  id="car_cycle"
                  value={formData.car_cycle}
                  onChange={(e) => handleChange("car_cycle", e.target.value)}
                  disabled={!canEdit || !isAdmin}
                  required
                />
              </div>

              <div>
                <Label htmlFor="car_second_cycle_date">
                  CAR Second Cycle Date <span className="text-red-600">*</span>
                </Label>
                <Input
                  id="car_second_cycle_date"
                  type="date"
                  value={formData.car_second_cycle_date}
                  onChange={(e) => handleChange("car_second_cycle_date", e.target.value)}
                  disabled={!canEdit || !isAdmin}
                  required
                />
              </div>
            </div>
          </div>
        </div>

        {/* New General Information Section */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border-2 border-blue-200">
          <h3 className="text-xl font-bold text-gray-800 mb-4">
            📋 General Information <span className="text-red-600">*</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">
                Title <span className="text-red-600">*</span>
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleChange("title", e.target.value)}
                disabled={!canEdit}
                required
              />
            </div>

            <div>
              <Label htmlFor="category">
                Category <span className="text-red-600">*</span>
              </Label>
              <select
                id="category"
                value={formData.category}
                onChange={(e) => handleChange("category", e.target.value)}
                disabled={!canEdit}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Process">Process</option>
                <option value="Product">Product</option>
                <option value="Equipment">Equipment</option>
                <option value="Documentation">Documentation</option>
              </select>
            </div>

            <div>
              <Label htmlFor="severity">
                Severity <span className="text-red-600">*</span>
              </Label>
              <select
                id="severity"
                value={formData.severity}
                onChange={(e) => handleChange("severity", e.target.value)}
                disabled={!canEdit}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Critical">Critical</option>
                <option value="Major">Major</option>
                <option value="Minor">Minor</option>
              </select>
            </div>

            <div>
              <Label htmlFor="department">
                Department <span className="text-red-600">*</span>
              </Label>
              <Input
                id="department"
                value={formData.department}
                onChange={(e) => handleChange("department", e.target.value)}
                disabled={!canEdit}
                required
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="description">
                Description <span className="text-red-600">*</span>
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                disabled={!canEdit}
                required
                rows={4}
              />
            </div>
          </div>
        </div>

        {/* Analysis Section */}
        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-6 border-2 border-yellow-200">
          <h3 className="text-xl font-bold text-gray-800 mb-4">
            🔍 Analysis <span className="text-sm font-normal text-gray-600">(Optional)</span>
          </h3>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor="rootCause">Root Cause</Label>
              <Textarea
                id="rootCause"
                value={formData.rootCause}
                onChange={(e) => handleChange("rootCause", e.target.value)}
                disabled={!canEdit}
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="correctiveAction">Corrective Action</Label>
              <Textarea
                id="correctiveAction"
                value={formData.correctiveAction}
                onChange={(e) => handleChange("correctiveAction", e.target.value)}
                disabled={!canEdit}
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="preventiveAction">Preventive Action</Label>
              <Textarea
                id="preventiveAction"
                value={formData.preventiveAction}
                onChange={(e) => handleChange("preventiveAction", e.target.value)}
                disabled={!canEdit}
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="targetDate">Target Date</Label>
              <Input
                id="targetDate"
                type="date"
                value={formData.targetDate}
                onChange={(e) => handleChange("targetDate", e.target.value)}
                disabled={!canEdit}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={() => router.push("/dmt")}>
              Cancel
            </Button>
          </div>

          <div className="flex gap-2">
            {record && (
              <>
                <Button type="button" variant="outline" onClick={() => handlePrint("dmt")}>
                  <Printer className="w-4 h-4 mr-2" />
                  Print DMT
                </Button>
              </>
            )}

            {canEdit && (
              <>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={(e: any) => handleSubmit(e as any, true)}
                  disabled={loading}
                >
                  {loading ? "Saving..." : "Save as Session"}
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Saving..." : record ? "Update DMT" : "Create DMT"}
                </Button>
              </>
            )}
          </div>
        </div>
      </form>
    </div>
  )
}