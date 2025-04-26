"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { editEmployee } from "@/app/actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { toast } from "@/components/ui/use-toast"
import type { Employee } from "@/lib/types"
import ProtectedRoute from "@/components/protected-route"
import { translations } from "@/lib/translations"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/lib/auth-context"

export default function EditEmployeePage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { isAdmin } = useAuth()
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLocked, setIsLocked] = useState(false)
  const [lockReason, setLockReason] = useState("")

  useEffect(() => {
    async function fetchEmployee() {
      try {
        const response = await fetch(`/api/employees/${params.id}`)
        if (!response.ok) {
          throw new Error("Failed to fetch employee")
        }
        const data = await response.json()
        setEmployee(data)
        // Convert string "true"/"false" to boolean if needed
        setIsLocked(data.isLocked === true || data.isLocked === "true")
        setLockReason(data.lockReason || "")
      } catch (error) {
        toast({
          title: translations.error,
          description: "Alkalmazott adatainak betöltése sikertelen",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchEmployee()
  }, [params.id])

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true)

    try {
      formData.append("id", params.id)

      // Add lockdown information - explicitly convert boolean to string
      formData.append("isLocked", isLocked ? "true" : "false")
      if (isLocked) {
        formData.append("lockReason", lockReason)
      } else {
        // Ensure we clear the lock reason when unlocking
        formData.append("lockReason", "")
      }

      const result = await editEmployee(formData)

      if (result.error) {
        toast({
          title: translations.error,
          description: result.error,
          variant: "destructive",
        })
        return
      }

      toast({
        title: translations.success,
        description: "Alkalmazott sikeresen frissítve",
      })

      router.push(`/employees/${params.id}`)
    } catch (error) {
      toast({
        title: translations.error,
        description: "Valami hiba történt",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <p>{translations.loading}</p>
      </div>
    )
  }

  if (!employee) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <p>Alkalmazott nem található</p>
      </div>
    )
  }

  return (
    <ProtectedRoute>
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>{translations.editEmployee}</CardTitle>
            <CardDescription>Alkalmazott adatainak frissítése</CardDescription>
          </CardHeader>
          <form action={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">{translations.employeeName}</Label>
                <Input id="name" name="name" defaultValue={employee.name} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="position">{translations.position}</Label>
                <Input id="position" name="position" defaultValue={employee.position} required />
              </div>

              <div className="space-y-2">
                <Label>{translations.employmentType}</Label>
                <RadioGroup defaultValue={employee.employmentType} name="employmentType" required>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="full-time" id="full-time" />
                    <Label htmlFor="full-time">{translations.fullTime}</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="part-time" id="part-time" />
                    <Label htmlFor="part-time">{translations.partTime}</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="student" id="student" />
                    <Label htmlFor="student">{translations.student}</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Lockdown mode - only visible to admin */}
              {isAdmin && (
                <div className="space-y-4 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="isLocked" className="text-base">
                        Zárolás
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Ha zárolva van, az alkalmazott nem kaphat jutalmat
                      </p>
                    </div>
                    <Switch id="isLocked" checked={isLocked} onCheckedChange={setIsLocked} />
                  </div>

                  {isLocked && (
                    <div className="space-y-2">
                      <Label htmlFor="lockReason">Zárolás oka</Label>
                      <Textarea
                        id="lockReason"
                        value={lockReason}
                        onChange={(e) => setLockReason(e.target.value)}
                        placeholder="Adja meg a zárolás okát"
                        className="min-h-[80px]"
                      />
                    </div>
                  )}
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button type="button" variant="outline" onClick={() => router.push(`/employees/${params.id}`)}>
                {translations.cancel}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Mentés..." : translations.save}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </ProtectedRoute>
  )
}
