import redis from "./redis"
import type { Employee, RewardCard, ManagerCard, Permission } from "./types"
import QRCode from "qrcode"
import { v4 as uuidv4 } from "uuid"
import { calculateExpirationDate } from "./utils"

// Employee functions
export async function getEmployees(): Promise<Employee[]> {
  try {
    const employeeIds = await redis.smembers("employees")

    if (!employeeIds.length) return []

    const employees = await Promise.all(
      employeeIds.map(async (id) => {
        const employee = await redis.hgetall(`employee:${id}`)
        return employee
      }),
    )

    return employees.filter(Boolean) as Employee[]
  } catch (error) {
    console.error("Error getting employees:", error)
    return []
  }
}

export async function getEmployee(id: string): Promise<Employee | null> {
  try {
    const employee = await redis.hgetall(`employee:${id}`)
    return Object.keys(employee).length ? (employee as Employee) : null
  } catch (error) {
    console.error(`Error getting employee ${id}:`, error)
    return null
  }
}

export async function createEmployee(data: Partial<Employee>): Promise<Employee> {
  try {
    const id = uuidv4()
    const employee: Employee = {
      id,
      name: data.name || "",
      position: data.position || "",
      employmentType: data.employmentType || "full-time",
      createdAt: Date.now(),
      isLocked: false,
    }

    await redis.hset(`employee:${id}`, employee)
    await redis.sadd("employees", id)

    return employee
  } catch (error) {
    console.error("Error creating employee:", error)
    throw error
  }
}

export async function updateEmployee(id: string, data: Partial<Employee>): Promise<Employee | null> {
  try {
    const employee = await getEmployee(id)
    if (!employee) return null

    const updatedEmployee = {
      ...employee,
      ...data,
    }

    await redis.hset(`employee:${id}`, updatedEmployee)
    return updatedEmployee
  } catch (error) {
    console.error(`Error updating employee ${id}:`, error)
    throw error
  }
}

export async function deleteEmployee(id: string): Promise<boolean> {
  try {
    const employee = await getEmployee(id)
    if (!employee) return false

    // Get employee's cards
    const cardIds = await redis.smembers(`employee:${id}:cards`)

    // Delete each card
    for (const cardId of cardIds) {
      await deleteRewardCard(cardId)
    }

    // Delete employee
    await redis.del(`employee:${id}`)
    await redis.del(`employee:${id}:cards`)
    await redis.srem("employees", id)

    return true
  } catch (error) {
    console.error(`Error deleting employee ${id}:`, error)
    throw error
  }
}

// Reward card functions
export async function getRewardCards(employeeId?: string): Promise<RewardCard[]> {
  try {
    let cardIds: string[]

    if (employeeId) {
      cardIds = await redis.smembers(`employee:${employeeId}:cards`)
    } else {
      cardIds = await redis.smembers("cards")
    }

    if (!cardIds.length) return []

    const cards = await Promise.all(
      cardIds.map(async (id) => {
        const card = await redis.hgetall(`card:${id}`)
        return card
      }),
    )

    return cards.filter(Boolean) as RewardCard[]
  } catch (error) {
    console.error("Error getting reward cards:", error)
    return []
  }
}

export async function getRewardCard(id: string): Promise<RewardCard | null> {
  try {
    const card = await redis.hgetall(`card:${id}`)
    return Object.keys(card).length ? (card as RewardCard) : null
  } catch (error) {
    console.error(`Error getting reward card ${id}:`, error)
    return null
  }
}

export async function assignExistingCard(
  cardId: string,
  employeeId: string,
  cardType: RewardCard["cardType"],
  approvedBy?: string,
  approverName?: string,
  approverRole?: string,
): Promise<RewardCard | null> {
  try {
    // Check if card already exists
    const existingCard = await getRewardCard(cardId)

    // If card exists but is not redeemed, we can't reuse it
    if (existingCard && !existingCard.isRedeemed) {
      return null // Card ID already in use by an active card
    }

    // If card exists and is redeemed, delete it first to allow reuse
    if (existingCard && existingCard.isRedeemed) {
      await deleteRewardCard(cardId)
    }

    const employee = await getEmployee(employeeId)
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

    const newCard: RewardCard = {
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
    await redis.hset(`card:${cardId}`, newCard)
    await redis.sadd("cards", cardId)
    await redis.sadd(`employee:${employeeId}:cards`, cardId)

    return newCard
  } catch (error) {
    console.error(`Error assigning card ${cardId}:`, error)
    throw error
  }
}

export async function redeemRewardCard(
  cardId: string,
  approvedBy: string,
  approverName: string,
  approverRole: string,
): Promise<RewardCard | null> {
  try {
    const card = await getRewardCard(cardId)
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

    await redis.hset(`card:${cardId}`, updatedCard)
    return updatedCard
  } catch (error) {
    console.error(`Error redeeming card ${cardId}:`, error)
    throw error
  }
}

export async function deleteRewardCard(cardId: string): Promise<boolean> {
  try {
    const card = await getRewardCard(cardId)
    if (!card) return false

    // Remove from employee's cards
    await redis.srem(`employee:${card.employeeId}:cards`, cardId)

    // Remove from global cards set
    await redis.srem("cards", cardId)

    // Delete card data
    await redis.del(`card:${cardId}`)

    return true
  } catch (error) {
    console.error(`Error deleting card ${cardId}:`, error)
    throw error
  }
}

// Manager card functions
export async function getManagerCards(): Promise<ManagerCard[]> {
  try {
    const managerIds = await redis.smembers("managers")

    if (!managerIds.length) return []

    const managers = await Promise.all(
      managerIds.map(async (id) => {
        const manager = await redis.hgetall(`manager:${id}`)
        return manager
      }),
    )

    return managers.filter(Boolean) as ManagerCard[]
  } catch (error) {
    console.error("Error getting manager cards:", error)
    return []
  }
}

export async function getManagerCard(id: string): Promise<ManagerCard | null> {
  try {
    const manager = await redis.hgetall(`manager:${id}`)
    return Object.keys(manager).length ? (manager as ManagerCard) : null
  } catch (error) {
    console.error(`Error getting manager card ${id}:`, error)
    return null
  }
}

export async function createManagerCard(data: {
  name: string
  position: string
  role: ManagerCard["role"]
  permissions?: Permission[]
  password?: string
}): Promise<ManagerCard> {
  try {
    const id = uuidv4()

    // Generate simplified QR code - just the manager ID
    const qrCode = await QRCode.toDataURL(id)

    const manager: ManagerCard = {
      id,
      name: data.name,
      position: data.position,
      role: data.role,
      createdAt: Date.now(),
      qrCode,
      permissions: data.permissions || [],
      password: data.password,
    }

    await redis.hset(`manager:${id}`, manager)
    await redis.sadd("managers", id)

    return manager
  } catch (error) {
    console.error("Error creating manager card:", error)
    throw error
  }
}

export async function deleteManagerCard(id: string): Promise<boolean> {
  try {
    const manager = await getManagerCard(id)
    if (!manager) return false

    await redis.del(`manager:${id}`)
    await redis.srem("managers", id)

    return true
  } catch (error) {
    console.error(`Error deleting manager card ${id}:`, error)
    throw error
  }
}
