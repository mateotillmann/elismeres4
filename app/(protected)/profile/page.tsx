"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { useAuth } from "@/lib/auth-context"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

export default function ProfilePage() {
  const router = useRouter()
  const { managerInfo, isAdmin, updatePassword } = useAuth()
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!managerInfo && !isAdmin) {
    router.push("/")
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!managerInfo) {
      setError("Csak vezetők változtathatják meg a jelszavukat")
      return
    }

    if (password !== confirmPassword) {
      setError("A jelszavak nem egyeznek")
      return
    }

    if (password.length < 6) {
      setError("A jelszónak legalább 6 karakter hosszúnak kell lennie")
      return
    }

    setIsSubmitting(true)

    try {
      const success = await updatePassword(managerInfo.id, password)

      if (success) {
        toast({
          title: "Sikeres",
          description: "A jelszó sikeresen frissítve",
        })
        setPassword("")
        setConfirmPassword("")
      } else {
        setError("Nem sikerült frissíteni a jelszót")
      }
    } catch (error) {
      setError("Hiba történt a jelszó frissítése közben")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <Card className="dark:bg-gray-800">
        <CardHeader>
          <CardTitle className="dark:text-white">Profil</CardTitle>
          <CardDescription className="dark:text-gray-300">
            {isAdmin ? "Admin fiók" : `${managerInfo?.name} (${managerInfo?.role})`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isAdmin ? (
            <div className="text-center p-4 dark:text-gray-200">
              <p>Az admin fiók jelszava nem módosítható ezen a felületen.</p>
            </div>
          ) : (
            <>
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Hiba</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="password" className="dark:text-gray-200">
                      Új jelszó
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="dark:text-gray-200">
                      Jelszó megerősítése
                    </Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full dark:bg-blue-600 dark:hover:bg-blue-700"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Mentés..." : "Jelszó módosítása"}
                  </Button>
                </div>
              </form>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
