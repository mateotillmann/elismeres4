"use client"

import type React from "react"

import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react"
import type { Permission } from "@/lib/types"

type ManagerInfo = {
  id: string
  name: string
  role: string
  permissions: Permission[]
}

type AuthContextType = {
  isLoggedIn: boolean
  isAdmin: boolean
  managerInfo: ManagerInfo | null
  login: (managerId: string, managerName: string, managerRole: string, permissions?: Permission[]) => boolean
  loginWithPassword: (managerId: string, password: string) => Promise<boolean>
  adminLogin: (password: string) => boolean
  logout: () => void
  hasPermission: (permission: Permission) => boolean
  updatePassword: (managerId: string, newPassword: string) => Promise<boolean>
  resetInactivityTimer: () => void
  remainingTime: number
}

const ADMIN_PASSWORD = "EsztergomiSavinko"
const ADMIN_NAME = "Szabó Dávid"
const INACTIVITY_TIMEOUT = 3 * 60 * 1000 // 3 minutes in milliseconds

// Define role-based permissions
const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  Műszakvezető: ["manage_employees", "issue_rewards", "redeem_rewards", "manage_managers"],
  Koordinátor: ["manage_employees", "issue_rewards"],
  Tréner: ["issue_rewards"],
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [managerInfo, setManagerInfo] = useState<ManagerInfo | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const [remainingTime, setRemainingTime] = useState(INACTIVITY_TIMEOUT)

  // Use refs to avoid dependency issues in useEffect
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null)
  const lastActivityRef = useRef<number>(Date.now())
  const isLoggedInRef = useRef<boolean>(false)

  // Update ref when state changes
  useEffect(() => {
    isLoggedInRef.current = isLoggedIn
  }, [isLoggedIn])

  // Reset inactivity timer
  const resetInactivityTimer = useCallback(() => {
    lastActivityRef.current = Date.now()

    // Clear existing timer
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current)
    }

    // Set new timer
    if (isLoggedInRef.current) {
      inactivityTimerRef.current = setTimeout(() => {
        if (isLoggedInRef.current) {
          console.log("Auto logout due to inactivity")
          logout()
        }
      }, INACTIVITY_TIMEOUT)
    }
  }, []) // Empty dependency array since we're using refs

  // Update remaining time
  useEffect(() => {
    if (!isLoggedIn) return

    const interval = setInterval(() => {
      const elapsed = Date.now() - lastActivityRef.current
      const remaining = Math.max(0, INACTIVITY_TIMEOUT - elapsed)
      setRemainingTime(remaining)

      if (remaining === 0 && isLoggedIn) {
        logout()
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [isLoggedIn])

  // Set up activity listeners
  useEffect(() => {
    if (!isLoggedIn) return

    const activityEvents = ["mousedown", "keydown", "touchstart", "scroll"]

    const handleActivity = () => {
      resetInactivityTimer()
    }

    activityEvents.forEach((event) => {
      window.addEventListener(event, handleActivity)
    })

    // Initial timer
    resetInactivityTimer()

    return () => {
      activityEvents.forEach((event) => {
        window.removeEventListener(event, handleActivity)
      })

      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current)
      }
    }
  }, [isLoggedIn, resetInactivityTimer])

  // Check if user is already authenticated
  useEffect(() => {
    const adminAuth = localStorage.getItem("adminAuth")
    const managerAuth = localStorage.getItem("managerAuth")

    if (adminAuth === "true") {
      setIsAdmin(true)
      setIsLoggedIn(true)
      setManagerInfo({
        id: "admin",
        name: ADMIN_NAME,
        role: "Admin",
        permissions: [
          "manage_employees",
          "issue_rewards",
          "redeem_rewards",
          "manage_managers",
          "add_delete_managers",
          "edit_manager_privileges",
          "change_manager_passwords",
        ],
      })
    } else if (managerAuth) {
      try {
        const manager = JSON.parse(managerAuth) as ManagerInfo
        setManagerInfo(manager)
        setIsLoggedIn(true)
      } catch (error) {
        console.error("Error parsing manager auth:", error)
        localStorage.removeItem("managerAuth")
      }
    }

    setIsInitialized(true)
    // Initialize lastActivityRef
    lastActivityRef.current = Date.now()
  }, [])

  // Update the login function to be async
  const login = useCallback(
    async (managerId: string, managerName: string, managerRole: string, permissions?: Permission[]) => {
      // Get permissions based on role if not provided or empty
      let effectivePermissions = permissions || []

      // If permissions array is empty, use role-based defaults
      if (effectivePermissions.length === 0) {
        effectivePermissions = ROLE_PERMISSIONS[managerRole] || []
      }

      console.log("Login with manager ID:", managerId)
      console.log("Login with role:", managerRole)
      console.log("Login with permissions:", effectivePermissions)

      // Check if manager is deleted
      if (managerId !== "admin") {
        try {
          const exists = await checkManagerExists(managerId)
          if (!exists) {
            console.log("Login attempt with deleted manager ID:", managerId)
            return false
          }
        } catch (error) {
          console.error("Error checking if manager exists:", error)
          // Continue with login if we can't check (e.g., network error)
        }
      }

      const manager: ManagerInfo = {
        id: managerId,
        name: managerName,
        role: managerRole,
        permissions: effectivePermissions,
      }

      setManagerInfo(manager)
      setIsLoggedIn(true)
      localStorage.setItem("managerAuth", JSON.stringify(manager))
      resetInactivityTimer()
      return true
    },
    [resetInactivityTimer],
  )

  // Check if a manager exists (not deleted)
  const checkManagerExists = async (managerId: string): Promise<boolean> => {
    if (managerId === "admin") return true

    try {
      const response = await fetch(`/api/managers/${managerId}`)
      return response.ok
    } catch (error) {
      console.error("Error checking if manager exists:", error)
      return false
    }
  }

  const loginWithPassword = useCallback(
    async (managerId: string, password: string) => {
      try {
        // Special case for admin login
        if (managerId === "admin" && password === ADMIN_PASSWORD) {
          setIsAdmin(true)
          setIsLoggedIn(true)
          setManagerInfo({
            id: "admin",
            name: ADMIN_NAME,
            role: "Admin",
            permissions: [
              "manage_employees",
              "issue_rewards",
              "redeem_rewards",
              "manage_managers",
              "add_delete_managers",
              "edit_manager_privileges",
              "change_manager_passwords",
            ],
          })
          localStorage.setItem("adminAuth", "true")
          localStorage.setItem(
            "managerAuth",
            JSON.stringify({
              id: "admin",
              name: ADMIN_NAME,
              role: "Admin",
              permissions: [
                "manage_employees",
                "issue_rewards",
                "redeem_rewards",
                "manage_managers",
                "add_delete_managers",
                "edit_manager_privileges",
                "change_manager_passwords",
              ],
            }),
          )
          resetInactivityTimer()
          return true
        }

        // Check if manager exists (not deleted)
        const managerExists = await checkManagerExists(managerId)
        if (!managerExists) {
          console.log("Login attempt with deleted manager ID:", managerId)
          return false
        }

        const response = await fetch("/api/auth/login-by-id", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ managerId, password }),
        })

        if (!response.ok) {
          return false
        }

        const data = await response.json()

        if (data.success) {
          // Get permissions from response or use role-based defaults if empty
          let effectivePermissions = data.manager.permissions || []
          if (effectivePermissions.length === 0) {
            effectivePermissions = ROLE_PERMISSIONS[data.manager.role] || []
          }

          const manager: ManagerInfo = {
            id: data.manager.id,
            name: data.manager.name,
            role: data.manager.role,
            permissions: effectivePermissions,
          }

          setManagerInfo(manager)
          setIsLoggedIn(true)
          localStorage.setItem("managerAuth", JSON.stringify(manager))
          resetInactivityTimer()
          return true
        }

        return false
      } catch (error) {
        console.error("Login error:", error)
        return false
      }
    },
    [resetInactivityTimer],
  )

  const adminLogin = useCallback(
    (password: string) => {
      if (password === ADMIN_PASSWORD) {
        setIsAdmin(true)
        setIsLoggedIn(true)
        setManagerInfo({
          id: "admin",
          name: ADMIN_NAME,
          role: "Admin",
          permissions: [
            "manage_employees",
            "issue_rewards",
            "redeem_rewards",
            "manage_managers",
            "add_delete_managers",
            "edit_manager_privileges",
            "change_manager_passwords",
          ],
        })
        localStorage.setItem("adminAuth", "true")
        localStorage.setItem(
          "managerAuth",
          JSON.stringify({
            id: "admin",
            name: ADMIN_NAME,
            role: "Admin",
            permissions: [
              "manage_employees",
              "issue_rewards",
              "redeem_rewards",
              "manage_managers",
              "add_delete_managers",
              "edit_manager_privileges",
              "change_manager_passwords",
            ],
          }),
        )
        resetInactivityTimer()
        return true
      }
      return false
    },
    [resetInactivityTimer],
  )

  const logout = useCallback(() => {
    setIsAdmin(false)
    setIsLoggedIn(false)
    setManagerInfo(null)
    localStorage.removeItem("adminAuth")
    localStorage.removeItem("managerAuth")

    // Clear inactivity timer
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current)
      inactivityTimerRef.current = null
    }
  }, [])

  const hasPermission = useCallback(
    (permission: Permission) => {
      if (isAdmin) return true
      if (!managerInfo) return false

      // Special case for the old permissions that are now consolidated
      if (
        (permission === "add_delete_managers" ||
          permission === "edit_manager_privileges" ||
          permission === "change_manager_passwords") &&
        managerInfo.permissions.includes("manage_managers")
      ) {
        return true
      }

      return managerInfo.permissions.includes(permission)
    },
    [isAdmin, managerInfo],
  )

  const updatePassword = useCallback(async (managerId: string, newPassword: string) => {
    try {
      const response = await fetch("/api/managers/update-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ managerId, password: newPassword }),
      })

      if (!response.ok) {
        return false
      }

      const data = await response.json()
      return data.success
    } catch (error) {
      console.error("Update password error:", error)
      return false
    }
  }, [])

  // Only render children after we've checked localStorage
  if (!isInitialized) {
    return null
  }

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn,
        isAdmin,
        managerInfo,
        login,
        loginWithPassword,
        adminLogin,
        logout,
        hasPermission,
        updatePassword,
        resetInactivityTimer,
        remainingTime,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
