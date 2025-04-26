"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { ModeToggle } from "./mode-toggle"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Menu, X, LogOut, User, Settings, Clock } from "lucide-react"
import { translations } from "@/lib/translations"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function Navbar() {
  const { isLoggedIn, isAdmin, managerInfo, logout, hasPermission, remainingTime, resetInactivityTimer } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  // Format remaining time
  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const closeMenu = () => {
    setIsMenuOpen(false)
  }

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  const isActive = (path: string) => {
    return pathname === path
  }

  // Don't show navbar on login page
  if (pathname === "/") {
    return null
  }

  return (
    <header className="border-b dark:border-gray-700 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/dashboard" className="font-bold text-xl dark:text-white" onClick={closeMenu}>
          Jutalom Kezelő
        </Link>

        {/* Mobile menu button */}
        <div className="md:hidden flex items-center">
          <ModeToggle />
          <Button variant="ghost" size="icon" onClick={toggleMenu} className="ml-2 dark:text-white">
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>

        {/* Desktop navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link
            href="/dashboard"
            className={`text-sm font-medium hover:underline dark:text-gray-200 ${isActive("/dashboard") ? "text-primary dark:text-white" : ""}`}
          >
            {translations.dashboard}
          </Link>

          {hasPermission("manage_employees") && (
            <Link
              href="/employees"
              className={`text-sm font-medium hover:underline dark:text-gray-200 ${isActive("/employees") ? "text-primary dark:text-white" : ""}`}
            >
              {translations.employees}
            </Link>
          )}

          {hasPermission("issue_rewards") && (
            <Link
              href="/rewards"
              className={`text-sm font-medium hover:underline dark:text-gray-200 ${isActive("/rewards") ? "text-primary dark:text-white" : ""}`}
            >
              {translations.activeRewards}
            </Link>
          )}

          <Link
            href="/qr-scanner"
            className={`text-sm font-medium hover:underline dark:text-gray-200 ${isActive("/qr-scanner") ? "text-primary dark:text-white" : ""}`}
          >
            {translations.qrScanner}
          </Link>

          {isAdmin && (
            <Link
              href="/managers"
              className={`text-sm font-medium hover:underline dark:text-gray-200 ${isActive("/managers") ? "text-primary dark:text-white" : ""}`}
            >
              {translations.managers}
            </Link>
          )}

          <Link
            href="/redeemed-rewards"
            className={`text-sm font-medium hover:underline dark:text-gray-200 ${isActive("/redeemed-rewards") ? "text-primary dark:text-white" : ""}`}
          >
            Beváltott jutalmak
          </Link>

          <ModeToggle />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="ml-2 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                onClick={resetInactivityTimer}
              >
                <User className="h-4 w-4 mr-2" />
                {managerInfo?.name || (isAdmin ? "Admin" : "Felhasználó")}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="dark:bg-gray-800 dark:border-gray-700">
              <DropdownMenuLabel className="dark:text-gray-200">
                {managerInfo ? `${managerInfo.name} (${managerInfo.role})` : "Admin"}
              </DropdownMenuLabel>
              <div className="px-2 py-1.5 text-xs flex items-center text-muted-foreground dark:text-gray-400">
                <Clock className="h-3 w-3 mr-1" />
                Automatikus kijelentkezés: {formatTime(remainingTime)}
              </div>
              <DropdownMenuSeparator className="dark:bg-gray-700" />
              <DropdownMenuItem
                onClick={() => router.push("/profile")}
                className="dark:text-gray-200 dark:focus:bg-gray-700"
              >
                <Settings className="h-4 w-4 mr-2" />
                Profil
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout} className="dark:text-gray-200 dark:focus:bg-gray-700">
                <LogOut className="h-4 w-4 mr-2" />
                Kijelentkezés
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t dark:border-gray-700 dark:bg-gray-900">
          <div className="container mx-auto px-4 py-3 flex flex-col space-y-3">
            <div className="px-2 py-1.5 text-xs flex items-center text-muted-foreground dark:text-gray-400">
              <Clock className="h-3 w-3 mr-1" />
              Automatikus kijelentkezés: {formatTime(remainingTime)}
            </div>

            <Link
              href="/dashboard"
              className={`text-sm font-medium py-2 dark:text-gray-200 ${isActive("/dashboard") ? "text-primary dark:text-white" : ""}`}
              onClick={closeMenu}
            >
              {translations.dashboard}
            </Link>

            {hasPermission("manage_employees") && (
              <Link
                href="/employees"
                className={`text-sm font-medium py-2 dark:text-gray-200 ${isActive("/employees") ? "text-primary dark:text-white" : ""}`}
                onClick={closeMenu}
              >
                {translations.employees}
              </Link>
            )}

            {hasPermission("issue_rewards") && (
              <Link
                href="/rewards"
                className={`text-sm font-medium py-2 dark:text-gray-200 ${isActive("/rewards") ? "text-primary dark:text-white" : ""}`}
                onClick={closeMenu}
              >
                {translations.activeRewards}
              </Link>
            )}

            <Link
              href="/qr-scanner"
              className={`text-sm font-medium py-2 dark:text-gray-200 ${isActive("/qr-scanner") ? "text-primary dark:text-white" : ""}`}
              onClick={closeMenu}
            >
              {translations.qrScanner}
            </Link>

            {isAdmin && (
              <Link
                href="/managers"
                className={`text-sm font-medium py-2 dark:text-gray-200 ${isActive("/managers") ? "text-primary dark:text-white" : ""}`}
                onClick={closeMenu}
              >
                {translations.managers}
              </Link>
            )}

            <Link
              href="/redeemed-rewards"
              className={`text-sm font-medium py-2 dark:text-gray-200 ${isActive("/redeemed-rewards") ? "text-primary dark:text-white" : ""}`}
              onClick={closeMenu}
            >
              Beváltott jutalmak
            </Link>

            <Link
              href="/profile"
              className={`text-sm font-medium py-2 dark:text-gray-200 ${isActive("/profile") ? "text-primary dark:text-white" : ""}`}
              onClick={closeMenu}
            >
              <Settings className="h-4 w-4 mr-2" />
              Profil
            </Link>

            <Button
              variant="outline"
              className="justify-start dark:bg-gray-700 dark:text-white dark:border-gray-600"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Kijelentkezés
            </Button>
          </div>
        </div>
      )}
    </header>
  )
}
