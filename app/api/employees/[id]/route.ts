import { NextResponse } from "next/server"
import { getEmployee } from "@/lib/data"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const employee = await getEmployee(params.id)

    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 })
    }

    return NextResponse.json(employee)
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
