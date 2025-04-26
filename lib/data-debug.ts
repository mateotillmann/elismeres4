import redis from "./redis"
import type { Employee, RewardCard, ManagerCard } from "./types"
import QRCode from "qrcode"

// Helper function to log Redis operations
async function logRedisOperation(operation: string, args: any[], result: any) {
  console.log(`Redis ${operation}:`, { args, result })
  return result
}

// Employee functions
export async function getEmployees(): Promise<Employee[]> {
  try {
    console.log("Getting all employees")
    const employeeIds = await redis.smembers("employees")
    console.log(`Found ${employeeIds.length} employee IDs:`, employeeIds)

    if (!employeeIds.length) return []

    const employees = await Promise.all(
      employeeIds.map(async (id) => {
        const employee = await redis.hgetall(`employee:${id}`)
        console.log(`Employee ${id}:`, employee)
        return employee
      }),
    )

    return employees.filter(Boolean) as Employee[]
  } catch (error) {
    console.error("Error getting employees:", error)
    throw error
  }
}

export async function getEmployee(id: string): Promise<Employee | null> {
  try {
    console.log(`Getting employee with ID: ${id}`)
    const employee = await redis.hgetall(`employee:${id}`)
    console.log(`Employee data:`, employee)
    return Object.keys(employee).length ? (employee as Employee) : null
  } catch (error) {
    console.error(`Error getting employee ${id}:`, error)
    throw error
  }
}

// Reward card functions
export async function getRewardCards(employeeId?: string): Promise<RewardCard[]> {
  try {
    console.log(`Getting reward cards${employeeId ? ` for employee ${employeeId}` : ""}`)
    let cardIds: string[]

    if (employeeId) {
      cardIds = await redis.smembers(`employee:${employeeId}:cards`)
      console.log(`Found ${cardIds.length} card IDs for employee ${employeeId}:`, cardIds)
    } else {
      cardIds = await redis.smembers("cards")
      console.log(`Found ${cardIds.length} total card IDs:`, cardIds)
    }

    if (!cardIds.length) return []

    const cards = await Promise.all(
      cardIds.map(async (id) => {
        const card = await redis.hgetall(`card:${id}`)
        console.log(`Card ${id}:`, card)
        return card
      }),
    )

    return cards.filter(Boolean) as RewardCard[]
  } catch (error) {
    console.error("Error getting reward cards:", error)
    throw error
  }
}

export async function getRewardCard(id: string): Promise<RewardCard | null> {
  try {
    console.log(`Getting reward card with ID: ${id}`)
    const card = await redis.hgetall(`card:${id}`)
    console.log(`Card data:`, card)
    return Object.keys(card).length ? (card as RewardCard) : null
  } catch (error) {
    console.error(`Error getting reward card ${id}:`, error)
    throw error
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
    console.log(`Assigning card ${cardId} to employee ${employeeId}`, {
      cardType,
      approvedBy,
      approverName,
      approverRole,
    })

    // Check if card already exists
    const existingCard = await getRewardCard(cardId)
    if (existingCard) {
      console.log(`Card ID ${cardId} already exists`)
      return null // Card ID already in use
    }

    const employee = await getEmployee(employeeId)
    if (!employee) {
      console.log(`Employee ${employeeId} not found`)
      return null // Employee not found
    }

    // Determine points based on card type
    let points = 1
    if (cardType === "gold") points = 2
    if (cardType === "platinum") points = 3

    // Calculate expiration
    const expiresAt = calculateExpirationDate(employee.employmentType)
    console.log(`Card will expire at: ${new Date(expiresAt).toISOString()}`)

    // Generate QR code
    const qrCodeData = JSON.stringify({
      id: cardId,
      employeeId,
      cardType,
      points,
    })

    console.log(`Generating QR code with data:`, qrCodeData)
    const qrCode = await QRCode.toDataURL(qrCodeData)

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

    console.log(`Saving new card to Redis:`, newCard)

    // Save card data
    await redis.hset(`card:${cardId}`, newCard)
    console.log(`Added card data to card:${cardId}`)

    // Add card to global set
    await redis.sadd("cards", cardId)
    console.log(`Added ${cardId} to cards set`)

    // Add card to employee's set
    await redis.sadd(`employee:${employeeId}:cards`, cardId)
    console.log(`Added ${cardId} to employee:${employeeId}:cards set`)

    return newCard
  } catch (error) {
    console.error(`Error assigning card ${cardId}:`, error)
    throw error
  }
}

// Manager card functions
export async function getManagerCards(): Promise<ManagerCard[]> {
  try {
    console.log("Getting all manager cards")
    const managerIds = await redis.smembers("managers")
    console.log(`Found ${managerIds.length} manager IDs:`, managerIds)

    if (!managerIds.length) return []

    const managers = await Promise.all(
      managerIds.map(async (id) => {
        const manager = await redis.hgetall(`manager:${id}`)
        console.log(`Manager ${id}:`, manager)
        return manager
      }),
    )

    return managers.filter(Boolean) as ManagerCard[]
  } catch (error) {
    console.error("Error getting manager cards:", error)
    throw error
  }
}

export async function getManagerCard(id: string): Promise<ManagerCard | null> {
  try {
    console.log(`Getting manager card with ID: ${id}`)
    const manager = await redis.hgetall(`manager:${id}`)
    console.log(`Manager data:`, manager)
    return Object.keys(manager).length ? (manager as ManagerCard) : null
  } catch (error) {
    console.error(`Error getting manager card ${id}:`, error)
    throw error
  }
}

// Helper function to calculate expiration date based on employment type
export function calculateExpirationDate(employmentType: Employee["employmentType"]): number {
  const now = Date.now()
  const oneDay = 24 * 60 * 60 * 1000

  switch (employmentType) {
    case "full-time":
      return now + 7 * oneDay // 1 week for full-time employees
    case "part-time":
    case "student":
      return now + 14 * oneDay // 2 weeks for part-time and student employees
    default:
      return now + 7 * oneDay
  }
}
