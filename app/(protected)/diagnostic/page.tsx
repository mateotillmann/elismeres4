"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export default function DiagnosticPage() {
  const [redisStatus, setRedisStatus] = useState<"loading" | "success" | "error">("loading")
  const [redisMessage, setRedisMessage] = useState("")
  const [testAddStatus, setTestAddStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [testAddMessage, setTestAddMessage] = useState("")

  useEffect(() => {
    async function checkRedis() {
      try {
        const response = await fetch("/api/test-redis")
        const data = await response.json()

        if (data.success) {
          setRedisStatus("success")
          setRedisMessage("Redis connection successful")
        } else {
          setRedisStatus("error")
          setRedisMessage(`Redis connection failed: ${data.error}`)
        }
      } catch (error) {
        setRedisStatus("error")
        setRedisMessage(`Redis connection test error: ${error instanceof Error ? error.message : String(error)}`)
      }
    }

    checkRedis()
  }, [])

  async function handleTestAddReward() {
    setTestAddStatus("loading")
    setTestAddMessage("Testing reward addition...")

    try {
      const response = await fetch("/api/test-add-reward")
      const data = await response.json()

      if (data.success) {
        setTestAddStatus("success")
        setTestAddMessage(`Reward added successfully: ${JSON.stringify(data.card)}`)
      } else {
        setTestAddStatus("error")
        setTestAddMessage(`Failed to add reward: ${data.error}`)
      }
    } catch (error) {
      setTestAddStatus("error")
      setTestAddMessage(`Test add reward error: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Diagnostic Page</h1>

      <Card>
        <CardHeader>
          <CardTitle>Redis Connection Status</CardTitle>
          <CardDescription>Testing connection to Redis database</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center">
              <div
                className={`w-3 h-3 rounded-full mr-2 ${
                  redisStatus === "loading"
                    ? "bg-yellow-500"
                    : redisStatus === "success"
                      ? "bg-green-500"
                      : "bg-red-500"
                }`}
              ></div>
              <span>
                {redisStatus === "loading"
                  ? "Testing connection..."
                  : redisStatus === "success"
                    ? "Connected"
                    : "Connection failed"}
              </span>
            </div>
            {redisMessage && <div className="text-sm p-2 bg-gray-100 dark:bg-gray-800 rounded">{redisMessage}</div>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Test Add Reward</CardTitle>
          <CardDescription>Test adding a reward card to the first employee</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center">
              <div
                className={`w-3 h-3 rounded-full mr-2 ${
                  testAddStatus === "idle"
                    ? "bg-gray-500"
                    : testAddStatus === "loading"
                      ? "bg-yellow-500"
                      : testAddStatus === "success"
                        ? "bg-green-500"
                        : "bg-red-500"
                }`}
              ></div>
              <span>
                {testAddStatus === "idle"
                  ? "Not tested"
                  : testAddStatus === "loading"
                    ? "Testing..."
                    : testAddStatus === "success"
                      ? "Test successful"
                      : "Test failed"}
              </span>
            </div>
            {testAddMessage && (
              <div className="text-sm p-2 bg-gray-100 dark:bg-gray-800 rounded overflow-auto max-h-40">
                {testAddMessage}
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleTestAddReward} disabled={testAddStatus === "loading"}>
            {testAddStatus === "loading" ? "Testing..." : "Test Add Reward"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
