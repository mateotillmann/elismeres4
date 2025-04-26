import { getRewardCards, getEmployees } from "@/lib/data"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CheckCircle } from "lucide-react"
import Link from "next/link"
import { translations } from "@/lib/translations"

export default async function RedeemedRewardsPage() {
  try {
    // Fetch all reward cards and employees
    const [rewardCards, employees] = await Promise.all([getRewardCards(), getEmployees()])

    // Filter for only redeemed rewards
    const redeemedCards = rewardCards.filter((card) => card.isRedeemed)

    // Sort by redemption date (newest first)
    const sortedCards = [...redeemedCards].sort((a, b) => (b.redeemedAt || 0) - (a.redeemedAt || 0))

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Beváltott jutalmak</h1>
          <div className="flex items-center bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 px-3 py-1 rounded-full text-sm">
            <CheckCircle className="h-4 w-4 mr-2" />
            <span>{redeemedCards.length} beváltott jutalom</span>
          </div>
        </div>

        {redeemedCards.length === 0 ? (
          <div className="text-center p-12 border rounded-lg">
            <h2 className="text-xl font-semibold mb-2">Nincsenek beváltott jutalmak</h2>
            <p className="text-muted-foreground mb-4">A beváltott jutalmak itt fognak megjelenni</p>
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
                    <TableHead>Beváltás dátuma</TableHead>
                    <TableHead>Jóváhagyta</TableHead>
                    <TableHead>{translations.actions}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedCards.map((card) => {
                    const employee = employees.find((e) => e.id === card.employeeId)

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
                        <TableCell>
                          {card.redeemedAt ? new Date(card.redeemedAt).toLocaleDateString("hu-HU") : "-"}
                        </TableCell>
                        <TableCell>{card.approverName ? `${card.approverName} (${card.approverRole})` : "-"}</TableCell>
                        <TableCell>
                          <Link href={`/rewards/${card.id}`}>
                            <button className="px-3 py-1 bg-secondary text-secondary-foreground rounded-md text-sm hover:bg-secondary/80">
                              {translations.view}
                            </button>
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
              {sortedCards.map((card) => {
                const employee = employees.find((e) => e.id === card.employeeId)

                return (
                  <Card key={card.id}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-base">
                          {employee ? employee.name : "Ismeretlen alkalmazott"}
                        </CardTitle>
                        <div className="text-sm px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 rounded-full">
                          {card.points} pont
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Kártya típus:</span>
                          <span>
                            {card.cardType === "platinum"
                              ? "Arany kártya🏅"
                              : card.cardType === "gold"
                                ? "2 pontos 🥈"
                                : "1 pontos 🥉"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Beváltva:</span>
                          <span>{card.redeemedAt ? new Date(card.redeemedAt).toLocaleDateString("hu-HU") : "-"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Jóváhagyta:</span>
                          <span>{card.approverName ? `${card.approverName}` : "-"}</span>
                        </div>
                        <div className="pt-2">
                          <Link href={`/rewards/${card.id}`} className="w-full">
                            <button className="w-full px-3 py-2 bg-secondary text-secondary-foreground rounded-md text-sm hover:bg-secondary/80">
                              Részletek megtekintése
                            </button>
                          </Link>
                        </div>
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
  } catch (error) {
    console.error("Error in RedeemedRewardsPage:", error)
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Beváltott jutalmak</h1>
        <div className="text-center p-12 border rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Hiba történt</h2>
          <p className="text-muted-foreground mb-4">A beváltott jutalmak betöltése sikertelen</p>
        </div>
      </div>
    )
  }
}
