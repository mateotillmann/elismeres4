"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Award, Users, Clock, CheckCircle } from "lucide-react"
import Link from "next/link"
import { translations } from "@/lib/translations"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import type { Employee, RewardCard } from "@/lib/types"
import DailyCardsProgress from "@/components/daily-cards-progress"

export default function DashboardContent() {
  const { isLoggedIn } = useAuth()
  const router = useRouter()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [rewardCards, setRewardCards] = useState<RewardCard[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)

  // Check if user is logged in
  useEffect(() => {
    if (!isLoggedIn) {
      router.push("/")
    }
  }, [isLoggedIn, router])

  // Fetch data
  useEffect(() => {
    let isMounted = true

    async function fetchData() {
      if (!isLoggedIn) return

      try {
        setIsLoading(true)

        const [employeesRes, rewardsRes] = await Promise.all([fetch("/api/employees"), fetch("/api/rewards")])

        if (!isMounted) return

        if (!employeesRes.ok || !rewardsRes.ok) {
          throw new Error("Failed to fetch data")
        }

        const employeesData = await employeesRes.json()
        const rewardsData = await rewardsRes.json()

        if (!isMounted) return

        setEmployees(employeesData)
        setRewardCards(rewardsData)
        setFetchError(null)
      } catch (error) {
        if (!isMounted) return
        console.error("Error fetching dashboard data:", error)
        setFetchError("Failed to load dashboard data")
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    fetchData()

    return () => {
      isMounted = false
    }
  }, [isLoggedIn])

  if (!isLoggedIn) {
    return null
  }

  if (isLoading) {
    return <div className="text-center p-8">Loading...</div>
  }

  if (fetchError) {
    return <div className="text-center p-8 text-red-500">{fetchError}</div>
  }

  const activeCards = rewardCards.filter((card) => !card.isRedeemed)
  const redeemedCards = rewardCards.filter((card) => card.isRedeemed)

  const expiringCards = activeCards.filter((card) => {
    const now = Date.now()
    const threeDays = 3 * 24 * 60 * 60 * 1000
    return card.expiresAt - now < threeDays
  })

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">{translations.dashboard}</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{translations.totalEmployees}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{employees.length}</div>
            <p className="text-xs text-muted-foreground">
              <Link href="/employees" className="underline">
                {translations.manageEmployees}
              </Link>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{translations.activeRewards}</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCards.length}</div>
            <p className="text-xs text-muted-foreground">
              <Link href="/rewards" className="underline">
                {translations.viewAllRewards}
              </Link>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{translations.expiringSoon}</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{expiringCards.length}</div>
            <p className="text-xs text-muted-foreground">{translations.rewardsExpiringSoon}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{translations.redeemedRewards}</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{redeemedCards.length}</div>
            <p className="text-xs text-muted-foreground">
              <Link href="/redeemed-rewards" className="underline">
                {translations.viewRedeemedRewards || "Beváltott jutalmak megtekintése"}
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Daily Cards Progress Bar */}
      <div className="mt-6">
        <DailyCardsProgress rewardCards={rewardCards} />
      </div>

      {/* Rest of the dashboard content */}
    </div>
  )
}
