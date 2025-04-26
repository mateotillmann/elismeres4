"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { PlusCircle, Clock, Search } from "lucide-react"
import Link from "next/link"
import { translations } from "@/lib/translations"
import type { Employee, RewardCard } from "@/lib/types"

export default function RewardsPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [rewardCards, setRewardCards] = useState<RewardCard[]>([])
  const [activeCards, setActiveCards] = useState<RewardCard[]>([])
  const [filteredCards, setFilteredCards] = useState<RewardCard[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [error, setError] = useState<string | null>(null)

  // Fetch data on component mount
  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true)

        // Fetch employees
        const employeesResponse = await fetch("/api/employees")
        if (!employeesResponse.ok) {
          throw new Error("Failed to fetch employees")
        }
        const employeesData = await employeesResponse.json()
        setEmployees(employeesData)

        // Fetch reward cards
        const cardsResponse = await fetch("/api/rewards")
        if (!cardsResponse.ok) {
          throw new Error("Failed to fetch reward cards")
        }
        const cardsData = await cardsResponse.json()
        setRewardCards(cardsData)

        // Filter active cards (not redeemed)
        const active = cardsData.filter((card: RewardCard) => !card.isRedeemed)

        // Sort by issuedAt date (newest first)
        const sorted = [...active].sort((a, b) => b.issuedAt - a.issuedAt)

        setActiveCards(sorted)
        setFilteredCards(sorted)
      } catch (err) {
        console.error("Error fetching data:", err)
        setError("Failed to load rewards data")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  // Filter cards based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredCards(activeCards)
      return
    }

    const query = searchQuery.toLowerCase()
    const filtered = activeCards.filter((card) => {
      const employee = employees.find((e) => e.id === card.employeeId)
      const employeeName = employee ? employee.name.toLowerCase() : ""

      // Search by employee name, card type, or approver name
      return (
        employeeName.includes(query) ||
        card.cardType.toLowerCase().includes(query) ||
        (card.approverName && card.approverName.toLowerCase().includes(query))
      )
    })

    setFilteredCards(filtered)
  }, [searchQuery, activeCards, employees])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl sm:text-3xl font-bold">{translations.activeRewards}</h1>
        <div className="text-center p-12">
          <p>Betöltés...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">{translations.activeRewards}</h1>
          <Link href="/rewards/new">
            <Button>
              <PlusCircle className="h-4 w-4 mr-2" />
              {translations.issueReward}
            </Button>
          </Link>
        </div>
        <div className="text-center p-12 border rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Hiba történt</h2>
          <p className="text-muted-foreground mb-4">A jutalmak betöltése sikertelen</p>
          <Link href="/rewards/new">
            <Button>
              <PlusCircle className="h-4 w-4 mr-2" />
              {translations.issueReward}
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold">{translations.activeRewards}</h1>
        <Link href="/rewards/new" className="shrink-0">
          <Button className="w-full sm:w-auto">
            <PlusCircle className="h-4 w-4 mr-2" />
            {translations.issueReward}
          </Button>
        </Link>
      </div>

      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          id="search-rewards"
          placeholder="Keresés név vagy kártya típus alapján..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {filteredCards.length === 0 ? (
        <div className="text-center p-12 border rounded-lg">
          {activeCards.length === 0 ? (
            <>
              <h2 className="text-xl font-semibold mb-2">{translations.noActiveRewards}</h2>
              <p className="text-muted-foreground mb-4">{translations.issueYourFirstReward}</p>
              <Link href="/rewards/new">
                <Button>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  {translations.issueReward}
                </Button>
              </Link>
            </>
          ) : (
            <>
              <h2 className="text-xl font-semibold mb-2">Nincs találat</h2>
              <p className="text-muted-foreground mb-4">Próbáljon más keresési feltételt</p>
              <Button variant="outline" onClick={() => setSearchQuery("")}>
                Keresés törlése
              </Button>
            </>
          )}
        </div>
      ) : (
        <>
          {/* Desktop view */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{translations.employees}</TableHead>
                  <TableHead>{translations.cardType}</TableHead>
                  <TableHead>{translations.points}</TableHead>
                  <TableHead>{translations.issuedDate}</TableHead>
                  <TableHead>{translations.expirationDate}</TableHead>
                  <TableHead>{translations.status}</TableHead>
                  <TableHead>Jóváhagyta</TableHead>
                  <TableHead>{translations.actions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCards.map((card) => {
                  const employee = employees.find((e) => e.id === card.employeeId)
                  const isExpired = card.expiresAt < Date.now()
                  const daysLeft = Math.ceil((card.expiresAt - Date.now()) / (24 * 60 * 60 * 1000))

                  return (
                    <TableRow key={card.id}>
                      <TableCell className="font-medium">
                        {employee ? (
                          <Link href={`/employees/${employee.id}`} className="hover:underline">
                            {employee.name}
                          </Link>
                        ) : (
                          "Ismeretlen alkalmazott"
                        )}
                      </TableCell>
                      <TableCell>
                        {card.cardType === "platinum"
                          ? "Arany kártya🏅"
                          : card.cardType === "gold"
                            ? "2 pontos 🥈"
                            : "1 pontos 🥉"}
                      </TableCell>
                      <TableCell>{card.points}</TableCell>
                      <TableCell>{new Date(card.issuedAt).toLocaleDateString("hu-HU")}</TableCell>
                      <TableCell>{new Date(card.expiresAt).toLocaleDateString("hu-HU")}</TableCell>
                      <TableCell>
                        {isExpired ? (
                          <span className="text-red-600">{translations.expired}</span>
                        ) : (
                          <span className="inline-flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            {daysLeft} {daysLeft === 1 ? translations.dayLeft : translations.daysLeft}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>{card.approverName ? `${card.approverName} (${card.approverRole})` : "-"}</TableCell>
                      <TableCell>
                        <Link href={`/rewards/${card.id}`}>
                          <Button variant="outline" size="sm">
                            {translations.view}
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          {/* Mobile view - Cards */}
          <div className="md:hidden space-y-4">
            {filteredCards.map((card) => {
              const employee = employees.find((e) => e.id === card.employeeId)
              const isExpired = card.expiresAt < Date.now()
              const daysLeft = Math.ceil((card.expiresAt - Date.now()) / (24 * 60 * 60 * 1000))

              return (
                <Card key={card.id} className="border rounded-lg p-4 shadow-sm">
                  <CardContent className="p-0">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-medium">{employee ? employee.name : "Ismeretlen alkalmazott"}</h3>
                        <p className="text-sm text-muted-foreground">
                          {card.cardType === "platinum"
                            ? "Arany kártya🏅"
                            : card.cardType === "gold"
                              ? "2 pontos 🥈"
                              : "1 pontos 🥉"}
                        </p>
                      </div>
                      <div className="text-xs px-2 py-1 rounded-full bg-secondary">{card.points} pont</div>
                    </div>

                    <div className="space-y-1 text-sm mt-3">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Kiállítva:</span>
                        <span>{new Date(card.issuedAt).toLocaleDateString("hu-HU")}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Lejárat:</span>
                        <span>{new Date(card.expiresAt).toLocaleDateString("hu-HU")}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Állapot:</span>
                        {isExpired ? (
                          <span className="text-red-600">{translations.expired}</span>
                        ) : (
                          <span className="inline-flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {daysLeft} {daysLeft === 1 ? translations.dayLeft : translations.daysLeft}
                          </span>
                        )}
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Jóváhagyta:</span>
                        <span>{card.approverName ? `${card.approverName}` : "-"}</span>
                      </div>
                    </div>

                    <div className="mt-4">
                      <Link href={`/rewards/${card.id}`} className="w-full">
                        <Button variant="outline" size="sm" className="w-full">
                          {translations.view}
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
