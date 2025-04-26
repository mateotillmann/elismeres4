"use client"

import type React from "react"

import { useState } from "react"
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
import type { Permission } from "@/lib/types"

export default function NewManagerPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedRole, setSelectedRole] = useState<string>("Tréner")
  const [permissions, setPermissions] = useState<Permission[]>(["issue_rewards"])
  const [password, setPassword] = useState("")

  // Update permissions when role changes
  const handleRoleChange = (role: string) => {
    setSelectedRole(role)

    // Set default permissions based on role
    switch (role) {
      case "Műszakvezető":
        setPermissions(["manage_employees", "issue_rewards"])
        break
      case "Koordinátor":
        setPermissions(["manage_employees", "issue_rewards"])
        break
      case "Tréner":
        setPermissions(["issue_rewards"])
        break
      default:
        setPermissions([])
    }
  }

  const handlePermissionToggle = (permission: Permission) => {
    setPermissions((prev) => (prev.includes(permission) ? prev.filter((p) => p !== permission) : [...prev, permission]))
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const formData = new FormData(e.currentTarget)

      // Add permissions to form data
      formData.append("permissions", JSON.stringify(permissions))

      // Add password to form data if provided
      if (password) {
        formData.append("password", password)
      }

      const response = await fetch("/api/managers/create", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Vezetői kártya létrehozása sikertelen")
      }

      toast({
        title: translations.success,
        description: "Vezetői kártya sikeresen létrehozva",
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

  return (
    <ProtectedRoute requiredPermission="manage_managers">
      <div className="max-w-md mx-auto">
        <Card className="dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="dark:text-white">{translations.generateManagerCard}</CardTitle>
            <CardDescription className="dark:text-gray-300">Új vezetői kártya létrehozása</CardDescription>
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
                  required
                  className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
                />
              </div>

              <div className="space-y-2">
                <Label className="dark:text-gray-200">Vezető szerepköre</Label>
                <RadioGroup
                  defaultValue="Tréner"
                  name="role"
                  required
                  onValueChange={handleRoleChange}
                  className="dark:text-white"
                >
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
                <Label htmlFor="password" className="dark:text-gray-200">
                  Jelszó (opcionális)
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Adjon meg egy jelszót a bejelentkezéshez"
                  className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
                />
                <p className="text-sm text-muted-foreground dark:text-gray-400">
                  Ha megad egy jelszót, a vezető bejelentkezhet anélkül, hogy be kellene olvasnia a QR kódot.
                </p>
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
                {isSubmitting ? "Létrehozás..." : translations.add}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </ProtectedRoute>
  )
}
