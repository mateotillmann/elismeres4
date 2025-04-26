import { NextResponse } from "next/server"
import { deleteManagerCard } from "@/lib/data"

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const id = formData.get("id") as string

    if (!id) {
      return NextResponse.json({ error: "Manager ID is required" }, { status: 400 })
    }

    const result = await deleteManagerCard(id)

    if (!result) {
      return NextResponse.json({ error: "Manager card not found" }, { status: 404 })
    }

    return NextResponse.redirect(new URL("/managers", request.url))
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
