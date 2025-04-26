import { NextResponse } from "next/server"
import redis from "@/lib/redis"

export async function GET() {
  try {
    console.log("API: Fetching managers from Redis")

    // Test Redis connection first
    try {
      await redis.ping()
      console.log("API: Redis connection successful")
    } catch (redisError) {
      console.error("API: Redis connection failed:", redisError)
      return NextResponse.json(
        {
          error: "Database connection failed",
          details: redisError instanceof Error ? redisError.message : String(redisError),
        },
        { status: 500 },
      )
    }

    // Get manager IDs
    let managerIds
    try {
      managerIds = await redis.smembers("managers")
      console.log(`API: Found ${managerIds.length} manager IDs:`, managerIds)
    } catch (error) {
      console.error("API: Error fetching manager IDs:", error)
      return NextResponse.json(
        { error: "Failed to fetch manager IDs", details: error instanceof Error ? error.message : String(error) },
        { status: 500 },
      )
    }

    // If no managers, return empty array
    if (!managerIds || managerIds.length === 0) {
      console.log("API: No managers found, returning empty array")
      return NextResponse.json([])
    }

    // Get manager data
    try {
      const managers = await Promise.all(
        managerIds.map(async (id) => {
          try {
            const manager = await redis.hgetall(`manager:${id}`)
            console.log(`API: Manager ${id}:`, manager)

            // Check if manager data is valid
            if (!manager || Object.keys(manager).length === 0) {
              console.log(`API: Empty manager data for ID ${id}`)
              return null
            }

            return {
              id,
              name: manager.name || "Unknown",
              role: manager.role || "Unknown",
              position: manager.position || "Unknown",
              permissions: manager.permissions || [],
            }
          } catch (managerError) {
            console.error(`API: Error fetching manager ${id}:`, managerError)
            return null
          }
        }),
      )

      // Filter out null values and return
      const validManagers = managers.filter(Boolean)
      console.log(`API: Returning ${validManagers.length} valid managers`)
      return NextResponse.json(validManagers)
    } catch (error) {
      console.error("API: Error processing managers:", error)
      return NextResponse.json(
        { error: "Failed to process managers", details: error instanceof Error ? error.message : String(error) },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("API: Unhandled error in managers route:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
