import { NextResponse } from "next/server"
import { getManagerCard } from "@/lib/data"
import redis from "@/lib/redis"
import type { Permission } from "@/lib/types"

export async function POST(request: Request) {
  try {
    const formData = await request.formData()

    const id = formData.get("id") as string
    const name = formData.get("name") as string
    const position = formData.get("position") as string
    const role = formData.get("role") as "Tréner" | "Koordinátor" | "Műszakvezető"
    const permissionsJson = formData.get("permissions") as string
    const changePassword = formData.get("changePassword") === "true"
    const password = formData.get("password") as string | null

    if (!id || !name || !position || !role) {
      return NextResponse.json({ error: "Minden mező kitöltése kötelező" }, { status: 400 })
    }

    // Get the existing manager
    const manager = await getManagerCard(id)
    if (!manager) {
      return NextResponse.json({ error: "Vezető nem található" }, { status: 404 })
    }

    // Parse permissions
    let permissions: Permission[] = []
    try {
      permissions = JSON.parse(permissionsJson) as Permission[]
      console.log("Parsed permissions:", permissions) // Add logging to debug
    } catch (error) {
      console.error("Error parsing permissions:", error)
      return NextResponse.json({ error: "Invalid permissions format" }, { status: 400 })
    }

    // Generate new QR code with updated permissions
    const qrCodeData = JSON.stringify({
      id,
      name,
      position,
      role,
      permissions,
      type: "manager",
    })

    console.log("Generating new QR code with data:", qrCodeData)

    // Import QRCode here to use it
    const QRCode = (await import("qrcode")).default
    const qrCode = await QRCode.toDataURL(qrCodeData)

    // Update manager data
    const updatedManager = {
      ...manager,
      name,
      position,
      role,
      permissions, // Ensure permissions are explicitly set
      qrCode, // Update QR code with new data including permissions
    }

    // Update password if requested
    if (changePassword && password) {
      updatedManager.password = password
    }

    // Save updated manager
    await redis.hset(`manager:${id}`, updatedManager)

    return NextResponse.json({ success: true, manager: updatedManager })
  } catch (error) {
    console.error("Error updating manager:", error)
    return NextResponse.json(
      {
        error: "Vezető frissítése sikertelen",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
