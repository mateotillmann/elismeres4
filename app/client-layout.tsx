"use client"

import type React from "react"

import { AuthProvider } from "@/lib/auth-context"
import Navbar from "@/components/navbar"

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto py-6 px-4">{children}</main>
        <footer className="border-t py-4">
          <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Alkalmazotti Jutalom Kezelő
          </div>
        </footer>
      </div>
    </AuthProvider>
  )
}
