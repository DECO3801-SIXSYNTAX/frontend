"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "../../components/ui/button"
import { Card, CardContent } from "../../components/ui/card"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "../../components/ui/sheet"
import { Upload, HelpCircle, AlertCircle } from "lucide-react"

export function QrScan() {
  const navigate = useNavigate()
  const videoRef = useRef<HTMLVideoElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [manualToken, setManualToken] = useState("")
  const [isStartingCamera, setIsStartingCamera] = useState(false)

  useEffect(() => {
    startCamera()

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop())
      }
      // Clean up video element
      if (videoRef.current) {
        videoRef.current.srcObject = null
      }
    }
  }, [])

  // Separate effect to handle video when stream changes
  useEffect(() => {
    if (stream && videoRef.current) {
      console.log("Stream changed, updating video...")
      videoRef.current.srcObject = stream
      
      // Force play after a short delay
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.play().catch((error) => {
            console.error("Force play error:", error)
          })
        }
      }, 200)
    }
  }, [stream])

  const startCamera = async () => {
    if (isStartingCamera) return // Prevent multiple simultaneous starts
    
    setIsStartingCamera(true)
    console.log("Starting camera...")
    
    try {
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera API not supported")
      }

      // Check if we're on HTTPS or localhost
      const isSecureContext = window.isSecureContext || window.location.hostname === 'localhost'
      if (!isSecureContext) {
        throw new Error("Camera requires HTTPS or localhost")
      }

      console.log("Requesting camera access...")
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
      })
      
      console.log("Camera stream obtained:", mediaStream)
      setStream(mediaStream)
      
      if (videoRef.current) {
        console.log("Setting video source...")
        videoRef.current.srcObject = mediaStream
        
        // Set video properties
        videoRef.current.muted = true
        videoRef.current.playsInline = true
        videoRef.current.autoplay = true
        
        // Wait for video to be ready before playing
        videoRef.current.onloadedmetadata = () => {
          console.log("Video metadata loaded, attempting to play...")
          videoRef.current?.play().catch((error) => {
            // Ignore AbortError - it's common when video is interrupted
            if (error.name !== 'AbortError') {
              console.error('Video play error:', error)
            } else {
              console.log("Video play aborted (normal)")
            }
          })
        }
        
        // Handle when video starts playing
        videoRef.current.onplaying = () => {
          console.log("Video is now playing!")
        }
        
        // Handle video errors
        videoRef.current.onerror = (error) => {
          console.error("Video error:", error)
        }
        
        // Try to play immediately
        setTimeout(() => {
          videoRef.current?.play().catch((error) => {
            if (error.name !== 'AbortError') {
              console.error('Immediate video play error:', error)
            }
          })
        }, 100)
      }
      setCameraError(null)
      console.log("Camera started successfully")
    } catch (error: any) {
      console.error("Camera access error:", error)
      
      let errorMessage = "Camera access denied or not available"
      
      if (error.name === 'NotAllowedError') {
        errorMessage = "Camera permission denied. Please allow camera access and refresh the page."
      } else if (error.name === 'NotFoundError') {
        errorMessage = "No camera found on this device."
      } else if (error.name === 'NotSupportedError') {
        errorMessage = "Camera not supported on this device."
      } else if (error.message.includes('HTTPS')) {
        errorMessage = "Camera requires HTTPS connection. Please use https:// or localhost."
      }
      
      setCameraError(errorMessage)
    } finally {
      setIsStartingCamera(false)
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
    // Simulate QR code detection and redirect to guest info
    navigate(`/kiosk/verify?token=${token}`)
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
                  <Button
                    onClick={startCamera}
                    size="lg"
                    className="w-full h-14 bg-blue-600 hover:bg-blue-700"
                    disabled={isStartingCamera}
                  >
                    {isStartingCamera ? "Starting Camera..." : "Retry Camera Access"}
                  </Button>

                  <div>
                    <label htmlFor="qr-upload" className="cursor-pointer">
                      <Button asChild size="lg" className="w-full h-14">
                        <span>
                          <Upload className="mr-2 h-5 w-5" />
                          Upload QR Image
                        </span>
                      </Button>
                    </label>
                    <input id="qr-upload" type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                  </div>

                  <div className="space-y-2">
                    <input
                      placeholder="Or enter QR code manually"
                      value={manualToken}
                      onChange={(e) => setManualToken(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-center"
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
            {/* Video Background */}
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted
              className="w-full h-full object-cover bg-black" 
              style={{ 
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                zIndex: 1,
                backgroundColor: '#000000'
              }}
              onLoadStart={() => console.log("Video load started")}
              onCanPlay={() => console.log("Video can play")}
              onPlay={() => console.log("Video playing")}
              onPause={() => console.log("Video paused")}
              onError={(e) => console.error("Video element error:", e)}
            />
            
            {/* Fallback background if video doesn't load */}
            {!stream && (
              <div 
                className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center"
                style={{ 
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  zIndex: 1
                }}
              >
                <div className="text-center text-white">
                  <div className="w-16 h-16 border-4 border-white border-dashed rounded-lg mx-auto mb-4 flex items-center justify-center">
                    <div className="w-8 h-8 bg-white rounded"></div>
                  </div>
                  <p className="text-lg font-medium">Camera Loading...</p>
                  <p className="text-sm text-gray-300 mt-2">Please allow camera access</p>
                </div>
              </div>
            )}

            {/* Scan Frame Overlay */}
            <div 
              className="absolute inset-0 flex items-center justify-center"
              style={{ zIndex: 2 }}
            >
              <div className="relative">
                <div className="w-64 h-64 border-4 border-white rounded-lg relative bg-transparent">
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
                <p className="text-white text-center mt-4 text-lg font-medium drop-shadow-lg">Align QR code within the frame</p>
              </div>
            </div>

            {/* Debug info */}
            <div 
              className="absolute top-4 left-4 bg-black bg-opacity-50 text-white p-2 rounded text-xs"
              style={{ zIndex: 3 }}
            >
              <div>Camera Status: {stream ? 'Active' : 'Inactive'}</div>
              <div>Video Ready: {videoRef.current?.readyState || 'Unknown'}</div>
              <div>Video Playing: {videoRef.current?.paused === false ? 'Yes' : 'No'}</div>
              <div>Video Error: {videoRef.current?.error ? 'Yes' : 'No'}</div>
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

          <Button onClick={() => navigate(`/kiosk`)} variant="outline" size="lg" className="h-14">
            Back
          </Button>
        </div>

        <p className="text-center text-sm text-gray-500">Your data is only used to verify your invitation</p>
      </div>
    </div>
  )
}
