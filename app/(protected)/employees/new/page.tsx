"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import NewEmployeeForm from "@/components/new-employee-form"
import { useAuth } from "@/lib/auth-context"

export default function NewEmployeePage() {
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

  return <NewEmployeeForm />
}
