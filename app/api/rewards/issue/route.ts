import { NextResponse } from "next/server"
import { assignExistingCard, getEmployee, getManagerCard } from "@/lib/data"
import { revalidatePath } from "next/cache"

export async function POST(request: Request) {
  try {
    // Handle both JSON and FormData requests
    const contentType = request.headers.get("content-type") || ""

    let employeeId, cardType, cardId, managerApproval, managerName, managerRole

    if (contentType.includes("application/json")) {
      // Parse JSON body
      const data = await request.json()
      console.log("Received JSON data:", data)
      employeeId = data.employeeId
      cardType = data.cardType
      cardId = data.cardId
      managerApproval = data.managerApproval
      managerName = data.managerName
      managerRole = data.managerRole
    } else {
      // Parse FormData
      const formData = await request.formData()
      console.log("Received form data")
      employeeId = formData.get("employeeId") as string
      cardType = formData.get("cardType") as "basic" | "gold" | "platinum"
      cardId = formData.get("cardId") as string
      managerApproval = formData.get("managerApproval") as string
      managerName = formData.get("managerName") as string
      managerRole = formData.get("managerRole") as string
    }

    console.log("Processing reward issuance:", { employeeId, cardType, cardId, managerApproval })

    if (!employeeId || !cardType || !cardId) {
      console.error("Missing required fields:", { employeeId, cardType, cardId })
      return NextResponse.json({ error: "Minden mező kitöltése kötelező" }, { status: 400 })
    }

    // For gold and platinum cards, require manager approval
    if ((cardType === "gold" || cardType === "platinum") && !managerApproval) {
      console.error("Manager approval required but not provided")
      return NextResponse.json({ error: "Vezetői jóváhagyás szükséges" }, { status: 400 })
    }

    const employee = await getEmployee(employeeId)
    if (!employee) {
      console.error("Employee not found:", employeeId)
      return NextResponse.json({ error: "Alkalmazott nem található" }, { status: 404 })
    }

    // Check if manager approval is valid for gold/platinum cards
    if ((cardType === "gold" || cardType === "platinum") && managerApproval) {
      const manager = await getManagerCard(managerApproval)
      if (!manager) {
        console.error("Invalid manager approval:", managerApproval)
        return NextResponse.json({ error: "Érvénytelen vezetői jóváhagyás" }, { status: 400 })
      }
      console.log("Manager verified:", manager)
    }

    // Assign the card
    console.log("Assigning card:", { cardId, employeeId, cardType })
    const result = await assignExistingCard(cardId, employeeId, cardType, managerApproval, managerName, managerRole)

    // Check if the card was successfully assigned
    if (!result) {
      console.error("Card assignment failed:", { cardId, employeeId, cardType })
      return NextResponse.json({ error: "A kártya azonosító már használatban van vagy érvénytelen" }, { status: 400 })
    }

    console.log("Card assigned successfully:", result)

    // Revalidate the rewards page
    revalidatePath("/rewards")

    return NextResponse.json({ success: true, card: result })
  } catch (error) {
    console.error("Error issuing reward:", error)
    return NextResponse.json(
      {
        error: "Jutalom kiadása sikertelen",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
