import { v4 as uuidv4 } from "uuid"
import QRCode from "qrcode"
import { calculateExpirationDate } from "./utils"

// Helper function to get KV namespace from the request
function getKV(request) {
  return request.env.EMPLOYEE_KV
}

// Employee functions
export async function getEmployees(request) {
  try {
    const KV = getKV(request)
    const employeeIds = (await KV.get("employees", { type: "json" })) || []

    if (!employeeIds.length) return []

    const employees = await Promise.all(
      employeeIds.map(async (id) => {
        const employee = await KV.get(`employee:${id}`, { type: "json" })
        return employee
      }),
    )

    return employees.filter(Boolean)
  } catch (error) {
    console.error("Error getting employees:", error)
    return []
  }
}

export async function getEmployee(request, id) {
  try {
    const KV = getKV(request)
    const employee = await KV.get(`employee:${id}`, { type: "json" })
    return employee
  } catch (error) {
    console.error(`Error getting employee ${id}:`, error)
    return null
  }
}

export async function createEmployee(request, data) {
  try {
    const KV = getKV(request)
    const id = uuidv4()
    const employee = {
      id,
      name: data.name || "",
      position: data.position || "",
      employmentType: data.employmentType || "full-time",
      createdAt: Date.now(),
      isLocked: false,
    }

    // Store employee data
    await KV.put(`employee:${id}`, JSON.stringify(employee))

    // Update employee list
    const employeeIds = (await KV.get("employees", { type: "json" })) || []
    employeeIds.push(id)
    await KV.put("employees", JSON.stringify(employeeIds))

    return employee
  } catch (error) {
    console.error("Error creating employee:", error)
    throw error
  }
}

export async function updateEmployee(request, id, data) {
  try {
    const KV = getKV(request)
    const employee = await getEmployee(request, id)
    if (!employee) return null

    const updatedEmployee = {
      ...employee,
      ...data,
    }

    await KV.put(`employee:${id}`, JSON.stringify(updatedEmployee))
    return updatedEmployee
  } catch (error) {
    console.error(`Error updating employee ${id}:`, error)
    throw error
  }
}

export async function deleteEmployee(request, id) {
  try {
    const KV = getKV(request)
    const employee = await getEmployee(request, id)
    if (!employee) return false

    // Get employee's cards
    const cardIds = (await KV.get(`employee:${id}:cards`, { type: "json" })) || []

    // Delete each card
    for (const cardId of cardIds) {
      await deleteRewardCard(request, cardId)
    }

    // Delete employee
    await KV.delete(`employee:${id}`)
    await KV.delete(`employee:${id}:cards`)

    // Update employee list
    const employeeIds = (await KV.get("employees", { type: "json" })) || []
    const updatedIds = employeeIds.filter((empId) => empId !== id)
    await KV.put("employees", JSON.stringify(updatedIds))

    return true
  } catch (error) {
    console.error(`Error deleting employee ${id}:`, error)
    throw error
  }
}

// Reward card functions
export async function getRewardCards(request, employeeId) {
  try {
    const KV = getKV(request)
    let cardIds

    if (employeeId) {
      cardIds = (await KV.get(`employee:${employeeId}:cards`, { type: "json" })) || []
    } else {
      cardIds = (await KV.get("cards", { type: "json" })) || []
    }

    if (!cardIds.length) return []

    const cards = await Promise.all(
      cardIds.map(async (id) => {
        const card = await KV.get(`card:${id}`, { type: "json" })
        return card
      }),
    )

    return cards.filter(Boolean)
  } catch (error) {
    console.error("Error getting reward cards:", error)
    return []
  }
}

export async function getRewardCard(request, id) {
  try {
    const KV = getKV(request)
    const card = await KV.get(`card:${id}`, { type: "json" })
    return card
  } catch (error) {
    console.error(`Error getting reward card ${id}:`, error)
    return null
  }
}

export async function assignExistingCard(
  request,
  cardId,
  employeeId,
  cardType,
  approvedBy,
  approverName,
  approverRole,
) {
  try {
    const KV = getKV(request)

    // Check if card already exists
    const existingCard = await getRewardCard(request, cardId)

    // If card exists but is not redeemed, we can't reuse it
    if (existingCard && !existingCard.isRedeemed) {
      return null // Card ID already in use by an active card
    }

    // If card exists and is redeemed, delete it first to allow reuse
    if (existingCard && existingCard.isRedeemed) {
      await deleteRewardCard(request, cardId)
    }

    const employee = await getEmployee(request, employeeId)
    if (!employee) {
      return null // Employee not found
    }

    // Check if employee is locked
    if (employee.isLocked) {
      return null // Employee is locked
    }

    // Determine points based on card type
    let points = 1
    if (cardType === "gold") points = 2
    if (cardType === "platinum") points = 3

    // Calculate expiration
    const expiresAt = calculateExpirationDate(employee.employmentType)

    // Generate simplified QR code - just the card ID
    const qrCode = await QRCode.toDataURL(cardId)

    const newCard = {
      id: cardId,
      employeeId,
      cardType,
      points,
      issuedAt: Date.now(),
      expiresAt,
      qrCode,
      isRedeemed: false,
      approvedBy,
      approverName,
      approverRole,
    }

    // Save card data
    await KV.put(`card:${cardId}`, JSON.stringify(newCard))

    // Update cards list
    const cardIds = (await KV.get("cards", { type: "json" })) || []
    if (!cardIds.includes(cardId)) {
      cardIds.push(cardId)
      await KV.put("cards", JSON.stringify(cardIds))
    }

    // Update employee's cards
    const employeeCardIds = (await KV.get(`employee:${employeeId}:cards`, { type: "json" })) || []
    if (!employeeCardIds.includes(cardId)) {
      employeeCardIds.push(cardId)
      await KV.put(`employee:${employeeId}:cards`, JSON.stringify(employeeCardIds))
    }

    return newCard
  } catch (error) {
    console.error(`Error assigning card ${cardId}:`, error)
    throw error
  }
}

export async function redeemRewardCard(request, cardId, approvedBy, approverName, approverRole) {
  try {
    const KV = getKV(request)
    const card = await getRewardCard(request, cardId)
    if (!card) return null

    // Check if already redeemed
    if (card.isRedeemed) return null

    // Check if expired
    if (card.expiresAt < Date.now()) return null

    const updatedCard = {
      ...card,
      isRedeemed: true,
      redeemedAt: Date.now(),
      approvedBy,
      approverName,
      approverRole,
    }

    await KV.put(`card:${cardId}`, JSON.stringify(updatedCard))
    return updatedCard
  } catch (error) {
    console.error(`Error redeeming card ${cardId}:`, error)
    throw error
  }
}

export async function deleteRewardCard(request, cardId) {
  try {
    const KV = getKV(request)
    const card = await getRewardCard(request, cardId)
    if (!card) return false

    // Remove from employee's cards
    const employeeCardIds = (await KV.get(`employee:${card.employeeId}:cards`, { type: "json" })) || []
    const updatedEmployeeCardIds = employeeCardIds.filter((id) => id !== cardId)
    await KV.put(`employee:${card.employeeId}:cards`, JSON.stringify(updatedEmployeeCardIds))

    // Remove from global cards set
    const cardIds = (await KV.get("cards", { type: "json" })) || []
    const updatedCardIds = cardIds.filter((id) => id !== cardId)
    await KV.put("cards", JSON.stringify(updatedCardIds))

    // Delete card data
    await KV.delete(`card:${cardId}`)

    return true
  } catch (error) {
    console.error(`Error deleting card ${cardId}:`, error)
    throw error
  }
}

// Manager card functions
export async function getManagerCards(request) {
  try {
    const KV = getKV(request)
    const managerIds = (await KV.get("managers", { type: "json" })) || []

    if (!managerIds.length) return []

    const managers = await Promise.all(
      managerIds.map(async (id) => {
        const manager = await KV.get(`manager:${id}`, { type: "json" })
        return manager
      }),
    )

    return managers.filter(Boolean)
  } catch (error) {
    console.error("Error getting manager cards:", error)
    return []
  }
}

export async function getManagerCard(request, id) {
  try {
    const KV = getKV(request)
    const manager = await KV.get(`manager:${id}`, { type: "json" })
    return manager
  } catch (error) {
    console.error(`Error getting manager card ${id}:`, error)
    return null
  }
}

export async function createManagerCard(request, data) {
  try {
    const KV = getKV(request)
    const id = uuidv4()

    // Generate simplified QR code - just the manager ID
    const qrCode = await QRCode.toDataURL(id)

    const manager = {
      id,
      name: data.name,
      position: data.position,
      role: data.role,
      createdAt: Date.now(),
      qrCode,
      permissions: data.permissions || [],
      password: data.password,
    }

    // Save manager data
    await KV.put(`manager:${id}`, JSON.stringify(manager))

    // Update manager list
    const managerIds = (await KV.get("managers", { type: "json" })) || []
    managerIds.push(id)
    await KV.put("managers", JSON.stringify(managerIds))

    return manager
  } catch (error) {
    console.error("Error creating manager card:", error)
    throw error
  }
}

export async function deleteManagerCard(request, id) {
  try {
    const KV = getKV(request)
    const manager = await getManagerCard(request, id)
    if (!manager) return false

    // Delete manager data
    await KV.delete(`manager:${id}`)

    // Update manager list
    const managerIds = (await KV.get("managers", { type: "json" })) || []
    const updatedIds = managerIds.filter((managerId) => managerId !== id)
    await KV.put("managers", JSON.stringify(updatedIds))

    return true
  } catch (error) {
    console.error(`Error deleting manager card ${id}:`, error)
    throw error
  }
}
