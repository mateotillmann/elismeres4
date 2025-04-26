import type React from "react"
import ClientLayout from "@/app/client-layout"

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <ClientLayout>{children}</ClientLayout>
}
