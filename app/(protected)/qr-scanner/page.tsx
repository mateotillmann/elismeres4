"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/components/ui/use-toast"
import ManualCardEntry from "@/components/manual-card-entry"
import { translations } from "@/lib/translations"
import { Html5Qrcode } from "html5-qrcode"

export default function QRScannerPage() {
  const router = useRouter()
  const [isMounted, setIsMounted] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const [scannerError, setScannerError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("scan")
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const scannerElementId = "reader"

  // Safely stop the scanner - more aggressive approach
  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        console.log("Stopping QR scanner")
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
      console.log("QR scanner component unmounting - stopping camera")
      setIsMounted(false)
      stopScanner()
    }
  }, [])

  // Start scanner when tab changes to "scan"
  useEffect(() => {
    if (isMounted && activeTab === "scan") {
      // Make sure the scanner element exists before initializing
      const scannerElement = document.getElementById(scannerElementId)
      if (scannerElement) {
        initializeScanner()
      } else {
        console.error("Scanner element not found")
      }
    } else if (activeTab !== "scan") {
      // Stop scanner when switching away from scan tab
      console.log("Tab changed away from scan - stopping camera")
      stopScanner()
    }

    // Cleanup function
    return () => {
      if (activeTab === "scan") {
        console.log("Scanner tab effect cleanup - stopping camera")
        stopScanner()
      }
    }
  }, [isMounted, activeTab])

  // Add visibility change listener to stop camera when tab/window is not visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log("Document hidden - stopping camera")
        stopScanner()
      } else if (!document.hidden && activeTab === "scan" && !isScanning && isMounted) {
        console.log("Document visible - restarting camera")
        initializeScanner()
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [isScanning, activeTab, isMounted])

  // Add router change start listener to stop camera when navigating away
  useEffect(() => {
    const handleRouteChangeStart = () => {
      console.log("Route change detected - stopping camera")
      stopScanner()
    }

    // Add event listener for route changes
    window.addEventListener("beforeunload", handleRouteChangeStart)

    return () => {
      window.removeEventListener("beforeunload", handleRouteChangeStart)
    }
  }, [])

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

          console.log("QR code scanned:", decodedText)

          // Try to parse as JSON first
          try {
            const data = JSON.parse(decodedText)
            console.log("Parsed QR data:", data)

            if (data.id) {
              // Navigate to the reward card page
              router.push(`/rewards/${data.id}`)
              return
            }
          } catch (e) {
            // Not JSON, treat as direct card ID
            console.log("Not JSON, treating as direct card ID:", decodedText)
          }

          // If we get here, either parsing failed or the JSON didn't have an id
          // Try to use the raw text as a card ID
          const cleanId = decodedText.trim()
          console.log("Using raw text as card ID:", cleanId)
          router.push(`/rewards/${cleanId}`)
        } catch (error) {
          console.error("Error processing QR code:", error)
          toast({
            title: translations.error,
            description: translations.invalidQrCode,
            variant: "destructive",
          })

          // Restart scanner after error
          initializeScanner()
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

  const handleTabChange = (value: string) => {
    if (activeTab === "scan" && value !== "scan") {
      // Stop scanner when switching away from scan tab
      console.log("Tab changed via UI - stopping camera")
      stopScanner()
    }
    setActiveTab(value)
  }

  return (
    <div className="max-w-md mx-auto space-y-6">
      <h1 className="text-3xl font-bold">{translations.qrScanner}</h1>

      <Card>
        <CardHeader>
          <CardTitle>{translations.findRewardCard}</CardTitle>
          <CardDescription>{translations.scanQrCodeOrEnterManually}</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="scan" value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="scan">{translations.scanQrCode}</TabsTrigger>
              <TabsTrigger value="manual">{translations.manualEntry}</TabsTrigger>
            </TabsList>
            <TabsContent value="scan" className="mt-4">
              {scannerError ? (
                <div className="text-center p-6 border rounded-lg">
                  <p className="text-red-500 mb-2">{scannerError}</p>
                  <p className="text-sm text-muted-foreground">{translations.useCameraPermission}</p>
                </div>
              ) : (
                <div className="overflow-hidden rounded-lg">
                  <div id={scannerElementId} className="w-full" style={{ minHeight: "300px" }}></div>
                  <div className="mt-4 text-center text-sm text-muted-foreground">{translations.positionQrCode}</div>
                </div>
              )}
            </TabsContent>
            <TabsContent value="manual" className="mt-4">
              <ManualCardEntry />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
