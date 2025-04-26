import { NextResponse } from "next/server"
import { getManagerCards } from "@/lib/data"

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json({ error: "Felhasználónév és jelszó megadása kötelező" }, { status: 400 })
    }

    // Get all managers
    const managers = await getManagerCards()

    // Find manager by name and password
    const manager = managers.find((m) => m.name.toLowerCase() === username.toLowerCase() && m.password === password)

    if (!manager) {
      return NextResponse.json({ error: "Érvénytelen felhasználónév vagy jelszó" }, { status: 401 })
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
