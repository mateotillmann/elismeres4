import { getEmployee, getRewardCards } from "@/lib/data"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Award, Edit, Plus, Lock } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"
import DeleteEmployeeButton from "@/components/delete-employee-button"
import { translations } from "@/lib/translations"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default async function EmployeeDetailPage({ params }: { params: { id: string } }) {
  const employee = await getEmployee(params.id)

  if (!employee) {
    notFound()
  }

  const rewardCards = await getRewardCards(employee.id)
  const activeCards = rewardCards.filter((card) => !card.isRedeemed)
  const redeemedCards = rewardCards.filter((card) => card.isRedeemed)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl sm:text-3xl font-bold">{employee.name}</h1>
          {employee.isLocked && (
            <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-800/30 dark:text-red-200">
              <Lock className="h-3 w-3 mr-1" />
              Zárolva
            </div>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href={`/employees/${employee.id}/edit`} className="flex-1 sm:flex-none">
            <Button variant="outline" className="w-full sm:w-auto">
              <Edit className="h-4 w-4 mr-2" />
              <span className="whitespace-nowrap">{translations.edit}</span>
            </Button>
          </Link>
          <Link href={`/rewards/new?employeeId=${employee.id}`} className="flex-1 sm:flex-none">
            <Button disabled={employee.isLocked} className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              <span className="whitespace-nowrap">{translations.issueReward}</span>
            </Button>
          </Link>
          <div className="flex-1 sm:flex-none w-full sm:w-auto">
            <DeleteEmployeeButton employeeId={employee.id} />
          </div>
        </div>
      </div>

      {employee.isLocked && (
        <Alert variant="destructive">
          <AlertDescription>
            <div className="font-medium">Ez az alkalmazott zárolva van, nem kaphat jutalmat.</div>
            {employee.lockReason && (
              <div className="mt-1">
                <span className="font-medium">Ok:</span> {employee.lockReason}
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{translations.position}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{employee.position}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{translations.employmentType}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {employee.employmentType === "full-time"
                ? translations.fullTime
                : employee.employmentType === "part-time"
                  ? translations.partTime
                  : translations.student}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{translations.activeRewards}</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCards.length}</div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <h2 className="text-xl font-bold">Jutalom kártyák</h2>

        {rewardCards.length === 0 ? (
          <div className="text-center p-12 border rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Nincsenek jutalmak</h3>
            <p className="text-muted-foreground mb-4">Adjon ki jutalmat ennek az alkalmazottnak</p>
            <Link href={`/rewards/new?employeeId=${employee.id}`}>
              <Button disabled={employee.isLocked}>
                <Plus className="h-4 w-4 mr-2" />
                {translations.issueReward}
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rewardCards.map((card) => {
              const isExpired = card.expiresAt < Date.now()
              const daysLeft = Math.ceil((card.expiresAt - Date.now()) / (24 * 60 * 60 * 1000))

              return (
                <Card key={card.id} className={isExpired ? "opacity-70" : ""}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">
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
                    <CardDescription>{card.points}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
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
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Beváltva:</span>
                          <span>{new Date(card.redeemedAt!).toLocaleDateString("hu-HU")}</span>
                        </div>
                      )}
                    </div>

                    {!card.isRedeemed && !isExpired && (
                      <div className="mt-4">
                        <Link href={`/rewards/${card.id}`}>
                          <Button className="w-full">{translations.view}</Button>
                        </Link>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
