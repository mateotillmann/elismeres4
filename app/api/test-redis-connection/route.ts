import { NextResponse } from "next/server"
import redis from "@/lib/redis"

export async function GET() {
  try {
    console.log("Testing Redis connection...")

    // Test basic Redis connection
    const pingResult = await redis.ping()
    console.log("Redis ping result:", pingResult)

    // Test basic Redis operations
    const testKey = "test-connection"
    const testValue = "connected-" + Date.now()

    await redis.set(testKey, testValue)
    const result = await redis.get(testKey)

    if (result === testValue) {
      console.log("Redis connection successful:", result)

      // Test if managers set exists
      const managersExists = await redis.exists("managers")
      console.log("Managers set exists:", managersExists)

      if (managersExists) {
        const managerIds = await redis.smembers("managers")
        console.log("Manager IDs:", managerIds)
      } else {
        console.log("Creating empty managers set")
        await redis.sadd("managers", "test-manager-id")
        await redis.srem("managers", "test-manager-id")
      }

      return NextResponse.json({
        success: true,
        message: "Redis connection successful",
        result,
        managersExists,
      })
    } else {
      console.error("Redis connection test failed - values don't match:", { sent: testValue, received: result })
      return NextResponse.json(
        {
          success: false,
          error: "Redis connection test failed - values don't match",
          sent: testValue,
          received: result,
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Redis connection test error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Redis connection test failed",
        details: error instanceof Error ? error.message : String(error),
        env: {
          KV_URL: process.env.KV_URL ? "Set" : "Not set",
          KV_REST_API_URL: process.env.KV_REST_API_URL ? "Set" : "Not set",
          KV_REST_API_TOKEN: process.env.KV_REST_API_TOKEN
            ? "Set (length: " + process.env.KV_REST_API_TOKEN.length + ")"
            : "Not set",
        },
      },
      { status: 500 },
    )
  }
}
