"use server"

import { revalidatePath } from "next/cache"
import {
  createEmployee,
  updateEmployee,
  deleteEmployee,
  assignExistingCard,
  redeemRewardCard,
  deleteRewardCard,
  getEmployee,
  createManagerCard,
  deleteManagerCard,
} from "@/lib/data"
import type { Employee, RewardCard } from "@/lib/types"
import { v4 as uuidv4 } from "uuid"

export async function addEmployee(formData: FormData) {
  const name = formData.get("name") as string
  const position = formData.get("position") as string
  const employmentType = formData.get("employmentType") as Employee["employmentType"]

  if (!name || !position || !employmentType) {
    return { error: "Minden mező kitöltése kötelező" }
  }

  try {
    await createEmployee({ name, position, employmentType })
    revalidatePath("/employees")
    return { success: true }
  } catch (error) {
    return { error: "Alkalmazott létrehozása sikertelen" }
  }
}

export async function editEmployee(formData: FormData) {
  const id = formData.get("id") as string
  const name = formData.get("name") as string
  const position = formData.get("position") as string
  const employmentType = formData.get("employmentType") as Employee["employmentType"]
  const isLocked = formData.get("isLocked") === "true"
  const lockReason = (formData.get("lockReason") as string) || ""

  if (!id || !name || !position || !employmentType) {
    return { error: "Minden mező kitöltése kötelező" }
  }

  try {
    await updateEmployee(id, {
      name,
      position,
      employmentType,
      isLocked,
      lockReason: isLocked ? lockReason : "", // Clear lock reason when unlocking
    })
    revalidatePath("/employees")
    return { success: true }
  } catch (error) {
    return { error: "Alkalmazott frissítése sikertelen" }
  }
}

export async function removeEmployee(formData: FormData) {
  const id = formData.get("id") as string

  if (!id) {
    return { error: "Alkalmazott azonosító szükséges" }
  }

  try {
    await deleteEmployee(id)
    revalidatePath("/employees")
    return { success: true }
  } catch (error) {
    return { error: "Alkalmazott törlése sikertelen" }
  }
}

// Simplified reward card issuance function
export async function issueRewardCard(formData: FormData) {
  console.log("Starting issueRewardCard server action")

  const employeeId = formData.get("employeeId") as string
  const cardType = formData.get("cardType") as RewardCard["cardType"]

  // Generate a unique card ID if not provided
  let cardId = formData.get("cardId") as string
  if (!cardId) {
    cardId = uuidv4().substring(0, 8)
  }

  // Get manager info from form data (if provided)
  const managerName = (formData.get("managerName") as string) || "Admin"
  const managerRole = (formData.get("managerRole") as string) || "Admin"
  const managerApproval = (formData.get("managerApproval") as string) || "admin"

  console.log("Form data:", { employeeId, cardType, cardId, managerName, managerRole, managerApproval })

  if (!employeeId || !cardType) {
    console.log("Missing required fields")
    return { error: "Minden mező kitöltése kötelező" }
  }

  try {
    const employee = await getEmployee(employeeId)
    if (!employee) {
      console.log("Employee not found:", employeeId)
      return { error: "Alkalmazott nem található" }
    }

    // Check if employee is locked
    if (employee.isLocked) {
      return { error: "Ez az alkalmazott zárolva van, nem kaphat jutalmat" }
    }

    console.log("Assigning card:", { cardId, employeeId, cardType })
    const result = await assignExistingCard(cardId, employeeId, cardType, managerApproval, managerName, managerRole)

    if (!result) {
      console.log("Card assignment failed")
      return { error: "A kártya azonosító már használatban van vagy érvénytelen" }
    }

    console.log("Card assigned successfully:", result)
    revalidatePath("/rewards")
    return { success: true, card: result }
  } catch (error) {
    console.error("Error issuing reward:", error)
    return { error: "Jutalom kiadása sikertelen" }
  }
}

// Update the redeemCard function to include approval information
export async function redeemCard(formData: FormData) {
  const cardId = formData.get("cardId") as string
  const approvedBy = formData.get("approvedBy") as string
  const approverName = formData.get("approverName") as string
  const approverRole = formData.get("approverRole") as string

  if (!cardId) {
    return { error: "Kártya azonosító szükséges" }
  }

  if (!approvedBy || !approverName || !approverRole) {
    return { error: "Vezetői jóváhagyás szükséges" }
  }

  // Check if the approver is a Műszakvezető or Admin
  if (approverRole !== "Műszakvezető" && approverRole !== "Admin") {
    return { error: "Csak Műszakvezető vagy Admin hagyhatja jóvá a kártya beváltását" }
  }

  try {
    const result = await redeemRewardCard(cardId, approvedBy, approverName, approverRole)
    if (!result) {
      return { error: "Kártya nem található vagy már beváltva" }
    }

    revalidatePath("/rewards")
    return { success: true }
  } catch (error) {
    return { error: "Kártya beváltása sikertelen" }
  }
}

export async function deleteCard(formData: FormData) {
  const cardId = formData.get("cardId") as string

  if (!cardId) {
    return { error: "Kártya azonosító szükséges" }
  }

  try {
    const result = await deleteRewardCard(cardId)
    if (!result) {
      return { error: "Kártya nem található" }
    }

    revalidatePath("/rewards")
    return { success: true }
  } catch (error) {
    return { error: "Kártya törlése sikertelen" }
  }
}

// Update the addManagerCard function to include role
export async function addManagerCard(formData: FormData) {
  const name = formData.get("name") as string
  const position = formData.get("position") as string
  const role = formData.get("role") as "Tréner" | "Koordinátor" | "Műszakvezető"

  if (!name || !position || !role) {
    return { error: "Minden mező kitöltése kötelező" }
  }

  try {
    await createManagerCard({ name, position, role })
    revalidatePath("/managers")
    return { success: true }
  } catch (error) {
    return { error: "Vezetői kártya létrehozása sikertelen" }
  }
}

export async function removeManagerCard(formData: FormData) {
  const id = formData.get("id") as string

  if (!id) {
    return { error: "Vezetői kártya azonosító szükséges" }
  }

  try {
    await deleteManagerCard(id)
    revalidatePath("/managers")
    return { success: true }
  } catch (error) {
    return { error: "Vezetői kártya törlése sikertelen" }
  }
}
