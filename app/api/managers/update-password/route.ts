import { NextResponse } from "next/server"
import { getManagerCard } from "@/lib/data"
import redis from "@/lib/redis"

export async function POST(request: Request) {
  try {
    const { managerId, password } = await request.json()

    if (!managerId || !password) {
      return NextResponse.json({ error: "Hiányzó adatok" }, { status: 400 })
    }

    // Get the manager
    const manager = await getManagerCard(managerId)

    if (!manager) {
      return NextResponse.json({ error: "Vezető nem található" }, { status: 404 })
    }

    // Update the password
    await redis.hset(`manager:${managerId}`, { ...manager, password })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Update password error:", error)
    return NextResponse.json({ error: "Jelszó frissítési hiba" }, { status: 500 })
  }
}
