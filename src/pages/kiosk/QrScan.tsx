"use client"

// qrscan.tsx
import { useState, useRef, useEffect } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { Button } from "../../components/ui/button"
import { Card, CardContent } from "../../components/ui/card"
import { QrCode, HelpCircle, AlertCircle, Square } from "lucide-react"
import jsQR from "jsqr"

export function QrScan() {
  console.log("QrScan component loaded")

  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const eventId = searchParams.get("eventId") || "default-event"
  const fromVerify = searchParams.get("fromVerify") === "true"

  // DOM refs
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Scan loop refs
  const rafRef = useRef<number | null>(null)
  const scanningRef = useRef(false)
  const lastTextRef = useRef<string>("")
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null)
  const hasRestartedRef = useRef(false)

  // QR tracking overlay refs
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null)
  const overlayCtxRef = useRef<CanvasRenderingContext2D | null>(null)
  const [qrCorners, setQrCorners] = useState<{x: number, y: number}[] | null>(null)

  // Real-time scanning metrics
  const [scanMetrics, setScanMetrics] = useState({
    totalScans: 0,
    successfulScans: 0,
    avgScanTime: 0,
    lastScanTime: 0,
    scanningStartTime: Date.now(),
    currentFPS: 0
  })

  // Real-time clock state
  const [currentTime, setCurrentTime] = useState(new Date())

  // UI state
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [isStartingCamera, setIsStartingCamera] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const [detectedQR, setDetectedQR] = useState<string | null>(null)
  const [invalidQR, setInvalidQR] = useState<string | null>(null)

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // Initial mount: clean up any old stream and start camera
  useEffect(() => {
    hasRestartedRef.current = false
    scanningRef.current = false
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    if (stream) {
      stream.getTracks().forEach((t) => t.stop())
      setStream(null)
    }
    setIsScanning(false)
    setDetectedQR(null)
    setCameraError(null)
    startCamera()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    return () => {
      scanningRef.current = false
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      if (stream) stream.getTracks().forEach((track) => track.stop())
    }
  }, [stream])

  // Initialize overlay canvas
  useEffect(() => {
    const overlayCanvas = overlayCanvasRef.current
    if (!overlayCanvas) return

    const ctx = overlayCanvas.getContext('2d')
    if (!ctx) return

    overlayCtxRef.current = ctx

    // Set canvas size to match video
    const updateCanvasSize = () => {
      const video = videoRef.current
      if (!video) return

      overlayCanvas.width = video.videoWidth || video.clientWidth
      overlayCanvas.height = video.videoHeight || video.clientHeight
    }

    // Update size when video loads
    const video = videoRef.current
    if (video) {
      video.addEventListener('loadedmetadata', updateCanvasSize)
      video.addEventListener('resize', updateCanvasSize)
    }

    return () => {
      if (video) {
        video.removeEventListener('loadedmetadata', updateCanvasSize)
        video.removeEventListener('resize', updateCanvasSize)
      }
    }
  }, [stream])

  useEffect(() => {
    if (fromVerify && !hasRestartedRef.current) {
      console.log("User returned from verify page, restarting camera…")
      hasRestartedRef.current = true
      scanningRef.current = false
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      if (videoRef.current?.srcObject) {
        ;(videoRef.current.srcObject as MediaStream).getTracks().forEach((track) => {
          console.log("Stopping track:", track.kind)
          track.stop()
        })
      }
      if (videoRef.current) videoRef.current.srcObject = null
      setIsScanning(false)
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
          videoRef.current?.play().catch((err) => console.error("video.play() failed:", err))
        }

        videoRef.current.onplaying = () => {
          console.log("=== Video is playing ===")
          // Auto-start scanning when camera is ready
          scanningRef.current = true
          setIsScanning(true)
          startQRScanning()
        }

        videoRef.current.onerror = (e) => {
          console.error("Video error:", e)
          setCameraError("Failed to start video stream")
        }
      }
    } catch (error: any) {
      console.error("Camera error:", error)
      let msg = "Failed to access camera"
      if (error?.name === "NotAllowedError")
        msg = "Camera access denied. Please allow camera access and refresh the page."
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

    // Reset scanning start time
    setScanMetrics(prev => ({
      ...prev,
      scanningStartTime: Date.now()
    }))

    let ctx = ctxRef.current
    if (!ctx) {
      ctx = canvas.getContext("2d", { willReadFrequently: true }) as CanvasRenderingContext2D | null
      if (!ctx) {
        console.log("Canvas context not available")
        return
      }
      ctxRef.current = ctx
    }

    const scale = 0.8
    canvas.width = Math.max(1, (video.videoWidth || 640) * scale)
    canvas.height = Math.max(1, (video.videoHeight || 480) * scale)

    const scan = () => {
      if (!scanningRef.current) return
      rafRef.current = requestAnimationFrame(scan)
      if (video.readyState < video.HAVE_CURRENT_DATA) return

      ctx!.drawImage(video, 0, 0, canvas.width, canvas.height)
      const { data, width, height } = ctx!.getImageData(0, 0, canvas.width, canvas.height)

      try {
        const code = jsQR(data, width, height)
        if (code?.data) {
          // Draw QR tracking overlay
          drawQROverlay(code.location)
          
          if (code.data === lastTextRef.current) return
          lastTextRef.current = code.data

          const isValid = isValidQRCode(code.data)
          if (isValid) {
            setDetectedQR(code.data)
            setInvalidQR(null)
            scanningRef.current = false
            setIsScanning(false)

            // Update metrics
            const scanTime = (Date.now() - scanMetrics.scanningStartTime) / 1000
            updateScanMetrics(true, scanTime)

            try {
              ;(video.srcObject as MediaStream | null)?.getTracks().forEach((t) => t.stop())
            } catch {}

            handleQRDetected(code.data)
          } else {
            setInvalidQR(code.data)
            setDetectedQR(null)
            
            // Update metrics for invalid QR
            const scanTime = (Date.now() - scanMetrics.scanningStartTime) / 1000
            updateScanMetrics(false, scanTime)
            
            setTimeout(() => setInvalidQR(null), 1000)
          }
        } else {
          // No QR detected, clear overlay
          drawQROverlay(null)
          setDetectedQR(null)
          setInvalidQR(null)
        }
      } catch (err) {
        console.error("QR detection error:", err)
        drawQROverlay(null)
        setDetectedQR(null)
      }
    }

    scan()
  }

  const isValidQRCode = (qrData: string): boolean => {
    if (!qrData || qrData.length < 10) return false

    if (qrData.includes("token=")) {
      try {
        const url = new URL(qrData)
        const token = url.searchParams.get("token")
        return !!(token && token.length > 10)
      } catch {
        const qs = qrData.split("?")[1] || ""
        const token = new URLSearchParams(qs).get("token")
        return !!(token && token.length > 10)
      }
    }

    if (qrData.length > 20) return true

    try {
      const decoded = atob(qrData)
      return decoded.length > 10
    } catch {
      return false
    }
  }

  // Draw QR tracking overlay (iOS-style)
  const drawQROverlay = (location: any) => {
    const overlayCanvas = overlayCanvasRef.current
    const overlayCtx = overlayCtxRef.current
    if (!overlayCanvas || !overlayCtx) return

    // Clear canvas
    overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height)

    if (!location || !location.topLeftCorner || !location.topRightCorner || !location.bottomLeftCorner || !location.bottomRightCorner) {
      setQrCorners(null)
      return
    }

    // Scale corners to overlay canvas size
    const video = videoRef.current
    if (!video) return

    const scaleX = overlayCanvas.width / video.videoWidth
    const scaleY = overlayCanvas.height / video.videoHeight

    const corners = [
      { x: location.topLeftCorner.x * scaleX, y: location.topLeftCorner.y * scaleY },
      { x: location.topRightCorner.x * scaleX, y: location.topRightCorner.y * scaleY },
      { x: location.bottomRightCorner.x * scaleX, y: location.bottomRightCorner.y * scaleY },
      { x: location.bottomLeftCorner.x * scaleX, y: location.bottomLeftCorner.y * scaleY }
    ]

    // Draw QR code outline with glow effect
    overlayCtx.strokeStyle = '#00ff00'
    overlayCtx.lineWidth = 3
    overlayCtx.shadowColor = '#00ff00'
    overlayCtx.shadowBlur = 10
    overlayCtx.lineCap = 'round'
    overlayCtx.lineJoin = 'round'

    overlayCtx.beginPath()
    overlayCtx.moveTo(corners[0].x, corners[0].y)
    overlayCtx.lineTo(corners[1].x, corners[1].y)
    overlayCtx.lineTo(corners[2].x, corners[2].y)
    overlayCtx.lineTo(corners[3].x, corners[3].y)
    overlayCtx.closePath()
    overlayCtx.stroke()

    // Draw corner indicators (iOS-style)
    const cornerSize = 20
    corners.forEach((corner) => {
      overlayCtx.beginPath()
      overlayCtx.arc(corner.x, corner.y, cornerSize, 0, 2 * Math.PI)
      overlayCtx.fillStyle = '#00ff00'
      overlayCtx.fill()
      overlayCtx.strokeStyle = '#ffffff'
      overlayCtx.lineWidth = 2
      overlayCtx.stroke()
    })

    setQrCorners(corners)
  }

  // Update scan metrics
  const updateScanMetrics = (success: boolean, scanTime: number) => {
    setScanMetrics(prev => ({
      ...prev,
      totalScans: prev.totalScans + 1,
      successfulScans: success ? prev.successfulScans + 1 : prev.successfulScans,
      avgScanTime: prev.totalScans > 0 ? (prev.avgScanTime * prev.totalScans + scanTime) / (prev.totalScans + 1) : scanTime,
      lastScanTime: scanTime
    }))
  }

  const handleQRDetected = (qrData: string) => {
    console.log("QR Data received:", qrData)

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

    const scanId = Date.now().toString()
    console.log("Extracted token:", token, "scanId:", scanId)

    navigate(
      `/kiosk/verify?eventId=${encodeURIComponent(eventId)}&token=${encodeURIComponent(
        token,
      )}&scan=${encodeURIComponent(scanId)}`,
    )
  }

  const handleStopScanning = () => {
    console.log("Stopping scanning")
    scanningRef.current = false
    setIsScanning(false)
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    
    // Clear QR tracking overlay
    drawQROverlay(null)
    
    // Reset detected QR states
    setDetectedQR(null)
    setInvalidQR(null)
    
    // Reset scanning start time for next scan
    setScanMetrics(prev => ({
      ...prev,
      scanningStartTime: Date.now()
    }))
  }

  console.log("QrScan render - eventId:", eventId, "stream:", stream)

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center">
              <QrCode className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Event Check-in</h1>
              <p className="text-sm text-gray-500">Kiosk Terminal</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-full">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm font-medium text-green-700">Online</span>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-6xl">
          {/* Welcome section - centered */}
          <div className="text-center space-y-4 mb-8">
            <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto">
              <QrCode className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome to the Event</h2>
              <p className="text-gray-600">
                Please scan your QR code below to check in. If you need assistance,
                <br />
                our staff is here to help.
              </p>
            </div>
          </div>

          <div className="flex gap-6 items-center">
            {/* Left side - Main scanner area */}
            <div className="flex-1 space-y-6">

              {/* Scanner card */}
              <Card className="overflow-hidden shadow-lg">
                <CardContent className="p-0">
                  {/* Black scanner area */}
                  <div className="bg-black relative" style={{ height: "500px" }}>
                    {/* Scanning indicator */}
                    {isScanning && (
                      <div className="absolute top-4 left-4 z-10 flex items-center gap-2 text-green-400 text-sm font-medium">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                        Scanning...
                      </div>
                    )}

                    {/* Video element */}
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="absolute inset-0 w-full h-full object-cover"
                    />

                    {/* Hidden canvas */}
                    <canvas ref={canvasRef} style={{ display: "none" }} />
                    
                    {/* QR tracking overlay canvas */}
                    <canvas
                      ref={overlayCanvasRef}
                      className="absolute inset-0 w-full h-full pointer-events-none"
                      style={{ zIndex: 2 }}
                    />

                    {/* Scanner frame overlay */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="relative w-80 h-80">
                        {/* Blue rounded frame */}
                        <div className="absolute inset-0 border-4 border-blue-500 rounded-3xl" />

                        {/* Center content */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                          <QrCode className="w-12 h-12 mb-3 opacity-50" />
                          <p className="text-sm font-medium opacity-75">Position QR code here</p>
                        </div>

                        {/* Success/Error overlay */}
                        {detectedQR && (
                          <div className="absolute inset-0 bg-green-500/20 border-4 border-green-400 rounded-3xl flex items-center justify-center">
                            <div className="text-center">
                              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-2">
                                <QrCode className="w-8 h-8 text-white" />
                              </div>
                              <p className="text-green-400 font-bold">QR Code Detected!</p>
                            </div>
                          </div>
                        )}

                        {invalidQR && (
                          <div className="absolute inset-0 bg-red-500/20 border-4 border-red-400 rounded-3xl flex items-center justify-center">
                            <div className="text-center">
                              <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-2">
                                <AlertCircle className="w-8 h-8 text-white" />
                              </div>
                              <p className="text-red-400 font-bold">Invalid QR Code</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Camera error state */}
                    {cameraError && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black">
                        <div className="text-center text-white">
                          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                          <p className="text-xl font-bold mb-2">Camera Not Available</p>
                          <p className="text-gray-400">{cameraError}</p>
                        </div>
                      </div>
                    )}

                    {/* Loading state */}
                    {!stream && !cameraError && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black">
                        <div className="text-center text-white">
                          <div className="w-16 h-16 border-4 border-gray-600 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
                          <p className="text-xl font-bold mb-2">Initializing Camera</p>
                          <p className="text-gray-400">Please allow camera access when prompted</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Bottom instruction card */}
                  <div className="bg-white p-6 text-center space-y-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">Scan Your QR Code</h3>
                      <p className="text-gray-600">
                        Hold your QR code steady within the scanning area above. The system will
                        <br />
                        automatically detect and process your invitation.
                      </p>
                    </div>
                    <button className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium">
                      <HelpCircle className="w-5 h-5" />
                      Need help? Contact staff
                    </button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="w-80 space-y-6">
              {/* Scanning Metrics Card */}
              <Card className="shadow-lg">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <QrCode className="w-5 h-5 text-blue-600" />
                    </div>
                    <h3 className="font-bold text-gray-900">Scanning Metrics</h3>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Scans Today:</span>
                      <span className="text-sm font-medium text-gray-900">{scanMetrics.totalScans}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Success Rate:</span>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${scanMetrics.successfulScans / Math.max(scanMetrics.totalScans, 1) > 0.9 ? "bg-green-500" : "bg-yellow-500"}`} />
                        <span className="text-sm font-medium text-gray-900">
                          {scanMetrics.totalScans > 0 ? Math.round((scanMetrics.successfulScans / scanMetrics.totalScans) * 100) : 0}%
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Avg Time:</span>
                      <span className="text-sm font-medium text-gray-900">{scanMetrics.avgScanTime.toFixed(1)}s</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Last Scan:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {scanMetrics.lastScanTime > 0 ? `${scanMetrics.lastScanTime.toFixed(1)}s ago` : "None"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Status:</span>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${isScanning ? "bg-green-500" : "bg-gray-400"}`} />
                        <span className="text-sm font-medium text-gray-900">{isScanning ? "Scanning" : "Ready"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Button
                      onClick={handleStopScanning}
                      disabled={!isScanning}
                      className="w-full bg-red-500 hover:bg-red-600 text-white"
                    >
                      <Square className="w-4 h-4 mr-2" />
                      Stop Scan
                    </Button>
                    
                    {!isScanning && (
                      <Button
                        onClick={() => {
                          scanningRef.current = true
                          setIsScanning(true)
                          startQRScanning()
                        }}
                        disabled={!stream}
                        className="w-full bg-green-500 hover:bg-green-600 text-white"
                      >
                        <QrCode className="w-4 h-4 mr-2" />
                        Start Scan
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Time Cards */}
              <div className="grid grid-cols-2 gap-4">
                <Card className="shadow-lg">
                  <CardContent className="p-4 text-center">
                    <div className="text-lg font-bold text-blue-600 mb-1">
                      {currentTime.toLocaleTimeString('en-AU', { 
                        timeZone: 'Australia/Brisbane',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      })}
                    </div>
                    <div className="text-xs text-gray-600">Brisbane Time</div>
                  </CardContent>
                </Card>

                <Card className="shadow-lg">
                  <CardContent className="p-4 text-center">
                    <div className="text-lg font-bold text-green-600 mb-1">
                      {currentTime.toLocaleDateString('en-AU', { 
                        timeZone: 'Australia/Brisbane',
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short'
                      })}
                    </div>
                    <div className="text-xs text-gray-600">Event Date</div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
