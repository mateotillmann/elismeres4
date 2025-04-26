import { getRewardCard, getEmployee } from "@/lib/data"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { notFound } from "next/navigation"
import RedeemCardButton from "@/components/redeem-card-button"
import DeleteCardButton from "@/components/delete-card-button"
import { translations } from "@/lib/translations"

export default async function RewardDetailPage({ params }: { params: { id: string } }) {
  try {
    // Skip processing if the ID is "new" - this should be handled by a different route
    if (params.id === "new") {
      console.log("Redirecting from [id] route with id=new to the dedicated /new route")
      notFound() // This will be caught by the error boundary
    }

    console.log(`Fetching reward card with ID: ${params.id}`)
    const card = await getRewardCard(params.id)

    if (!card) {
      console.log(`Card not found: ${params.id}`)
      notFound()
    }

    console.log(`Fetching employee with ID: ${card.employeeId}`)
    let employee = null
    try {
      employee = await getEmployee(card.employeeId)
    } catch (error) {
      console.error(`Error fetching employee ${card.employeeId}:`, error)
      // Continue without employee data
    }

    const isExpired = card.expiresAt < Date.now()
    const daysLeft = Math.ceil((card.expiresAt - Date.now()) / (24 * 60 * 60 * 1000))

    return (
      <div className="max-w-md mx-auto space-y-6">
        <Link href="/rewards" className="text-sm hover:underline">
          &larr; {translations.rewards}
        </Link>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                {card.cardType === "platinum"
                  ? "Arany kártya🏅"
                  : card.cardType === "gold"
                    ? "2 pontos 🥈"
                    : "1 pontos 🥉"}
              </CardTitle>
              <div>
                {card.isRedeemed ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">
                    {translations.redeemed}
                  </span>
                ) : isExpired ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100">
                    {translations.expired}
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100">
                    {translations.active}
                  </span>
                )}
              </div>
            </div>
            <CardDescription>
              {card.points} pont jutalom {employee?.name || "Ismeretlen alkalmazott"} részére
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!card.isRedeemed && !isExpired && (
              <div className="flex justify-center">
                <div className="border p-4 rounded-lg bg-white">
                  <img src={card.qrCode || "/placeholder.svg"} alt="QR Code" className="w-64 h-64 qr-code-image" />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Kártya ID:</span>
                <span className="font-mono">{card.id}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Kiadva:</span>
                <span>{new Date(card.issuedAt).toLocaleDateString("hu-HU")}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Lejárat:</span>
                <span>{new Date(card.expiresAt).toLocaleDateString("hu-HU")}</span>
              </div>
              {!card.isRedeemed && !isExpired && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Hátralévő idő:</span>
                  <span className={daysLeft <= 3 ? "text-red-500 font-medium" : ""}>
                    {daysLeft} {daysLeft === 1 ? translations.dayLeft : translations.daysLeft}
                  </span>
                </div>
              )}
              {card.isRedeemed && (
                <>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Beváltva:</span>
                    <span>{new Date(card.redeemedAt!).toLocaleDateString("hu-HU")}</span>
                  </div>
                  {card.approverName && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Jóváhagyta:</span>
                      <span>
                        {card.approverName} ({card.approverRole})
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            {!card.isRedeemed && !isExpired && <RedeemCardButton cardId={card.id} />}
            <DeleteCardButton cardId={card.id} isRedeemed={card.isRedeemed} />
          </CardFooter>
        </Card>
      </div>
    )
  } catch (error) {
    console.error(`Error in RewardDetailPage:`, error)
    return (
      <div className="max-w-md mx-auto space-y-6">
        <Link href="/rewards" className="text-sm hover:underline">
          &larr; {translations.rewards}
        </Link>
        <Card>
          <CardHeader>
            <CardTitle>Hiba történt</CardTitle>
            <CardDescription>A jutalom kártya betöltése sikertelen</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Kérjük, próbálja újra később vagy lépjen kapcsolatba a rendszergazdával.</p>
            <p className="text-sm text-muted-foreground mt-2">
              Hiba részletei: {error instanceof Error ? error.message : String(error)}
            </p>
          </CardContent>
          <CardFooter>
            <Link href="/rewards">
              <Button>Vissza a jutalmakhoz</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    )
  }
}
