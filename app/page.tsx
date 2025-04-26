"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { AuthProvider, useAuth } from "@/lib/auth-context"
import { translations } from "@/lib/translations"
import ManagerCardScanner from "@/components/manager-card-scanner"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, RefreshCw } from "lucide-react"
import type { ManagerCard } from "@/lib/types"

function LoginForm() {
  const router = useRouter()
  const { login, loginWithPassword, adminLogin } = useAuth()
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [managers, setManagers] = useState<ManagerCard[]>([])
  const [selectedManagerId, setSelectedManagerId] = useState<string>("")
  const [isLoadingManagers, setIsLoadingManagers] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  // Add admin user to the list
  const addAdminUser = useCallback((existingManagers: ManagerCard[] = []) => {
    return [
      {
        id: "admin",
        name: "Szabó Dávid",
        role: "Admin",
        position: "Admin",
      },
      ...existingManagers,
    ]
  }, [])

  // Fetch managers for the dropdown
  const fetchManagers = useCallback(async () => {
    try {
      setIsLoadingManagers(true)
      console.log("Fetching managers...")

      const response = await fetch("/api/managers")
      console.log("Managers API response status:", response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error("API error response:", errorText)

        let errorData
        try {
          errorData = JSON.parse(errorText)
        } catch (e) {
          errorData = { error: "Unknown error", details: errorText }
        }

        throw new Error(`Failed to fetch managers: ${response.status} - ${errorData.error || errorText}`)
      }

      const data = await response.json()
      console.log("Fetched managers:", data)

      // Check if data is an array
      if (!Array.isArray(data)) {
        console.error("Invalid data format, expected array:", data)
        throw new Error("Invalid data format received from server")
      }

      // Add admin to the list
      const managersWithAdmin = addAdminUser(data)
      setManagers(managersWithAdmin)
      setFetchError(null)
    } catch (error) {
      console.error("Error fetching managers:", error)
      setFetchError(
        "Nem sikerült betölteni a vezetőket. Használja a vezetői kártya beolvasást vagy jelentkezzen be adminként.",
      )

      // Still add admin even if fetch fails
      setManagers(addAdminUser())
    } finally {
      setIsLoadingManagers(false)
    }
  }, [addAdminUser])

  useEffect(() => {
    fetchManagers()
  }, [fetchManagers, retryCount])

  // Handle retry button click
  const handleRetry = () => {
    setRetryCount((prev) => prev + 1)
  }

  // Update the handleManagerLogin function to be async
  const handleManagerLogin = async (
    managerId: string,
    managerName: string,
    managerRole: string,
    permissions?: any[],
  ) => {
    try {
      const success = await login(managerId, managerName, managerRole, permissions)

      if (success) {
        toast({
          title: translations.success,
          description: `Üdvözöljük, ${managerName}!`,
        })
        router.push("/dashboard")
      } else {
        toast({
          title: translations.error,
          description: "Ez a vezetői kártya már nem érvényes",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Login error:", error)
      toast({
        title: translations.error,
        description: "Bejelentkezési hiba történt",
        variant: "destructive",
      })
    }
  }

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      if (!selectedManagerId || !password) {
        setError("Vezető és jelszó megadása kötelező")
        return
      }

      let success = false

      // Special case for admin login
      if (selectedManagerId === "admin") {
        success = adminLogin(password)
      } else {
        success = await loginWithPassword(selectedManagerId, password)
      }

      if (success) {
        toast({
          title: translations.success,
          description: "Sikeres bejelentkezés",
        })
        router.push("/dashboard")
      } else {
        setError("Érvénytelen jelszó vagy a vezető már nem létezik")
        toast({
          title: translations.error,
          description: "Érvénytelen jelszó vagy a vezető már nem létezik",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Login error:", error)
      setError("Bejelentkezési hiba történt. Kérjük, próbálja újra később.")
    } finally {
      setIsLoading(false)
    }
  }

  // Direct admin login handler
  const handleDirectAdminLogin = () => {
    setSelectedManagerId("admin")
    setPassword("")
  }

  return (
    <div className="container mx-auto flex items-center justify-center min-h-screen">
      <div className="max-w-md w-full">
        <Card className="dark:bg-gray-800">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl dark:text-white">Alkalmazotti Jutalom Kezelő</CardTitle>
            <CardDescription className="dark:text-gray-300">Jelentkezzen be a folytatáshoz</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="manager">
              <TabsList className="grid w-full grid-cols-2 dark:bg-gray-700">
                <TabsTrigger value="manager" className="dark:text-gray-200 dark:data-[state=active]:bg-gray-600">
                  Vezetői kártya
                </TabsTrigger>
                <TabsTrigger value="password" className="dark:text-gray-200 dark:data-[state=active]:bg-gray-600">
                  Jelszavas belépés
                </TabsTrigger>
              </TabsList>

              <TabsContent value="manager" className="mt-4">
                <div className="space-y-4">
                  <div className="text-center mb-4">
                    <p className="text-sm text-muted-foreground dark:text-gray-300">
                      Olvassa be a vezetői kártyáját a bejelentkezéshez
                    </p>
                  </div>
                  <ManagerCardScanner onScan={handleManagerLogin} />
                </div>
              </TabsContent>

              <TabsContent value="password" className="mt-4">
                {error && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Hiba</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {fetchError && (
                  <Alert variant="warning" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {fetchError}
                      <Button
                        variant="outline"
                        size="sm"
                        className="ml-2"
                        onClick={handleRetry}
                        disabled={isLoadingManagers}
                      >
                        <RefreshCw className={`h-3 w-3 mr-1 ${isLoadingManagers ? "animate-spin" : ""}`} />
                        Újrapróbálkozás
                      </Button>
                    </AlertDescription>
                  </Alert>
                )}

                <form onSubmit={handlePasswordLogin}>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="managerId" className="dark:text-gray-200">
                        {translations.selectManager}
                      </Label>
                      {isLoadingManagers ? (
                        <div className="h-10 bg-gray-200 dark:bg-gray-700 animate-pulse rounded"></div>
                      ) : (
                        <Select value={selectedManagerId} onValueChange={setSelectedManagerId} disabled={isLoading}>
                          <SelectTrigger className="dark:bg-gray-700 dark:text-white dark:border-gray-600">
                            <SelectValue placeholder="Válasszon vezetőt" />
                          </SelectTrigger>
                          <SelectContent className="dark:bg-gray-700">
                            {managers.map((manager) => (
                              <SelectItem
                                key={manager.id}
                                value={manager.id}
                                className="dark:text-white dark:focus:bg-gray-600"
                              >
                                {manager.name} ({manager.role})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="managerPassword" className="dark:text-gray-200">
                        Jelszó
                      </Label>
                      <Input
                        id="managerPassword"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
                        required
                        disabled={isLoading}
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full dark:bg-blue-600 dark:hover:bg-blue-700"
                      disabled={isLoading}
                    >
                      {isLoading ? "Bejelentkezés..." : translations.login}
                    </Button>

                    {fetchError && (
                      <div className="mt-4 text-center">
                        <Button variant="outline" size="sm" onClick={handleDirectAdminLogin} className="text-sm">
                          Admin bejelentkezés
                        </Button>
                      </div>
                    )}
                  </div>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex justify-center">
            <p className="text-sm text-muted-foreground dark:text-gray-400">
              &copy; {new Date().getFullYear()} Alkalmazotti Jutalom Kezelő
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <AuthProvider>
      <LoginForm />
    </AuthProvider>
  )
}
