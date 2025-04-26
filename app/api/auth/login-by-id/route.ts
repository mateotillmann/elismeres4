import { NextResponse } from "next/server"
import { getManagerCard } from "@/lib/data"

export async function POST(request: Request) {
  try {
    const { managerId, password } = await request.json()

    if (!managerId || !password) {
      return NextResponse.json({ error: "Vezető azonosító és jelszó megadása kötelező" }, { status: 400 })
    }

    // Get the manager by ID
    const manager = await getManagerCard(managerId)

    if (!manager) {
      return NextResponse.json({ error: "Vezető nem található" }, { status: 401 })
    }

    // Check password
    if (manager.password !== password) {
      return NextResponse.json({ error: "Érvénytelen jelszó" }, { status: 401 })
    }

    return NextResponse.json({
      success: true,
      manager: {
        id: manager.id,
        name: manager.name,
        role: manager.role,
        permissions: manager.permissions,
      },
    })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Bejelentkezési hiba" }, { status: 500 })
  }
}
