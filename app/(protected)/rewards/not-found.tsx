import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { translations } from "@/lib/translations"

export default function RewardNotFound() {
  return (
    <div className="max-w-md mx-auto space-y-6">
      <Link href="/rewards" className="text-sm hover:underline">
        &larr; {translations.rewards}
      </Link>
      <Card>
        <CardHeader>
          <CardTitle>Jutalom nem található</CardTitle>
          <CardDescription>A keresett jutalom kártya nem található</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Ellenőrizze, hogy helyesen adta-e meg a kártya azonosítóját, vagy hozzon létre egy új jutalmat.</p>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Link href="/rewards">
            <Button variant="outline">Vissza a jutalmakhoz</Button>
          </Link>
          <Link href="/rewards/new">
            <Button>Új jutalom kiadása</Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}
