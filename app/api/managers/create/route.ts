import { NextResponse } from "next/server"
import { createManagerCard } from "@/lib/data"
import { revalidatePath } from "next/cache"
import type { Permission } from "@/lib/types"

export async function POST(request: Request) {
  try {
    const formData = await request.formData()

    const name = formData.get("name") as string
    const position = formData.get("position") as string
    const role = formData.get("role") as "Tréner" | "Koordinátor" | "Műszakvezető"
    const permissionsJson = formData.get("permissions") as string
    const password = formData.get("password") as string | null

    if (!name || !position || !role) {
      return NextResponse.json({ error: "Minden mező kitöltése kötelező" }, { status: 400 })
    }

    // Parse permissions
    let permissions: Permission[] = []
    try {
      permissions = JSON.parse(permissionsJson) as Permission[]
      console.log("Creating manager with permissions:", permissions)
    } catch (error) {
      console.error("Error parsing permissions:", error)
      return NextResponse.json({ error: "Invalid permissions format" }, { status: 400 })
    }

    const result = await createManagerCard({
      name,
      position,
      role,
      permissions,
      password: password || undefined,
    })

    console.log("Manager created with permissions:", result.permissions)

    revalidatePath("/managers")
    return NextResponse.json({ success: true, manager: result })
  } catch (error) {
    console.error("Error creating manager card:", error)
    return NextResponse.json(
      {
        error: "Vezetői kártya létrehozása sikertelen",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
