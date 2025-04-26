"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { toast } from "@/components/ui/use-toast"
import { translations } from "@/lib/translations"
import ManagerCardScanner from "./manager-card-scanner"
import { useAuth } from "@/lib/auth-context"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { ManagerCard } from "@/lib/types"

export default function RedeemCardButton({ cardId }: { cardId: string }) {
  const router = useRouter()
  const { isAdmin, managerInfo } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [needsApproval, setNeedsApproval] = useState(true)
  const [managerApproval, setManagerApproval] = useState<{ id: string; name: string; role: string } | null>(null)
  const [approvalTab, setApprovalTab] = useState<string>("scan")
  const [managers, setManagers] = useState<ManagerCard[]>([])
  const [selectedManagerId, setSelectedManagerId] = useState<string>("")
  const [password, setPassword] = useState("")
  const [isLoadingManagers, setIsLoadingManagers] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)

  // Fetch managers for the password validation option
  const fetchManagers = async () => {
    if (managers.length > 0) return // Only fetch once

    try {
      setIsLoadingManagers(true)
      const response = await fetch("/api/managers")

      if (!response.ok) {
        throw new Error("Failed to fetch managers")
      }

      const data = await response.json()

      // Filter for only Műszakvezető managers
      const shiftManagers = data.filter((manager: ManagerCard) => manager.role === "Műszakvezető")
      setManagers(shiftManagers)

      // Set the first manager as selected if available
      if (shiftManagers.length > 0) {
        setSelectedManagerId(shiftManagers[0].id)
      }
    } catch (error) {
      console.error("Error fetching managers:", error)
      toast({
        title: translations.error,
        description: "Nem sikerült betölteni a vezetőket",
        variant: "destructive",
      })
    } finally {
      setIsLoadingManagers(false)
    }
  }

  // Update the handleRedeem function to properly handle admin validation
  async function handleRedeem() {
    setIsSubmitting(true)

    try {
      // Admin should be able to validate without any additional checks
      if (isAdmin) {
        const approvalData = {
          cardId,
          approvedBy: "admin",
          approverName: "Admin",
          approverRole: "Admin",
        }

        const response = await fetch("/api/rewards/redeem", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(approvalData),
        })

        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error || "Kártya beváltása sikertelen")
        }

        toast({
          title: translations.success,
          description: "Jutalom kártya sikeresen beváltva",
        })

        router.refresh()
        return
      }

      // For non-admin users, check if they have a műszakvezető role or scanned a műszakvezető card
      if (!managerApproval && !managerInfo) {
        toast({
          title: translations.error,
          description: "Műszakvezető jóváhagyása szükséges",
          variant: "destructive",
        })
        setIsSubmitting(false)
        return
      }

      // Use the scanned műszakvezető card info for approval, regardless of who is logged in
      // This allows a tréner to redeem a card if they scan a műszakvezető card
      const approvalData = {
        cardId,
        approvedBy: managerApproval ? managerApproval.id : managerInfo?.id || "",
        approverName: managerApproval ? managerApproval.name : managerInfo?.name || "",
        approverRole: managerApproval ? managerApproval.role : managerInfo?.role || "",
      }

      console.log("Sending approval data:", approvalData)

      const response = await fetch("/api/rewards/redeem", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(approvalData),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Kártya beváltása sikertelen")
      }

      toast({
        title: translations.success,
        description: "Jutalom kártya sikeresen beváltva",
      })

      router.refresh()
    } catch (error) {
      console.error("Error redeeming card:", error)
      toast({
        title: translations.error,
        description: error instanceof Error ? error.message : "Valami hiba történt",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
      setIsOpen(false)
    }
  }

  const handleManagerScan = (managerId: string, managerName: string, managerRole: string) => {
    // Only accept Műszakvezető cards for approval
    if (managerRole !== "Műszakvezető") {
      toast({
        title: translations.error,
        description: "Csak Műszakvezető hagyhatja jóvá a kártya beváltását",
        variant: "destructive",
      })
      return
    }

    setManagerApproval({
      id: managerId,
      name: managerName,
      role: managerRole,
    })
    setNeedsApproval(false)

    toast({
      title: translations.success,
      description: "Vezetői jóváhagyás sikeres",
    })
  }

  // Handle password validation
  const handlePasswordValidation = async () => {
    setPasswordError(null)

    if (!selectedManagerId || !password) {
      setPasswordError("Vezető és jelszó megadása kötelező")
      return
    }

    try {
      const response = await fetch("/api/auth/login-by-id", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ managerId: selectedManagerId, password }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        setPasswordError("Érvénytelen jelszó")
        return
      }

      // Check if the manager is a Műszakvezető
      if (data.manager.role !== "Műszakvezető") {
        setPasswordError("Csak Műszakvezető hagyhatja jóvá a kártya beváltását")
        return
      }

      // Set manager approval
      setManagerApproval({
        id: data.manager.id,
        name: data.manager.name,
        role: data.manager.role,
      })
      setNeedsApproval(false)

      toast({
        title: translations.success,
        description: "Vezetői jóváhagyás sikeres",
      })
    } catch (error) {
      console.error("Error validating password:", error)
      setPasswordError("Hiba történt a jelszó ellenőrzése során")
    }
  }

  // Skip approval if admin or manager with Műszakvezető role is logged in
  const canSkipApproval = isAdmin || (managerInfo && managerInfo.role === "Műszakvezető")

  // Load managers when the password tab is selected
  const handleTabChange = (value: string) => {
    setApprovalTab(value)
    if (value === "password") {
      fetchManagers()
    }
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button className="w-full">{translations.redeemReward}</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        {needsApproval && !canSkipApproval ? (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle>Műszakvezető jóváhagyása szükséges</AlertDialogTitle>
              <AlertDialogDescription>
                Kérjük, olvassa be a műszakvezető kártyáját vagy adja meg a jelszavát a beváltás jóváhagyásához
              </AlertDialogDescription>
            </AlertDialogHeader>

            <Tabs defaultValue="scan" value={approvalTab} onValueChange={handleTabChange}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="scan">QR kód beolvasása</TabsTrigger>
                <TabsTrigger value="password">Jelszavas jóváhagyás</TabsTrigger>
              </TabsList>

              <TabsContent value="scan" className="mt-4">
                <ManagerCardScanner onScan={handleManagerScan} requiredRole="Műszakvezető" />
              </TabsContent>

              <TabsContent value="password" className="mt-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="managerId">Műszakvezető kiválasztása</Label>
                    <Select value={selectedManagerId} onValueChange={setSelectedManagerId} disabled={isLoadingManagers}>
                      <SelectTrigger>
                        <SelectValue placeholder="Válasszon műszakvezetőt" />
                      </SelectTrigger>
                      <SelectContent>
                        {isLoadingManagers ? (
                          <SelectItem value="loading" disabled>
                            Betöltés...
                          </SelectItem>
                        ) : managers.length === 0 ? (
                          <SelectItem value="none" disabled>
                            Nincs elérhető műszakvezető
                          </SelectItem>
                        ) : (
                          managers.map((manager) => (
                            <SelectItem key={manager.id} value={manager.id}>
                              {manager.name} ({manager.role})
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Jelszó</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Adja meg a műszakvezető jelszavát"
                    />
                  </div>

                  {passwordError && <div className="text-sm text-red-500">{passwordError}</div>}

                  <Button
                    onClick={handlePasswordValidation}
                    disabled={isLoadingManagers || !selectedManagerId}
                    className="w-full"
                  >
                    Jóváhagyás jelszóval
                  </Button>
                </div>
              </TabsContent>
            </Tabs>

            <AlertDialogFooter>
              <AlertDialogCancel>{translations.cancel}</AlertDialogCancel>
            </AlertDialogFooter>
          </>
        ) : (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle>{translations.confirmRedeem}</AlertDialogTitle>
              <AlertDialogDescription>
                {translations.thisActionCannotBeUndone}
                <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 rounded text-sm">
                  Jóváhagyva:{" "}
                  {isAdmin
                    ? "Admin"
                    : managerApproval
                      ? `${managerApproval.name} (${managerApproval.role})`
                      : managerInfo
                        ? `${managerInfo.name} (${managerInfo.role})`
                        : ""}
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{translations.cancel}</AlertDialogCancel>
              <AlertDialogAction onClick={handleRedeem} disabled={isSubmitting}>
                {isSubmitting ? "Beváltás..." : translations.redeemReward}
              </AlertDialogAction>
            </AlertDialogFooter>
          </>
        )}
      </AlertDialogContent>
    </AlertDialog>
  )
}
