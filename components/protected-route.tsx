"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import type { Permission } from "@/lib/types"

export default function ProtectedRoute({
  children,
  requiredPermission,
}: {
  children: React.ReactNode
  requiredPermission?: Permission
}) {
  const { isLoggedIn, isAdmin, hasPermission } = useAuth()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted) {
      if (!isLoggedIn) {
        router.push("/")
        return
      }

      if (requiredPermission) {
        // Check if user has the required permission
        const hasRequiredPermission = isAdmin || hasPermission(requiredPermission)

        if (!hasRequiredPermission) {
          console.log(`Access denied: missing permission ${requiredPermission}`)
          router.push("/dashboard")
        }
      }
    }
  }, [isLoggedIn, requiredPermission, hasPermission, router, mounted, isAdmin])

  // Don't render anything until mounted to prevent hydration issues
  if (!mounted) {
    return null
  }

  // When authenticated, show children
  return <>{children}</>
}
