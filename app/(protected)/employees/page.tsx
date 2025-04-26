"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import EmployeesList from "@/components/employees-list"
import { useAuth } from "@/lib/auth-context"

export default function EmployeesPage() {
  const router = useRouter()
  const { isLoggedIn } = useAuth()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && !isLoggedIn) {
      router.push("/")
    }
  }, [isLoggedIn, router, mounted])

  if (!mounted) {
    return null
  }

  return <EmployeesList />
}
