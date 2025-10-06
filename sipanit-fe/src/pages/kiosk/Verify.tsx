"use client"

import { useEffect, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { useVerifyQr } from "../../lib/hooks/kiosk"
import { Card, CardContent } from "../../components/ui/card"
import { Button } from "../../components/ui/button"
import { Loader2, CheckCircle, XCircle } from "lucide-react"

export function Verify() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const eventId = searchParams.get("eventId")
  const token = searchParams.get("token")

  const { data: verifyResult, isLoading, verify } = useVerifyQr(token || "")
  const [showResult, setShowResult] = useState(false)

  useEffect(() => {
    if (!eventId || !token) {
      navigate("/kiosk")
      return
    }

    // Start verification
    verify()
  }, [eventId, token, navigate, verify])

  useEffect(() => {
    if (verifyResult) {
      setShowResult(true)

      if (verifyResult.ok) {
        // Success - redirect after delay
        const timer = setTimeout(() => {
          navigate(`/kiosk/events/${eventId}/map?guestId=${verifyResult.guestId}`)
        }, 1500)

        return () => clearTimeout(timer)
      }
    }
  }, [verifyResult, navigate, eventId])

  const handleBackToScan = () => {
    navigate(`/kiosk/qr?eventId=${eventId}`)
  }

  if (isLoading || !showResult) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-6" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Verifying your invitation...</h1>
            <p className="text-gray-600 text-center">Please wait while we check your QR code</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (verifyResult?.ok) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <CheckCircle className="h-16 w-16 text-green-600 mb-6" />
            <h1 className="text-3xl font-bold text-green-900 mb-2">Verified!</h1>
            <p className="text-green-700 text-center text-lg">Welcome to the event. Redirecting to your seat...</p>
            <div className="mt-6 flex space-x-2">
              <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce"></div>
              <div
                className="w-2 h-2 bg-green-600 rounded-full animate-bounce"
                style={{ animationDelay: "0.1s" }}
              ></div>
              <div
                className="w-2 h-2 bg-green-600 rounded-full animate-bounce"
                style={{ animationDelay: "0.2s" }}
              ></div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Verification failed
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <XCircle className="h-16 w-16 text-red-600 mb-6" />
          <h1 className="text-3xl font-bold text-red-900 mb-4">Verification Failed</h1>
          <p className="text-red-700 text-center text-lg mb-8">
            {verifyResult?.reason === "expired"
              ? "Your QR code has expired. Please contact event staff for assistance."
              : "QR code is invalid or expired. Please contact event staff."}
          </p>
          <div className="space-y-3 w-full">
            <Button onClick={handleBackToScan} size="lg" className="w-full h-14 text-lg">
              Back to Scan
            </Button>
            <Button
              onClick={() => navigate(`/kiosk?eventId=${eventId}`)}
              variant="outline"
              size="lg"
              className="w-full h-14 text-lg"
            >
              Back to Welcome
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
