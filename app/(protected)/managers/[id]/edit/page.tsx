"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "@/components/ui/use-toast"
import ProtectedRoute from "@/components/protected-route"
import { translations } from "@/lib/translations"
import type { ManagerCard, Permission } from "@/lib/types"

export default function EditManagerPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [manager, setManager] = useState<ManagerCard | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [password, setPassword] = useState("")
  const [changePassword, setChangePassword] = useState(false)

  useEffect(() => {
    async function fetchManager() {
      try {
        const response = await fetch(`/api/managers/${params.id}`)
        if (!response.ok) {
          throw new Error("Failed to fetch manager")
        }
        const data = await response.json()
        setManager(data)
        setPermissions(data.permissions || [])
      } catch (error) {
        toast({
          title: translations.error,
          description: "Vezető adatainak betöltése sikertelen",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchManager()
  }, [params.id])

  const handlePermissionToggle = (permission: Permission) => {
    setPermissions((prev) => (prev.includes(permission) ? prev.filter((p) => p !== permission) : [...prev, permission]))
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const formData = new FormData(e.currentTarget)
      formData.append("id", params.id)
      formData.append("permissions", JSON.stringify(permissions))

      if (changePassword && password) {
        formData.append("password", password)
        formData.append("changePassword", "true")
      }

      const response = await fetch("/api/managers/update", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Vezető frissítése sikertelen")
      }

      toast({
        title: translations.success,
        description: "Vezető sikeresen frissítve",
      })

      router.push("/managers")
    } catch (error) {
      toast({
        title: translations.error,
        description: error instanceof Error ? error.message : "Valami hiba történt",
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

  if (!manager) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <p>Vezető nem található</p>
      </div>
    )
  }

  return (
    <ProtectedRoute requiredPermission="manage_managers">
      <div className="max-w-md mx-auto">
        <Card className="dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="dark:text-white">{translations.editManager}</CardTitle>
            <CardDescription className="dark:text-gray-300">{translations.updateManagerData}</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="dark:text-gray-200">
                  {translations.managerName}
                </Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={manager.name}
                  required
                  className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="position" className="dark:text-gray-200">
                  {translations.managerPosition}
                </Label>
                <Input
                  id="position"
                  name="position"
                  defaultValue={manager.position}
                  required
                  className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
                />
              </div>

              <div className="space-y-2">
                <Label className="dark:text-gray-200">Vezető szerepköre</Label>
                <RadioGroup defaultValue={manager.role} name="role" required className="dark:text-white">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Tréner" id="trainer" />
                    <Label htmlFor="trainer" className="dark:text-gray-200">
                      Tréner
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Koordinátor" id="coordinator" />
                    <Label htmlFor="coordinator" className="dark:text-gray-200">
                      Koordinátor
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Műszakvezető" id="shift-manager" />
                    <Label htmlFor="shift-manager" className="dark:text-gray-200">
                      Műszakvezető
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="change_password"
                    checked={changePassword}
                    onCheckedChange={(checked) => setChangePassword(checked === true)}
                  />
                  <Label htmlFor="change_password" className="dark:text-gray-200">
                    Jelszó módosítása
                  </Label>
                </div>
                {changePassword && (
                  <div className="pt-2">
                    <Label htmlFor="password" className="dark:text-gray-200">
                      Új jelszó
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Adja meg az új jelszót"
                      className="dark:bg-gray-700 dark:text-white dark:border-gray-600 mt-1"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label className="dark:text-gray-200">{translations.managerPermissions}</Label>
                <div className="space-y-2 mt-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="manage_employees"
                      checked={permissions.includes("manage_employees")}
                      onCheckedChange={() => handlePermissionToggle("manage_employees")}
                    />
                    <Label htmlFor="manage_employees" className="dark:text-gray-200">
                      {translations.permissionManageEmployees}
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="issue_rewards"
                      checked={permissions.includes("issue_rewards")}
                      onCheckedChange={() => handlePermissionToggle("issue_rewards")}
                    />
                    <Label htmlFor="issue_rewards" className="dark:text-gray-200">
                      {translations.permissionIssueRewards}
                    </Label>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/managers")}
                className="dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
              >
                {translations.cancel}
              </Button>
              <Button type="submit" disabled={isSubmitting} className="dark:bg-blue-600 dark:hover:bg-blue-700">
                {isSubmitting ? "Mentés..." : translations.save}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </ProtectedRoute>
  )
}
