import { useState, useRef, useEffect } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { Button } from "../../components/ui/button"
import { Card, CardContent } from "../../components/ui/card"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "../../components/ui/sheet"
import { Upload, HelpCircle, AlertCircle, Play, Square, Camera } from "lucide-react"

// Import jsQR properly
import jsQR from 'jsqr'

export function QrScan() {
  console.log("QrScan component loaded")
  
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const eventId = searchParams.get("eventId") || "default-event"
  const fromVerify = searchParams.get("fromVerify") === "true"

  // Add custom CSS animation
  useEffect(() => {
    const style = document.createElement('style')
    style.textContent = `
      @keyframes scanLine {
        0% { transform: translateY(-50%) translateX(-100%); opacity: 0; }
        20% { opacity: 1; }
        80% { opacity: 1; }
        100% { transform: translateY(-50%) translateX(100%); opacity: 0; }
      }
    `
    document.head.appendChild(style)
    return () => {
      if (document.head.contains(style)) {
        document.head.removeChild(style)
      }
    }
  }, [])
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const hasRestartedRef = useRef(false)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [manualToken, setManualToken] = useState("")
  const [isStartingCamera, setIsStartingCamera] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const [isManualScanning, setIsManualScanning] = useState(false)
  const [detectedQR, setDetectedQR] = useState<{data: string, location: {topLeftCorner: {x: number, y: number}, topRightCorner: {x: number, y: number}, bottomLeftCorner: {x: number, y: number}, bottomRightCorner: {x: number, y: number}}} | null>(null)
  const [invalidQR, setInvalidQR] = useState<{data: string, location: {topLeftCorner: {x: number, y: number}, topRightCorner: {x: number, y: number}, bottomLeftCorner: {x: number, y: number}, bottomRightCorner: {x: number, y: number}}} | null>(null)

  useEffect(() => {
    // Reset restart flag for fresh mount
    hasRestartedRef.current = false
    
    // Clean up any existing stream first
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
    
    // Reset states
    setIsScanning(false)
    setIsManualScanning(false)
    setDetectedQR(null)
    setCameraError(null)
    
    // Start fresh
    startCamera()
  }, [])

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
    }
  }, [stream])

  // Handle when user returns from verify page
  useEffect(() => {
    if (fromVerify && !hasRestartedRef.current) {
      console.log("User returned from verify page, restarting camera...")
      hasRestartedRef.current = true
      
      // Force restart camera immediately
      const restartCamera = () => {
        console.log("Force restarting camera...")
        
        // Stop any existing tracks
        if (videoRef.current && videoRef.current.srcObject) {
          const existingStream = videoRef.current.srcObject as MediaStream
          existingStream.getTracks().forEach(track => {
            console.log("Stopping track:", track.kind)
            track.stop()
          })
        }
        
        // Clear video source
        if (videoRef.current) {
          videoRef.current.srcObject = null
        }
        
        // Reset states
        setIsScanning(false)
        setIsManualScanning(false)
        setDetectedQR(null)
        setCameraError(null)
        setStream(null)
        
        // Start fresh camera after a short delay
        setTimeout(() => {
          console.log("Starting fresh camera after cleanup...")
          startCamera()
        }, 500)
      }
      
      restartCamera()
    }
  }, [fromVerify])

  const startCamera = async () => {
    console.log("=== startCamera called ===")
    try {
      setIsStartingCamera(true)
      setCameraError(null)
    
    console.log("Starting camera...")
    
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera not supported on this device")
      }

      try {
        // Simple, reliable camera settings
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { 
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        })
        
        console.log("Camera stream obtained:", mediaStream)
        setStream(mediaStream)
        
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream
          videoRef.current.onloadedmetadata = () => {
            console.log("Video metadata loaded")
            console.log("Attempting to play video...")
            videoRef.current?.play().then(() => {
              console.log("Video play() resolved successfully")
            }).catch((error) => {
              console.error("Video play() failed:", error)
            })
          }
          videoRef.current.onplaying = () => {
            console.log("=== Video is playing ===")
            console.log("isManualScanning:", isManualScanning)
            console.log("Auto-starting QR scanning")
            setIsScanning(true)
            setTimeout(() => startQRScanning(), 100) // Small delay to ensure video is ready
          }
          videoRef.current.onerror = (e) => {
            console.error("Video error:", e)
            setCameraError("Failed to start video stream")
          }
        }
      } catch (error) {
        console.log("Camera access failed:", error)
        throw error
      }
    } catch (error: any) {
      console.error("Camera error:", error)
      let errorMessage = "Failed to access camera"
      
      if (error.name === 'NotAllowedError') {
        errorMessage = "Camera access denied. Please allow camera access and refresh the page."
      } else if (error.name === 'NotFoundError') {
        errorMessage = "No camera found on this device"
      } else if (error.name === 'NotSupportedError') {
        errorMessage = "Camera not supported on this device"
      } else if (error.name === 'NotReadableError') {
        errorMessage = "Camera is being used by another application"
      }
      
      setCameraError(errorMessage)
    } finally {
      setIsStartingCamera(false)
    }
  }

  const startQRScanning = () => {
    console.log("startQRScanning called")
    console.log("videoRef.current:", videoRef.current)
    console.log("canvasRef.current:", canvasRef.current)
    console.log("isScanning:", isScanning)
    
    if (!videoRef.current || !canvasRef.current) {
      console.log("Missing video or canvas ref")
      return
    }
    
    console.log("Starting QR scanning...")
    
    const scan = () => {
      const video = videoRef.current
      const canvas = canvasRef.current
      
      if (!video || !canvas) {
        console.log("Video or canvas not available")
        return
      }
      
      if (video.readyState !== video.HAVE_ENOUGH_DATA) {
        console.log("Video not ready, readyState:", video.readyState)
        if (isScanning) {
          requestAnimationFrame(scan)
        }
        return
      }

      const context = canvas.getContext('2d')
      if (!context) {
        console.log("Canvas context not available")
        return
      }

      // Optimize canvas size for better QR detection
      const scale = 0.8 // Better balance between performance and detection
      canvas.width = video.videoWidth * scale
      canvas.height = video.videoHeight * scale
      context.drawImage(video, 0, 0, canvas.width, canvas.height)

      const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
      
      try {
        // Simple, fast QR detection
        const code = jsQR(imageData.data, imageData.width, imageData.height)
        
        if (code) {
          console.log("QR Code detected:", code.data)
          
          // Check if this is a valid QR code for our system
          const isValidQR = isValidQRCode(code.data)
          
          if (isValidQR) {
            // Store detected QR with location for tracking
            setDetectedQR({
              data: code.data,
              location: code.location
            })
            setInvalidQR(null) // Clear invalid QR
            
            // Auto-process immediately for maximum responsiveness
            setTimeout(() => {
              setIsScanning(false)
              setIsManualScanning(false)
              handleQRDetected(code.data)
            }, 200) // Very short delay just to show tracking
            return
          } else {
            // Store invalid QR for visual feedback
            setInvalidQR({
              data: code.data,
              location: code.location
            })
            setDetectedQR(null) // Clear valid QR
            
            // Clear invalid QR quickly
            setTimeout(() => {
              setInvalidQR(null)
            }, 1000)
          }
        } else {
          // Clear both detected and invalid QR if no code found
          setDetectedQR(null)
          setInvalidQR(null)
        }
      } catch (error) {
        console.error("QR detection error:", error)
        setDetectedQR(null)
      }

      if (isScanning) {
        // Use requestAnimationFrame for smooth, efficient scanning
        requestAnimationFrame(scan)
      }
    }

    scan()
  }

  const isValidQRCode = (qrData: string): boolean => {
    // Check if QR code contains valid token format
    // Valid formats: direct token, URL with token parameter, or base64 encoded token
    if (!qrData || qrData.length < 10) return false
    
    // Check for token parameter in URL
    if (qrData.includes('token=')) {
      const urlParams = new URLSearchParams(qrData.split('?')[1])
      const token = urlParams.get('token')
      return !!(token && token.length > 10)
    }
    
    // Check for direct token (should be reasonably long)
    if (qrData.length > 20) return true
    
    // Check for base64 encoded token
    try {
      const decoded = atob(qrData)
      return decoded.length > 10
    } catch {
      return false
    }
  }

  const handleQRDetected = (qrData: string) => {
    console.log("QR Data received:", qrData)
    
    // Extract token from QR data (handle both direct token and URL with token)
    let token = qrData
    if (qrData.includes('token=')) {
      const urlParams = new URLSearchParams(qrData.split('?')[1])
      token = urlParams.get('token') || qrData
    }
    
    console.log("Extracted token:", token)
    navigate(`/kiosk/verify?eventId=${eventId}&token=${token}`)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = canvasRef.current
        if (!canvas) return
        
        const context = canvas.getContext('2d')
        if (!context) return
        
        canvas.width = img.width
        canvas.height = img.height
        context.drawImage(img, 0, 0)
        
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
        
        try {
          const code = jsQR(imageData.data, imageData.width, imageData.height)
          if (code) {
            handleQRDetected(code.data)
          } else {
            alert("No QR code found in the uploaded image")
          }
        } catch (error) {
          console.error("QR detection error:", error)
          alert("Error processing QR code")
        }
      }
      img.src = e.target?.result as string
    }
    reader.readAsDataURL(file)
  }

  const handleStartScanning = () => {
    console.log("Starting manual scanning")
    setIsManualScanning(true)
    setIsScanning(true)
    setTimeout(() => startQRScanning(), 100)
  }

  const handleStopScanning = () => {
    console.log("Stopping scanning")
    setIsScanning(false)
    setIsManualScanning(false)
  }

  const handleManualSubmit = () => {
    if (manualToken.trim()) {
      navigate(`/kiosk/verify?eventId=${eventId}&token=${manualToken.trim()}`)
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
            
            {/* Hidden canvas for QR detection */}
            <canvas 
              ref={canvasRef}
              style={{ display: 'none' }}
            />
            
            {/* QR Tracking Overlay - iOS style */}
            {detectedQR && (
              <div 
                className="absolute inset-0 pointer-events-none"
                style={{ zIndex: 2 }}
              >
                {/* Calculate QR position relative to video */}
                {(() => {
                  const video = videoRef.current
                  if (!video) return null
                  
                  const videoRect = video.getBoundingClientRect()
                  const scaleX = videoRect.width / video.videoWidth
                  const scaleY = videoRect.height / video.videoHeight
                  
                  const qrLocation = detectedQR.location
                  const topLeft = {
                    x: qrLocation.topLeftCorner.x * scaleX,
                    y: qrLocation.topLeftCorner.y * scaleY
                  }
                  const topRight = {
                    x: qrLocation.topRightCorner.x * scaleX,
                    y: qrLocation.topRightCorner.y * scaleY
                  }
                  const bottomLeft = {
                    x: qrLocation.bottomLeftCorner.x * scaleX,
                    y: qrLocation.bottomLeftCorner.y * scaleY
                  }
                  // const bottomRight = {
                  //   x: qrLocation.bottomRightCorner.x * scaleX,
                  //   y: qrLocation.bottomRightCorner.y * scaleY
                  // }
                  
                  return (
                    <div className="relative w-full h-full">
                      {/* QR Code Highlight Box */}
                      <div 
                        className="absolute border-2 border-green-400 bg-green-400/20 rounded-lg animate-pulse"
                        style={{
                          left: topLeft.x,
                          top: topLeft.y,
                          width: Math.abs(topRight.x - topLeft.x),
                          height: Math.abs(bottomLeft.y - topLeft.y),
                          transform: `rotate(${Math.atan2(topRight.y - topLeft.y, topRight.x - topLeft.x) * 180 / Math.PI}deg)`
                        }}
                      >
                        {/* Corner indicators */}
                        <div className="absolute -top-1 -left-1 w-3 h-3 border-l-2 border-t-2 border-green-400 rounded-tl-lg"></div>
                        <div className="absolute -top-1 -right-1 w-3 h-3 border-r-2 border-t-2 border-green-400 rounded-tr-lg"></div>
                        <div className="absolute -bottom-1 -left-1 w-3 h-3 border-l-2 border-b-2 border-green-400 rounded-bl-lg"></div>
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 border-r-2 border-b-2 border-green-400 rounded-br-lg"></div>
                      </div>
                      
                      {/* QR Code Data Display */}
                      <div 
                        className="absolute bg-black/80 text-white px-3 py-2 rounded-lg text-sm font-mono max-w-xs break-all"
                        style={{
                          left: topLeft.x,
                          top: topLeft.y - 40,
                          transform: 'translateX(-50%)'
                        }}
                      >
                        📱 {detectedQR.data.substring(0, 30)}...
                      </div>
                    </div>
                  )
                })()}
              </div>
            )}
            
            {/* Invalid QR Tracking Overlay */}
            {invalidQR && (
              <div 
                className="absolute inset-0 pointer-events-none"
                style={{ zIndex: 2 }}
              >
                {(() => {
                  const video = videoRef.current
                  if (!video) return null
                  
                  const videoRect = video.getBoundingClientRect()
                  const scaleX = videoRect.width / video.videoWidth
                  const scaleY = videoRect.height / video.videoHeight
                  
                  const qrLocation = invalidQR.location
                  const topLeft = {
                    x: qrLocation.topLeftCorner.x * scaleX,
                    y: qrLocation.topLeftCorner.y * scaleY
                  }
                  const topRight = {
                    x: qrLocation.topRightCorner.x * scaleX,
                    y: qrLocation.topRightCorner.y * scaleY
                  }
                  const bottomLeft = {
                    x: qrLocation.bottomLeftCorner.x * scaleX,
                    y: qrLocation.bottomLeftCorner.y * scaleY
                  }
                  
                  return (
                    <div className="relative w-full h-full">
                      {/* Invalid QR Code Highlight Box - Red */}
                      <div 
                        className="absolute border-2 border-red-400 bg-red-400/20 rounded-lg animate-pulse"
                        style={{
                          left: topLeft.x,
                          top: topLeft.y,
                          width: Math.abs(topRight.x - topLeft.x),
                          height: Math.abs(bottomLeft.y - topLeft.y),
                          transform: `rotate(${Math.atan2(topRight.y - topLeft.y, topRight.x - topLeft.x) * 180 / Math.PI}deg)`
                        }}
                      >
                        {/* Corner indicators */}
                        <div className="absolute -top-1 -left-1 w-3 h-3 border-l-2 border-t-2 border-red-400 rounded-tl-lg"></div>
                        <div className="absolute -top-1 -right-1 w-3 h-3 border-r-2 border-t-2 border-red-400 rounded-tr-lg"></div>
                        <div className="absolute -bottom-1 -left-1 w-3 h-3 border-l-2 border-b-2 border-red-400 rounded-bl-lg"></div>
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 border-r-2 border-b-2 border-red-400 rounded-br-lg"></div>
                      </div>
                      
                      {/* Invalid QR Code Data Display */}
                      <div 
                        className="absolute bg-red-600/90 text-white px-3 py-2 rounded-lg text-sm font-mono max-w-xs break-all"
                        style={{
                          left: topLeft.x,
                          top: topLeft.y - 40,
                          transform: 'translateX(-50%)'
                        }}
                      >
                        ❌ Invalid QR Code
                      </div>
                    </div>
                  )
                })()}
              </div>
            )}
            
            {/* Clean overlay without opacity */}
            <div 
              className="absolute inset-0"
              style={{ zIndex: 1 }}
            >
              {/* Simple cutout for scan area */}
              <div 
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-transparent border-2 border-white/30 rounded-lg"
                style={{
                  boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.3)'
                }}
              ></div>
            </div>
            {!stream && (
              <div 
                className="w-full h-full bg-gray-100 flex items-center justify-center"
                style={{ 
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  zIndex: 1
                }}
              >
                <div className="text-center text-gray-600">
                  <div className="w-16 h-16 border-4 border-gray-300 border-dashed rounded-lg mx-auto mb-4 flex items-center justify-center">
                    <div className="w-8 h-8 bg-gray-300 rounded"></div>
                  </div>
                  <p className="text-lg font-medium">Camera Loading...</p>
                  <p className="text-sm text-gray-500 mt-2">Please allow camera access</p>
                </div>
              </div>
            )}

            {/* Clean Animated Scanner */}
            <div 
              className="absolute inset-0 flex items-center justify-center"
              style={{ zIndex: 3 }}
            >
              <div className="relative">
                {/* Ultra clean scanning frame */}
                <div className="w-72 h-72 relative">
                  {/* Simple border */}
                  <div className="absolute inset-0 border border-white/50 rounded-lg"></div>
                  
                  {/* Only scanning line when active */}
                  {isScanning && (
                  <div className="absolute inset-0 overflow-hidden rounded-lg">
                      <div 
                        className="absolute w-full h-px bg-white"
                        style={{
                          animation: 'scanLine 1.5s ease-in-out infinite',
                          top: '50%',
                          transform: 'translateY(-50%)'
                        }}
                      ></div>
                    </div>
                  )}
                  </div>

                {/* Instructions */}
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

            {/* Camera Status & Controls */}
            <div 
              className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm text-gray-800 p-3 rounded-lg text-xs border border-gray-200"
              style={{ zIndex: 4 }}
            >
              <div className="flex items-center mb-2">
                <Camera className="h-4 w-4 mr-2 text-blue-600" />
                <span className="font-semibold">Camera Status</span>
              </div>
              <div className="space-y-1 mb-3">
                <div className="flex items-center">
                  <div className={`w-2 h-2 rounded-full mr-2 ${stream ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span>Status: {stream ? 'Active' : 'Inactive'}</span>
                </div>
                <div className="flex items-center">
                  <div className={`w-2 h-2 rounded-full mr-2 ${videoRef.current?.paused === false ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span>Video: {videoRef.current?.paused === false ? 'Playing' : 'Stopped'}</span>
                </div>
                <div className="flex items-center">
                  <div className={`w-2 h-2 rounded-full mr-2 ${isScanning ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                  <span>Scanning: {isScanning ? 'Active' : 'Inactive'}</span>
                </div>
                <div className="flex items-center">
                  <div className={`w-2 h-2 rounded-full mr-2 ${detectedQR ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                  <span>QR: {detectedQR ? 'Detected' : 'None'}</span>
                </div>
              </div>
              
              {/* Start/Stop Scanning Controls */}
              <div className="flex gap-2">
                {!isScanning ? (
                  <Button
                    onClick={handleStartScanning}
                    size="sm"
                    className="h-8 px-3 bg-green-600 hover:bg-green-700 text-white"
                    disabled={!stream}
                  >
                    <Play className="h-3 w-3 mr-1" />
                    Start Scan
                  </Button>
                ) : (
                  <Button
                    onClick={handleStopScanning}
                    size="sm"
                    className="h-8 px-3 bg-red-600 hover:bg-red-700 text-white"
                  >
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
