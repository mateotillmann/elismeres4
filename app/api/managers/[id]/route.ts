import { NextResponse } from "next/server"
import { getManagerCard } from "@/lib/data"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const manager = await getManagerCard(params.id)

    if (!manager) {
      return NextResponse.json({ error: "Manager not found" }, { status: 404 })
    }

    return NextResponse.json(manager)
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
