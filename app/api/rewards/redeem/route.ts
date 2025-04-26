import { NextResponse } from "next/server"
import { redeemRewardCard, getManagerCard } from "@/lib/data"
import { revalidatePath } from "next/cache"

export async function POST(request: Request) {
  try {
    // Handle both JSON and FormData requests
    const contentType = request.headers.get("content-type") || ""

    let cardId, approvedBy, approverName, approverRole

    if (contentType.includes("application/json")) {
      // Parse JSON body
      const data = await request.json()
      cardId = data.cardId
      approvedBy = data.approvedBy
      approverName = data.approverName
      approverRole = data.approverRole
    } else {
      // Parse FormData
      const formData = await request.formData()
      cardId = formData.get("cardId") as string
      approvedBy = formData.get("approvedBy") as string
      approverName = formData.get("approverName") as string
      approverRole = formData.get("approverRole") as string
    }

    console.log("Received redemption request:", { cardId, approvedBy, approverName, approverRole })

    if (!cardId) {
      return NextResponse.json({ error: "Kártya azonosító szükséges" }, { status: 400 })
    }

    if (!approvedBy || !approverName || !approverRole) {
      return NextResponse.json({ error: "Vezetői jóváhagyás szükséges" }, { status: 400 })
    }

    // Check if the approver is a Műszakvezető or Admin
    if (approverRole !== "Műszakvezető" && approverRole !== "Admin") {
      return NextResponse.json(
        { error: "Csak Műszakvezető vagy Admin hagyhatja jóvá a kártya beváltását" },
        { status: 400 },
      )
    }

    // Skip manager verification for admin
    if (approverRole !== "Admin") {
      // Verify the manager exists
      const manager = await getManagerCard(approvedBy)
      if (!manager) {
        return NextResponse.json({ error: "Érvénytelen vezetői jóváhagyás" }, { status: 400 })
      }
    }

    const result = await redeemRewardCard(cardId, approvedBy, approverName, approverRole)
    if (!result) {
      return NextResponse.json({ error: "Kártya nem található vagy már beváltva" }, { status: 404 })
    }

    revalidatePath("/rewards")
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error redeeming card:", error)
    return NextResponse.json({ error: "Kártya beváltása sikertelen" }, { status: 500 })
  }
}
