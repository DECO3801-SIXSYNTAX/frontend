"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { Button } from "../../components/ui/button"
import { Card, CardContent } from "../../components/ui/card"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "../../components/ui/sheet"
import { Input } from "../../components/ui/input"
import { Upload, HelpCircle, AlertCircle } from "lucide-react"

export function QrScan() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const eventId = searchParams.get("eventId")
  const videoRef = useRef<HTMLVideoElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [manualToken, setManualToken] = useState("")

  useEffect(() => {
    if (!eventId) {
      navigate("/kiosk")
      return
    }

    startCamera()

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop())
      }
    }
  }, [eventId, navigate, stream])

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      })
      setStream(mediaStream)
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
      setCameraError(null)
    } catch (error) {
      console.error("Camera access denied:", error)
      setCameraError("Camera access denied or not available")
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // In a real implementation, you would decode the QR code from the image
      // For demo purposes, we'll simulate a successful scan
      simulateQrScan("demo-token-from-upload")
    }
  }

  const simulateQrScan = (token: string) => {
    // Simulate QR code detection
    navigate(`/kiosk/verify?eventId=${eventId}&token=${token}`)
  }

  const handleManualSubmit = () => {
    if (manualToken.trim()) {
      simulateQrScan(manualToken.trim())
    }
  }

  // Demo buttons for testing different scenarios
  const handleDemoScan = (scenario: "valid" | "invalid" | "expired") => {
    simulateQrScan(scenario)
  }

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Header */}
      <div className="bg-white p-4 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Scan your QR code</h1>
        <p className="text-gray-600">Position the QR code within the frame</p>
      </div>

      {/* Camera View */}
      <div className="flex-1 relative">
        {cameraError ? (
          <div className="flex-1 flex items-center justify-center bg-gray-900">
            <Card className="w-full max-w-md mx-4">
              <CardContent className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <p className="text-lg font-semibold mb-2">Camera Not Available</p>
                <p className="text-gray-600 mb-6">{cameraError}</p>

                <div className="space-y-4">
                  <div>
                    <label htmlFor="qr-upload" className="cursor-pointer">
                      <Button asChild size="lg" className="w-full h-14">
                        <span>
                          <Upload className="mr-2 h-5 w-5" />
                          Upload QR Image
                        </span>
                      </Button>
                    </label>
                    <Input id="qr-upload" type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                  </div>

                  <div className="space-y-2">
                    <Input
                      placeholder="Or enter QR code manually"
                      value={manualToken}
                      onChange={(e) => setManualToken(e.target.value)}
                      className="text-center"
                      onKeyPress={(e) => e.key === "Enter" && handleManualSubmit()}
                    />
                    <Button
                      onClick={handleManualSubmit}
                      variant="outline"
                      size="lg"
                      className="w-full bg-transparent"
                      disabled={!manualToken.trim()}
                    >
                      Submit Code
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <>
            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />

            {/* Scan Frame Overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative">
                <div className="w-64 h-64 border-4 border-white rounded-lg relative">
                  {/* Corner indicators */}
                  <div className="absolute -top-2 -left-2 w-8 h-8 border-l-4 border-t-4 border-blue-500 rounded-tl-lg"></div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 border-r-4 border-t-4 border-blue-500 rounded-tr-lg"></div>
                  <div className="absolute -bottom-2 -left-2 w-8 h-8 border-l-4 border-b-4 border-blue-500 rounded-bl-lg"></div>
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 border-r-4 border-b-4 border-blue-500 rounded-br-lg"></div>

                  {/* Scanning line animation */}
                  <div className="absolute inset-0 overflow-hidden rounded-lg">
                    <div className="w-full h-1 bg-blue-500 animate-pulse absolute top-1/2 transform -translate-y-1/2"></div>
                  </div>
                </div>
                <p className="text-white text-center mt-4 text-lg font-medium">Align QR code within the frame</p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Bottom Controls */}
      <div className="bg-white p-4 space-y-4">
        {/* Demo buttons for testing */}
        <div className="grid grid-cols-3 gap-2">
          <Button onClick={() => handleDemoScan("valid")} variant="outline" size="sm" className="text-xs">
            Demo: Valid
          </Button>
          <Button onClick={() => handleDemoScan("invalid")} variant="outline" size="sm" className="text-xs">
            Demo: Invalid
          </Button>
          <Button onClick={() => handleDemoScan("expired")} variant="outline" size="sm" className="text-xs">
            Demo: Expired
          </Button>
        </div>

        <div className="flex gap-4">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="lg" className="flex-1 h-14 bg-transparent">
                <HelpCircle className="mr-2 h-5 w-5" />
                Need Help?
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[300px]">
              <SheetHeader>
                <SheetTitle>QR Code Help</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-900 mb-2">Can't find your QR code?</h3>
                  <p className="text-blue-800">Check your email invitation or contact event staff.</p>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-yellow-900 mb-2">QR code not scanning?</h3>
                  <p className="text-yellow-800">Make sure the code is well-lit and not damaged.</p>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          <Button onClick={() => navigate(`/kiosk?eventId=${eventId}`)} variant="secondary" size="lg" className="h-14">
            Back
          </Button>
        </div>

        <p className="text-center text-sm text-gray-500">Your data is only used to verify your invitation</p>
      </div>
    </div>
  )
}
