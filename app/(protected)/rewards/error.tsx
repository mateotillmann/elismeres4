"use client"

import { useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { translations } from "@/lib/translations"

export default function RewardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Rewards error:", error)
  }, [error])

  return (
    <div className="max-w-md mx-auto space-y-6">
      <Link href="/rewards" className="text-sm hover:underline">
        &larr; {translations.rewards}
      </Link>
      <Card>
        <CardHeader>
          <CardTitle>Hiba történt</CardTitle>
          <CardDescription>Valami hiba történt a jutalmak betöltése közben</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Kérjük, próbálja újra később vagy lépjen kapcsolatba a rendszergazdával.</p>
          <p className="text-sm text-muted-foreground mt-2">Hiba részletei: {error.message}</p>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={reset}>
            Próbálja újra
          </Button>
          <Link href="/rewards/new">
            <Button>Új jutalom kiadása</Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}
