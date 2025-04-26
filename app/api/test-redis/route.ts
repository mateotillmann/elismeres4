import { NextResponse } from "next/server"
import redis from "@/lib/redis"

export async function GET() {
  try {
    // Test Redis connection
    const testKey = "test-connection"
    const testValue = "connected-" + Date.now()

    console.log("Testing Redis connection...")
    await redis.set(testKey, testValue)
    const result = await redis.get(testKey)

    if (result === testValue) {
      console.log("Redis connection successful:", result)
      return NextResponse.json({
        success: true,
        message: "Redis connection successful",
        result,
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
      },
      { status: 500 },
    )
  }
}
