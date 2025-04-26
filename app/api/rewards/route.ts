import { NextResponse } from "next/server"
import { getRewardCards } from "@/lib/data"

export async function GET() {
  try {
    const rewards = await getRewardCards()
    return NextResponse.json(rewards)
  } catch (error) {
    console.error("Error fetching rewards:", error)
    return NextResponse.json({ error: "Failed to fetch rewards" }, { status: 500 })
  }
}
