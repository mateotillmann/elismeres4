import { getManagerCards } from "@/lib/data"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PlusCircle, Trash2, Edit } from "lucide-react"
import Link from "next/link"
import ProtectedRoute from "@/components/protected-route"
import { translations } from "@/lib/translations"

export default async function ManagersPage() {
  const managerCards = await getManagerCards()

  return (
    <ProtectedRoute requiredPermission="manage_managers">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">{translations.managers}</h1>
          <Link href="/managers/new">
            <Button>
              <PlusCircle className="h-4 w-4 mr-2" />
              {translations.generateManagerCard}
            </Button>
          </Link>
        </div>

        {managerCards.length === 0 ? (
          <div className="text-center p-12 border rounded-lg">
            <h2 className="text-xl font-semibold mb-2">Nincsenek vezetői kártyák</h2>
            <p className="text-muted-foreground mb-4">Hozzon létre vezetői kártyákat a jutalmak jóváhagyásához</p>
            <Link href="/managers/new">
              <Button>
                <PlusCircle className="h-4 w-4 mr-2" />
                {translations.generateManagerCard}
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {managerCards.map((manager) => (
              <Card key={manager.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{manager.name}</CardTitle>
                  </div>
                  <CardDescription>
                    {manager.position} - {manager.role || "Nincs szerepkör"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-center">
                    <div className="border p-4 rounded-lg bg-white">
                      <img src={manager.qrCode || "/placeholder.svg"} alt="QR Code" className="w-48 h-48" />
                    </div>
                  </div>
                  <div className="text-center text-sm text-muted-foreground">
                    Kártya ID: <span className="font-mono">{manager.id}</span>
                  </div>
                  <div className="flex justify-center gap-2">
                    <Link href={`/managers/${manager.id}/edit`}>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4 mr-2" />
                        {translations.edit}
                      </Button>
                    </Link>
                    <form action="/api/managers/delete" method="POST">
                      <input type="hidden" name="id" value={manager.id} />
                      <Button variant="destructive" size="sm" type="submit">
                        <Trash2 className="h-4 w-4 mr-2" />
                        {translations.delete}
                      </Button>
                    </form>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}
