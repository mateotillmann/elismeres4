import { NextResponse } from "next/server"
import { assignExistingCard, getEmployee } from "@/lib/data"
import { revalidatePath } from "next/cache"

export async function POST(request: Request) {
  try {
    // Parse JSON body instead of FormData
    const data = await request.json()

    console.log("Received reward issue request:", data)

    const { employeeId, cardType, cardId, managerApproval, managerName, managerRole } = data

    if (!employeeId || !cardType || !cardId) {
      console.log("Missing required fields:", { employeeId, cardType, cardId })
      return NextResponse.json({ error: "Minden mező kitöltése kötelező" }, { status: 400 })
    }

    const employee = await getEmployee(employeeId)
    if (!employee) {
      console.log("Employee not found:", employeeId)
      return NextResponse.json({ error: "Alkalmazott nem található" }, { status: 404 })
    }

    console.log("Creating reward card:", { cardId, employeeId, cardType })
    const result = await assignExistingCard(
      cardId,
      employeeId,
      cardType,
      managerApproval || undefined,
      managerName || undefined,
      managerRole || undefined,
    )

    if (!result) {
      console.log("Card ID already in use or invalid:", cardId)
      return NextResponse.json({ error: "A kártya azonosító már használatban van vagy érvénytelen" }, { status: 400 })
    }

    console.log("Reward card created successfully:", result)
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
