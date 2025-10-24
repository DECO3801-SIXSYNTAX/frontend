import { useState, useRef, useEffect } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import Button from "../../components/ui/Button"
import { Card, CardContent } from "../../components/ui/card"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "../../components/ui/sheet"
import { Upload, HelpCircle, AlertCircle, Play, Square, Camera } from "lucide-react"
import jsQR from "jsqr"

export function QrScan() {
  console.log("QrScan component loaded")

  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const eventId = searchParams.get("eventId") || "default-event"
  const fromVerify = searchParams.get("fromVerify") === "true"

  // Inject animation CSS for the scan line
  useEffect(() => {
    const style = document.createElement("style")
    style.textContent = `
      @keyframes scanLine {
        0% { transform: translateY(-50%) translateX(-100%); opacity: 0; }
        20% { opacity: 1; }
        80% { opacity: 1; }
        100% { transform: translateY(-50%) translateX(100%); opacity: 0; }
      }
    `
    document.head.appendChild(style)
    return () => { if (document.head.contains(style)) document.head.removeChild(style) }
  }, [])

  // DOM refs
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Scan loop refs (avoid stale state)
  const rafRef = useRef<number | null>(null)
  const scanningRef = useRef(false) // drives the loop synchronously
  const lastTextRef = useRef<string>("")
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null)

  // Misc refs
  const hasRestartedRef = useRef(false)

  // UI state
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [manualToken, setManualToken] = useState("")
  const [isStartingCamera, setIsStartingCamera] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const [isManualScanning, setIsManualScanning] = useState(false)
  const [detectedQR, setDetectedQR] = useState<{
    data: string
    location: {
      topLeftCorner: { x: number; y: number }
      topRightCorner: { x: number; y: number }
      bottomLeftCorner: { x: number; y: number }
      bottomRightCorner: { x: number; y: number }
    }
  } | null>(null)
  const [invalidQR, setInvalidQR] = useState<{
    data: string
    location: {
      topLeftCorner: { x: number; y: number }
      topRightCorner: { x: number; y: number }
      bottomLeftCorner: { x: number; y: number }
      bottomRightCorner: { x: number; y: number }
    }
  } | null>(null)

  // Initial mount: clean up any old stream and start camera
  useEffect(() => {
    hasRestartedRef.current = false

    // ensure clean state
    scanningRef.current = false
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    if (stream) {
      stream.getTracks().forEach(t => t.stop())
      setStream(null)
    }
    setIsScanning(false)
    setIsManualScanning(false)
    setDetectedQR(null)
    setCameraError(null)

    startCamera()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Stop tracks if stream changes/unmounts
  useEffect(() => {
    return () => {
      scanningRef.current = false
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      if (stream) stream.getTracks().forEach(track => track.stop())
    }
  }, [stream])

  // Coming back from /verify — force a full camera restart once
  useEffect(() => {
    if (fromVerify && !hasRestartedRef.current) {
      console.log("User returned from verify page, restarting camera…")
      hasRestartedRef.current = true

      scanningRef.current = false
      if (rafRef.current) cancelAnimationFrame(rafRef.current)

      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => {
          console.log("Stopping track:", track.kind)
          track.stop()
        })
      }
      if (videoRef.current) videoRef.current.srcObject = null

      setIsScanning(false)
      setIsManualScanning(false)
      setDetectedQR(null)
      setCameraError(null)
      setStream(null)

      setTimeout(() => {
        console.log("Starting fresh camera after cleanup…")
        startCamera()
      }, 400)
    }
  }, [fromVerify])

  const startCamera = async () => {
    console.log("=== startCamera called ===")
    try {
      setIsStartingCamera(true)
      setCameraError(null)

      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Camera not supported on this device")
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      })

      console.log("Camera stream obtained:", mediaStream)
      setStream(mediaStream)

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream

        videoRef.current.onloadedmetadata = () => {
          console.log("Video metadata loaded → attempting play()")
          videoRef.current?.play().catch(err => console.error("video.play() failed:", err))
        }

        videoRef.current.onplaying = () => {
          console.log("=== Video is playing ===")
          console.log("isManualScanning:", isManualScanning)
          // Start scanning via ref (synchronous), state only drives UI
          scanningRef.current = true
          setIsScanning(true)
          startQRScanning()
        }

        videoRef.current.onerror = e => {
          console.error("Video error:", e)
          setCameraError("Failed to start video stream")
        }
      }
    } catch (error: any) {
      console.error("Camera error:", error)
      let msg = "Failed to access camera"
      if (error?.name === "NotAllowedError") msg = "Camera access denied. Please allow camera access and refresh the page."
      else if (error?.name === "NotFoundError") msg = "No camera found on this device"
      else if (error?.name === "NotSupportedError") msg = "Camera not supported on this device"
      else if (error?.name === "NotReadableError") msg = "Camera is being used by another application"
      setCameraError(msg)
    } finally {
      setIsStartingCamera(false)
    }
  }

  const startQRScanning = () => {
    console.log("startQRScanning called")
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) {
      console.log("Missing video or canvas ref")
      return
    }

    // Create (or reuse) a 2D context optimized for frequent readbacks
    let ctx = ctxRef.current
    if (!ctx) {
      ctx = canvas.getContext("2d", { willReadFrequently: true }) as CanvasRenderingContext2D | null
      if (!ctx) {
        console.log("Canvas context not available")
        return
      }
      ctxRef.current = ctx
    }

    // Size canvas once based on current video dimensions
    const scale = 0.8
    canvas.width = Math.max(1, (video.videoWidth || 640) * scale)
    canvas.height = Math.max(1, (video.videoHeight || 480) * scale)

    const scan = () => {
      if (!scanningRef.current) return

      // Schedule NEXT frame first → loop continues even on empty frames
      rafRef.current = requestAnimationFrame(scan)

      if (video.readyState < video.HAVE_CURRENT_DATA) return

      ctx!.drawImage(video, 0, 0, canvas.width, canvas.height)
      const { data, width, height } = ctx!.getImageData(0, 0, canvas.width, canvas.height)

      try {
        const code = jsQR(data, width, height) // add options if desired
        if (code?.data) {
          // Debounce duplicates from same or consecutive frames
          if (code.data === lastTextRef.current) return
          lastTextRef.current = code.data

          const isValid = isValidQRCode(code.data)
          if (isValid) {
            setDetectedQR({ data: code.data, location: code.location })
            setInvalidQR(null)

            // Stop scanning ONLY on success
            scanningRef.current = false
            setIsScanning(false)
            setIsManualScanning(false)

            // Release camera for the next page (optional but nice)
            try {
              (video.srcObject as MediaStream | null)?.getTracks().forEach(t => t.stop())
            } catch {}

            handleQRDetected(code.data)
          } else {
            setInvalidQR({ data: code.data, location: code.location })
            setDetectedQR(null)
            setTimeout(() => setInvalidQR(null), 1000)
          }
        } else {
          // No code this frame → keep scanning, just clear overlays
          setDetectedQR(null)
          setInvalidQR(null)
        }
      } catch (err) {
        console.error("QR detection error:", err)
        setDetectedQR(null)
      }
    }

    // Kick it off once; subsequent frames are scheduled inside scan()
    scan()
  }

  const isValidQRCode = (qrData: string): boolean => {
    if (!qrData || qrData.length < 10) return false

    // URL with ?token=
    if (qrData.includes("token=")) {
      try {
        const url = new URL(qrData)
        const token = url.searchParams.get("token")
        return !!(token && token.length > 10)
      } catch {
        // Fallback: naive parsing if it's not a fully qualified URL
        const qs = qrData.split("?")[1] || ""
        const token = new URLSearchParams(qs).get("token")
        return !!(token && token.length > 10)
      }
    }

    // Direct token (Fernet-style or similar) — usually long
    if (qrData.length > 20) return true

    // Possibly base64-encoded token
    try {
      const decoded = atob(qrData)
      return decoded.length > 10
    } catch {
      return false
    }
  }

  const handleQRDetected = (qrData: string) => {
  console.log("QR Data received:", qrData)

  // Extract token from QR data (support full URL or raw token)
  let token = qrData
  if (qrData.includes("token=")) {
    try {
      const url = new URL(qrData)
      token = url.searchParams.get("token") || qrData
    } catch {
      const qs = qrData.split("?")[1] || ""
      token = new URLSearchParams(qs).get("token") || qrData
    }
  }

  const scanId = Date.now().toString() // ← unique per scan
  console.log("Extracted token:", token, "scanId:", scanId)

  navigate(
    `/kiosk/verify?eventId=${encodeURIComponent(eventId)}&token=${encodeURIComponent(
      token
    )}&scan=${encodeURIComponent(scanId)}`
  )
}

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = ev => {
      const img = new Image()
      img.onload = () => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = (canvas.getContext("2d", { willReadFrequently: true }) as CanvasRenderingContext2D) || undefined
        if (!ctx) return
        canvas.width = img.width
        canvas.height = img.height
        ctx.drawImage(img, 0, 0)
        try {
          const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height)
          const code = jsQR(data, width, height)
          if (code?.data) handleQRDetected(code.data)
          else alert("No QR code found in the uploaded image")
        } catch (err) {
          console.error("QR detection error:", err)
          alert("Error processing QR code")
        }
      }
      img.src = ev.target?.result as string
    }
    reader.readAsDataURL(file)
  }

  const handleStartScanning = () => {
    console.log("Starting manual scanning")
    scanningRef.current = true // drive the loop
    setIsManualScanning(true)
    setIsScanning(true)        // UI only
    startQRScanning()
  }

  const handleStopScanning = () => {
    console.log("Stopping scanning")
    scanningRef.current = false
    setIsScanning(false)
    setIsManualScanning(false)
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
  }

  const handleManualSubmit = () => {
    if (manualToken.trim()) {
      navigate(`/kiosk/verify?eventId=${encodeURIComponent(eventId)}&token=${encodeURIComponent(manualToken.trim())}`)
    }
  }

  console.log("QrScan render - eventId:", eventId, "stream:", stream)

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
                  <Button onClick={startCamera} size="lg" className="w-full h-14 bg-blue-600 hover:bg-blue-700" disabled={isStartingCamera}>
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
                      onChange={e => setManualToken(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-center"
                      onKeyDown={e => e.key === "Enter" && handleManualSubmit()}
                    />
                    <Button onClick={handleManualSubmit} variant="outline" size="lg" className="w-full bg-transparent" disabled={!manualToken.trim()}>
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
              style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", zIndex: 1, backgroundColor: "#000000" }}
              onLoadStart={() => console.log("Video load started")}
              onCanPlay={() => console.log("Video can play")}
              onPlay={() => console.log("Video playing")}
              onPause={() => console.log("Video paused")}
              onError={e => console.error("Video element error:", e)}
            />

            {/* Hidden canvas for QR detection */}
            <canvas ref={canvasRef} style={{ display: "none" }} />

            {/* Valid QR overlay */}
            {detectedQR && (
              <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 2 }}>
                {(() => {
                  const video = videoRef.current
                  if (!video) return null
                  const videoRect = video.getBoundingClientRect()
                  const scaleX = videoRect.width / video.videoWidth
                  const scaleY = videoRect.height / video.videoHeight
                  const q = detectedQR.location
                  const topLeft = { x: q.topLeftCorner.x * scaleX, y: q.topLeftCorner.y * scaleY }
                  const topRight = { x: q.topRightCorner.x * scaleX, y: q.topRightCorner.y * scaleY }
                  const bottomLeft = { x: q.bottomLeftCorner.x * scaleX, y: q.bottomLeftCorner.y * scaleY }

                  return (
                    <div className="relative w-full h-full">
                      <div
                        className="absolute border-2 border-green-400 bg-green-400/20 rounded-lg animate-pulse"
                        style={{
                          left: topLeft.x,
                          top: topLeft.y,
                          width: Math.abs(topRight.x - topLeft.x),
                          height: Math.abs(bottomLeft.y - topLeft.y),
                          transform: `rotate(${(Math.atan2(topRight.y - topLeft.y, topRight.x - topLeft.x) * 180) / Math.PI}deg)`,
                        }}
                      >
                        <div className="absolute -top-1 -left-1 w-3 h-3 border-l-2 border-t-2 border-green-400 rounded-tl-lg"></div>
                        <div className="absolute -top-1 -right-1 w-3 h-3 border-r-2 border-t-2 border-green-400 rounded-tr-lg"></div>
                        <div className="absolute -bottom-1 -left-1 w-3 h-3 border-l-2 border-b-2 border-green-400 rounded-bl-lg"></div>
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 border-r-2 border-b-2 border-green-400 rounded-br-lg"></div>
                      </div>

                      <div
                        className="absolute bg-black/80 text-white px-3 py-2 rounded-lg text-sm font-mono max-w-xs break-all"
                        style={{ left: topLeft.x, top: topLeft.y - 40, transform: "translateX(-50%)" }}
                      >
                        📱 {detectedQR.data.substring(0, 30)}...
                      </div>
                    </div>
                  )
                })()}
              </div>
            )}

            {/* Invalid QR overlay */}
            {invalidQR && (
              <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 2 }}>
                {(() => {
                  const video = videoRef.current
                  if (!video) return null
                  const videoRect = video.getBoundingClientRect()
                  const scaleX = videoRect.width / video.videoWidth
                  const scaleY = videoRect.height / video.videoHeight
                  const q = invalidQR.location
                  const topLeft = { x: q.topLeftCorner.x * scaleX, y: q.topLeftCorner.y * scaleY }
                  const topRight = { x: q.topRightCorner.x * scaleX, y: q.topRightCorner.y * scaleY }
                  const bottomLeft = { x: q.bottomLeftCorner.x * scaleX, y: q.bottomLeftCorner.y * scaleY }

                  return (
                    <div className="relative w-full h-full">
                      <div
                        className="absolute border-2 border-red-400 bg-red-400/20 rounded-lg animate-pulse"
                        style={{
                          left: topLeft.x,
                          top: topLeft.y,
                          width: Math.abs(topRight.x - topLeft.x),
                          height: Math.abs(bottomLeft.y - topLeft.y),
                          transform: `rotate(${(Math.atan2(topRight.y - topLeft.y, topRight.x - topLeft.x) * 180) / Math.PI}deg)`,
                        }}
                      >
                        <div className="absolute -top-1 -left-1 w-3 h-3 border-l-2 border-t-2 border-red-400 rounded-tl-lg"></div>
                        <div className="absolute -top-1 -right-1 w-3 h-3 border-r-2 border-t-2 border-red-400 rounded-tr-lg"></div>
                        <div className="absolute -bottom-1 -left-1 w-3 h-3 border-l-2 border-b-2 border-red-400 rounded-bl-lg"></div>
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 border-r-2 border-b-2 border-red-400 rounded-br-lg"></div>
                      </div>

                      <div
                        className="absolute bg-red-600/90 text-white px-3 py-2 rounded-lg text-sm font-mono max-w-xs break-all"
                        style={{ left: topLeft.x, top: topLeft.y - 40, transform: "translateX(-50%)" }}
                      >
                        ❌ Invalid QR Code
                      </div>
                    </div>
                  )
                })()}
              </div>
            )}

            {/* Dark overlay + scan window */}
            <div className="absolute inset-0" style={{ zIndex: 1 }}>
              <div
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-transparent border-2 border-white/30 rounded-lg"
                style={{ boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.3)" }}
              />
            </div>

            {!stream && (
              <div
                className="w-full h-full bg-gray-100 flex items-center justify-center"
                style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", zIndex: 1 }}
              >
                <div className="text-center text-gray-600">
                  <div className="w-16 h-16 border-4 border-gray-300 border-dashed rounded-lg mx-auto mb-4 flex items-center justify-center">
                    <div className="w-8 h-8 bg-gray-300 rounded" />
                  </div>
                  <p className="text-lg font-medium">Camera Loading...</p>
                  <p className="text-sm text-gray-500 mt-2">Please allow camera access</p>
                </div>
              </div>
            )}

            {/* Scan line + instructions */}
            <div className="absolute inset-0 flex items-center justify-center" style={{ zIndex: 3 }}>
              <div className="relative">
                <div className="w-72 h-72 relative">
                  <div className="absolute inset-0 border border-white/50 rounded-lg" />
                  {isScanning && (
                    <div className="absolute inset-0 overflow-hidden rounded-lg">
                      <div
                        className="absolute w-full h-px bg-white"
                        style={{ animation: "scanLine 1.5s ease-in-out infinite", top: "50%", transform: "translateY(-50%)" }}
                      />
                    </div>
                  )}
                </div>
                <div className="text-center mt-6">
                  <p className="text-white text-lg font-medium drop-shadow-lg mb-2">
                    {detectedQR ? "✅ QR Code Detected!" : invalidQR ? "❌ Invalid QR Code" : isScanning ? "Scanning..." : "Position QR code within the frame"}
                  </p>
                  <p className="text-white text-sm opacity-80 drop-shadow-lg">
                    {detectedQR ? "Processing..." : invalidQR ? "Please use a valid event QR code" : "Make sure the QR code is clear and well-lit"}
                  </p>
                </div>
              </div>
            </div>

            {/* Status & Controls */}
            <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm text-gray-800 p-3 rounded-lg text-xs border border-gray-200" style={{ zIndex: 4 }}>
              <div className="flex items-center mb-2">
                <Camera className="h-4 w-4 mr-2 text-blue-600" />
                <span className="font-semibold">Camera Status</span>
              </div>
              <div className="space-y-1 mb-3">
                <div className="flex items-center">
                  <div className={`w-2 h-2 rounded-full mr-2 ${stream ? "bg-green-500" : "bg-red-500"}`} />
                  <span>Status: {stream ? "Active" : "Inactive"}</span>
                </div>
                <div className="flex items-center">
                  <div className={`w-2 h-2 rounded-full mr-2 ${videoRef.current?.paused === false ? "bg-green-500" : "bg-red-500"}`} />
                  <span>Video: {videoRef.current?.paused === false ? "Playing" : "Stopped"}</span>
                </div>
                <div className="flex items-center">
                  <div className={`w-2 h-2 rounded-full mr-2 ${isScanning ? "bg-green-500" : "bg-gray-400"}`} />
                  <span>Scanning: {isScanning ? "Active" : "Inactive"}</span>
                </div>
                <div className="flex items-center">
                  <div className={`w-2 h-2 rounded-full mr-2 ${detectedQR ? "bg-green-500" : "bg-gray-400"}`} />
                  <span>QR: {detectedQR ? "Detected" : "None"}</span>
                </div>
              </div>

              <div className="flex gap-2">
                {!isScanning ? (
                  <Button onClick={handleStartScanning} size="sm" className="h-8 px-3 bg-green-600 hover:bg-green-700 text-white" disabled={!stream}>
                    <Play className="h-3 w-3 mr-1" />
                    Start Scan
                  </Button>
                ) : (
                  <Button onClick={handleStopScanning} size="sm" className="h-8 px-3 bg-red-600 hover:bg-red-700 text-white">
                    <Square className="h-3 w-3 mr-1" />
                    Stop Scan
                  </Button>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Bottom Controls */}
      <div className="bg-white p-4 space-y-4">
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