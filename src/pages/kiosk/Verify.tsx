"use client"

import { useEffect, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import  Button   from "../../components/ui/Button"
import { Loader2, CheckCircle, XCircle, User, Utensils, Heart } from "lucide-react"

// Guest data interface based on backend structure
interface GuestInfo {
  id: string
  name: string
  phone?: string
  dietaryRestriction?: string
  accessibilityNeeds?: string
  seat?: string
  tags?: string[]
  checkedIn?: boolean
}

interface VerifyResponse {
  payload: {
    e: string // event_id
    g: string // guest_id
  }
  guest: GuestInfo
}

export function Verify() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get("token")
  const eventId = searchParams.get("eventId")
  const [isLoading, setIsLoading] = useState(true)
  const [guestInfo, setGuestInfo] = useState<GuestInfo | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isCheckedIn, setIsCheckedIn] = useState(false)

  useEffect(() => {
    if (!token || !eventId) {
      navigate("/kiosk")
      return
    }

    const verifyToken = async () => {
      setIsLoading(true)
      
      try {
        console.log("=== API Call Debug ===")
        console.log("Token:", token)
        console.log("EventId:", eventId)
        console.log("API URL:", 'http://127.0.0.1:8000/api/guest/debug-decode-guest/')
        
        const response = await fetch('http://127.0.0.1:8000/api/guest/debug-decode-guest/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token })
        })

        console.log("Response status:", response.status)
        console.log("Response headers:", response.headers)
        
        if (response.ok) {
          const data: VerifyResponse = await response.json()
          console.log("Response data:", data)
          setGuestInfo(data.guest)
          setError(null)
          
          // Auto check-in after successful verification
          setTimeout(() => {
            setIsCheckedIn(true)
          }, 1000)
        } else {
          const errorData = await response.json()
          console.error("API Error:", response.status, errorData)
          setError(errorData.detail || "Invalid QR code. Please contact event staff.")
        }
      } catch (error) {
        console.error("Network error:", error)
        setError("Network error. Please try again.")
      } finally {
        setIsLoading(false)
      }
    }

    verifyToken()
  }, [token, eventId, navigate])

  const handleBackToScan = () => {
    navigate(`/kiosk/qr?eventId=${eventId}&fromVerify=true`)
  }

  if (isLoading) {
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

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <XCircle className="h-16 w-16 text-red-600 mb-6" />
            <h1 className="text-3xl font-bold text-red-900 mb-4">Verification Failed</h1>
            <p className="text-red-700 text-center text-lg mb-8">{error}</p>
            <div className="space-y-3 w-full">
              <Button onClick={handleBackToScan} size="lg" className="w-full h-14 text-lg">
                Back to Scan
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isCheckedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <CheckCircle className="h-16 w-16 text-green-600 mb-6" />
            <h1 className="text-3xl font-bold text-green-900 mb-2">Success! You're checked in</h1>
            <p className="text-green-700 text-center text-lg mb-8">
              Welcome, {guestInfo?.name}! Enjoy the event!
            </p>
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
            {/* Auto redirect after 3 seconds */}
            <div className="mt-4">
              <p className="text-sm text-gray-600">Redirecting to kiosk...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Auto redirect after 3 seconds
  useEffect(() => {
    if (isCheckedIn) {
      const timer = setTimeout(() => {
        navigate("/kiosk")
      }, 3000)
      
      return () => clearTimeout(timer)
    }
  }, [isCheckedIn, navigate])

  // Show guest information (this should not be reached due to auto check-in)
  if (guestInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-3xl font-bold text-gray-900 mb-2">Welcome, {guestInfo.name}!</CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Guest Basic Info */}
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <div className="flex items-center mb-4">
                <User className="h-6 w-6 text-blue-600 mr-3" />
                <h3 className="text-lg font-semibold text-gray-900">Guest Information</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Name</p>
                  <p className="font-medium text-gray-900">{guestInfo.name}</p>
                </div>
                {guestInfo.phone && (
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <p className="font-medium text-gray-900">{guestInfo.phone}</p>
                  </div>
                )}
                {guestInfo.seat && (
                  <div>
                    <p className="text-sm text-gray-600">Seat</p>
                    <p className="font-medium text-gray-900">{guestInfo.seat}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Dietary Requirements */}
            {guestInfo.dietaryRestriction && (
              <div className="bg-green-50 rounded-lg p-6 border border-green-200">
                <div className="flex items-center mb-4">
                  <Utensils className="h-6 w-6 text-green-600 mr-3" />
                  <h3 className="text-lg font-semibold text-green-900">Dietary Requirements</h3>
                </div>
                <p className="text-green-800">{guestInfo.dietaryRestriction}</p>
              </div>
            )}

            {/* Accessibility Needs */}
            {guestInfo.accessibilityNeeds && (
              <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                <div className="flex items-center mb-4">
                  <Heart className="h-6 w-6 text-blue-600 mr-3" />
                  <h3 className="text-lg font-semibold text-blue-900">Accessibility Needs</h3>
                </div>
                <p className="text-blue-800">{guestInfo.accessibilityNeeds}</p>
              </div>
            )}

            {/* Back Button */}
            <div className="pt-4">
              <Button 
                onClick={handleBackToScan} 
                variant="outline" 
                size="lg" 
                className="w-full h-14 text-lg"
              >
                Back to Scan
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Fallback - should not reach here
  return null
}