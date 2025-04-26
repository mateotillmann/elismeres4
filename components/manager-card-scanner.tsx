"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { translations } from "@/lib/translations"
import { Html5Qrcode } from "html5-qrcode"
import type { Permission } from "@/lib/types"

export default function ManagerCardScanner({
  onScan,
  requiredRole,
}: {
  onScan: (managerId: string, managerName: string, managerRole: string, permissions?: Permission[]) => void
  requiredRole?: "Tréner" | "Koordinátor" | "Műszakvezető"
}) {
  const [scannerError, setScannerError] = useState<string | null>(null)
  const [isMounted, setIsMounted] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const scannerElementId = "manager-reader"

  // Safely stop the scanner - more aggressive approach
  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        console.log("Stopping manager card scanner")
        // Force stop the scanner regardless of isScanning state
        await scannerRef.current.stop()
        // Clear the scanner reference
        scannerRef.current = null
        setIsScanning(false)
      } catch (error) {
        console.error("Error stopping scanner:", error)
        // Even if there's an error, clear the reference
        scannerRef.current = null
        setIsScanning(false)
      }
    }
  }

  // Initialize component
  useEffect(() => {
    setIsMounted(true)

    // Cleanup function
    return () => {
      console.log("Manager scanner component unmounting - stopping camera")
      setIsMounted(false)
      stopScanner()
    }
  }, [])

  // Initialize scanner when component mounts
  useEffect(() => {
    if (isMounted) {
      // Make sure the scanner element exists before initializing
      const scannerElement = document.getElementById(scannerElementId)
      if (scannerElement) {
        initializeScanner()
      } else {
        console.error("Scanner element not found")
      }
    }

    // Cleanup function
    return () => {
      console.log("Scanner effect cleanup - stopping camera")
      stopScanner()
    }
  }, [isMounted])

  // Add visibility change listener to stop camera when tab/window is not visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log("Document hidden - stopping camera")
        stopScanner()
      } else if (!document.hidden && !isScanning && isMounted) {
        console.log("Document visible - restarting camera")
        initializeScanner()
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [isScanning, isMounted])

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

  const initializeScanner = async () => {
    if (!isMounted) return

    try {
      // Check if the element exists
      const readerElement = document.getElementById(scannerElementId)
      if (!readerElement) {
        console.error("Scanner element not found")
        return
      }

      // Stop any existing scanner instance
      await stopScanner()

      // Create scanner instance
      scannerRef.current = new Html5Qrcode(scannerElementId)
      setIsScanning(true)

      const qrCodeSuccessCallback = async (decodedText: string) => {
        try {
          // Stop scanner immediately after successful scan
          console.log("QR code scanned - stopping camera")
          await stopScanner()

          console.log("QR kód beolvasva:", decodedText)

          // Try to parse as JSON first (for backward compatibility)
          try {
            const parsedData = JSON.parse(decodedText)
            console.log("Feldolgozott QR adat:", parsedData)

            if (parsedData.type === "manager" && parsedData.id) {
              // Check if manager exists (not deleted)
              const managerExists = await checkManagerExists(parsedData.id)
              if (!managerExists && parsedData.id !== "admin") {
                toast({
                  title: translations.error,
                  description: "Ez a vezetői kártya már nem érvényes",
                  variant: "destructive",
                })
                return
              }

              // Check if role is required - but don't check the role of the scanner, only the scanned card
              if (requiredRole && parsedData.role !== requiredRole) {
                toast({
                  title: translations.error,
                  description: `Csak ${requiredRole} hagyhatja jóvá ezt a műveletet`,
                  variant: "destructive",
                })
                return
              }

              // Make sure permissions are properly extracted and passed
              const permissions = Array.isArray(parsedData.permissions) ? parsedData.permissions : []
              console.log("QR beolvasás sikeres, jogosultságok:", permissions)

              // Include role, name, and permissions information
              onScan(parsedData.id, parsedData.name, parsedData.role, permissions)
              return
            }
          } catch (e) {
            // Not JSON, assume it's just the manager ID
            console.log("Egyszerű ID formátum:", decodedText)

            // Fetch manager details from the server
            try {
              const response = await fetch(`/api/managers/${decodedText}`)

              if (!response.ok) {
                throw new Error("Érvénytelen vezetői kártya")
              }

              const manager = await response.json()

              // Check if role is required
              if (requiredRole && manager.role !== requiredRole) {
                toast({
                  title: translations.error,
                  description: `Csak ${requiredRole} hagyhatja jóvá ezt a műveletet`,
                  variant: "destructive",
                })
                return
              }

              onScan(manager.id, manager.name, manager.role, manager.permissions || [])
              return
            } catch (fetchError) {
              console.error("Hiba a vezető adatainak lekérésekor:", fetchError)
              toast({
                title: translations.error,
                description: "Érvénytelen vezetői kártya",
                variant: "destructive",
              })
              return
            }
          }

          toast({
            title: translations.error,
            description: "Érvénytelen vezetői kártya",
            variant: "destructive",
          })
        } catch (error) {
          console.error("Hiba a QR kód feldolgozásakor:", error)
          toast({
            title: translations.error,
            description: "Érvénytelen QR kód",
            variant: "destructive",
          })
        }
      }

      const config = { fps: 10, qrbox: { width: 250, height: 250 } }

      scannerRef.current
        .start({ facingMode: "environment" }, config, qrCodeSuccessCallback, (errorMessage) => {
          // This is just for errors during scanning, not for permission errors
          console.log(errorMessage)
        })
        .catch((err) => {
          console.error("Scanner start error:", err)
          setScannerError(translations.cameraPermissionDenied)
          toast({
            title: translations.scannerError,
            description: translations.cameraPermissionDenied,
            variant: "destructive",
          })
          // Make sure to clear the scanner reference on error
          scannerRef.current = null
          setIsScanning(false)
        })
    } catch (error) {
      console.error("Scanner initialization error:", error)
      setScannerError("Camera initialization failed")
      // Make sure to clear the scanner reference on error
      scannerRef.current = null
      setIsScanning(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{translations.scanManagerCard}</CardTitle>
        <CardDescription>Olvassa be a vezetői kártyát a jóváhagyáshoz</CardDescription>
      </CardHeader>
      <CardContent>
        {scannerError ? (
          <div className="text-center p-6 border rounded-lg">
            <p className="text-red-500 mb-2">{scannerError}</p>
            <p className="text-sm text-muted-foreground">Kamera hozzáférés szükséges a beolvasáshoz</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg">
            <div id={scannerElementId} className="w-full" style={{ minHeight: "300px" }}></div>
            <div className="mt-4 text-center text-sm text-muted-foreground">{translations.positionQrCode}</div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
