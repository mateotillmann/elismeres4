import { Redis } from "@upstash/redis"
import type { Employee, RewardCard } from "./types"

// Create a Redis client using the REST API URL and token
export const redis = new Redis({
  url: process.env.KV_REST_API_URL || "",
  token: process.env.KV_REST_API_TOKEN || "",
  retry: {
    retries: 3,
    backoff: (retryCount) => Math.min(Math.exp(retryCount) * 50, 1000),
  },
})

// Add a wrapper to log Redis operations in development
const createLoggingProxy = (redisClient: Redis) => {
  return new Proxy(redisClient, {
    get(target, prop) {
      const originalMethod = target[prop as keyof Redis]

      if (typeof originalMethod === "function") {
        return async (...args: any[]) => {
          try {
            console.log(`Redis ${String(prop)} called with:`, args)
            const result = await originalMethod.apply(target, args)
            console.log(`Redis ${String(prop)} result:`, result)
            return result
          } catch (error) {
            console.error(`Redis ${String(prop)} error:`, error)
            throw error
          }
        }
      }

      return originalMethod
    },
  })
}

// Use the logging proxy in development
const redisClient = process.env.NODE_ENV === "development" ? createLoggingProxy(redis) : redis

// Helper functions
export async function getEmployee(id: string): Promise<Employee | null> {
  try {
    const employee = await redisClient.hgetall(`employee:${id}`)
    return Object.keys(employee).length ? (employee as Employee) : null
  } catch (error) {
    console.error(`Error getting employee ${id}:`, error)
    return null
  }
}

export async function getRewardCard(id: string): Promise<RewardCard | null> {
  try {
    const card = await redisClient.hgetall(`card:${id}`)
    return Object.keys(card).length ? (card as RewardCard) : null
  } catch (error) {
    console.error(`Error getting reward card ${id}:`, error)
    return null
  }
}

export default redisClient
