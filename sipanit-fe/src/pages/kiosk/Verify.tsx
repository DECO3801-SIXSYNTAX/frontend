"use client"

import { useEffect, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Button } from "../../components/ui/button"
import { Loader2, CheckCircle, XCircle, User, Utensils, Heart, AlertCircle } from "lucide-react"

// Mock guest data interface
interface GuestInfo {
  id: string
  name: string
  email: string
  eventName: string
  dietaryRequirements: string[]
  specialNeeds: string[]
  allergies: string[]
  seatNumber?: string
  tableNumber?: string
}

export function Verify() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get("token")
  const [isLoading, setIsLoading] = useState(true)
  const [guestInfo, setGuestInfo] = useState<GuestInfo | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isCheckedIn, setIsCheckedIn] = useState(false)

  useEffect(() => {
    if (!token) {
      navigate("/kiosk")
      return
    }

    // Simulate API call to verify QR token and get guest info
    const verifyToken = async () => {
      setIsLoading(true)
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Mock verification based on token
      if (token === "valid" || token === "demo-token-from-upload") {
        // Mock guest data
        setGuestInfo({
          id: "guest-123",
          name: "John Doe",
          email: "john.doe@example.com",
          eventName: "Tech Conference 2024",
          dietaryRequirements: ["Vegetarian", "No Dairy"],
          specialNeeds: ["Wheelchair Access", "Large Print Materials"],
          allergies: ["Nuts", "Shellfish"],
          seatNumber: "A-15",
          tableNumber: "Table 3"
        })
        setError(null)
      } else if (token === "invalid") {
        setError("Invalid QR code. Please contact event staff.")
      } else if (token === "expired") {
        setError("QR code has expired. Please contact event staff.")
      } else {
        setError("QR code not recognized. Please contact event staff.")
      }
      
      setIsLoading(false)
    }

    verifyToken()
  }, [token, navigate])

  const handleCheckIn = async () => {
    // Simulate check-in API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsCheckedIn(true)
    
    // Redirect after successful check-in
    setTimeout(() => {
      navigate("/kiosk")
    }, 2000)
  }

  const handleBackToScan = () => {
    navigate("/kiosk/qr")
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
            <h1 className="text-3xl font-bold text-green-900 mb-2">Check-in Complete!</h1>
            <p className="text-green-700 text-center text-lg">Welcome to {guestInfo?.eventName}. Enjoy the event!</p>
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

  // Show guest information
  if (guestInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-3xl font-bold text-gray-900 mb-2">Welcome, {guestInfo.name}!</CardTitle>
            <p className="text-xl text-gray-600">{guestInfo.eventName}</p>
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
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-medium text-gray-900">{guestInfo.email}</p>
                </div>
                {guestInfo.seatNumber && (
                  <div>
                    <p className="text-sm text-gray-600">Seat Number</p>
                    <p className="font-medium text-gray-900">{guestInfo.seatNumber}</p>
                  </div>
                )}
                {guestInfo.tableNumber && (
                  <div>
                    <p className="text-sm text-gray-600">Table</p>
                    <p className="font-medium text-gray-900">{guestInfo.tableNumber}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Dietary Requirements */}
            {guestInfo.dietaryRequirements.length > 0 && (
              <div className="bg-green-50 rounded-lg p-6 border border-green-200">
                <div className="flex items-center mb-4">
                  <Utensils className="h-6 w-6 text-green-600 mr-3" />
                  <h3 className="text-lg font-semibold text-green-900">Dietary Requirements</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {guestInfo.dietaryRequirements.map((requirement, index) => (
                    <span key={index} className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                      {requirement}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Special Needs */}
            {guestInfo.specialNeeds.length > 0 && (
              <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                <div className="flex items-center mb-4">
                  <Heart className="h-6 w-6 text-blue-600 mr-3" />
                  <h3 className="text-lg font-semibold text-blue-900">Special Needs</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {guestInfo.specialNeeds.map((need, index) => (
                    <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                      {need}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Allergies */}
            {guestInfo.allergies.length > 0 && (
              <div className="bg-red-50 rounded-lg p-6 border border-red-200">
                <div className="flex items-center mb-4">
                  <AlertCircle className="h-6 w-6 text-red-600 mr-3" />
                  <h3 className="text-lg font-semibold text-red-900">Allergies</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {guestInfo.allergies.map((allergy, index) => (
                    <span key={index} className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
                      {allergy}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Check-in Button */}
            <div className="pt-6">
              <Button 
                onClick={handleCheckIn} 
                size="lg" 
                className="w-full h-16 text-xl font-semibold bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
              >
                <CheckCircle className="mr-3 h-6 w-6" />
                Check In
              </Button>
            </div>

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