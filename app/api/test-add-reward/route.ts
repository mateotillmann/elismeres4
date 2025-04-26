import { NextResponse } from "next/server"
import { assignExistingCard } from "@/lib/data-debug"
import { v4 as uuidv4 } from "uuid"

export async function GET() {
  try {
    console.log("Testing reward card creation...")

    // Get the first employee
    const employees = await fetch(new URL("/api/employees", "http://localhost:3000")).then((res) => res.json())

    if (!employees || employees.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "No employees found",
        },
        { status: 404 },
      )
    }

    const employee = employees[0]
    console.log("Selected employee:", employee)

    // Generate a unique card ID
    const cardId = uuidv4().substring(0, 8)

    // Create a basic card
    const result = await assignExistingCard(cardId, employee.id, "basic")

    if (!result) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to create reward card",
        },
        { status: 500 },
      )
    }

    console.log("Reward card created successfully:", result)
    return NextResponse.json({
      success: true,
      message: "Reward card created successfully",
      card: result,
    })
  } catch (error) {
    console.error("Test add reward error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Test add reward failed",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
