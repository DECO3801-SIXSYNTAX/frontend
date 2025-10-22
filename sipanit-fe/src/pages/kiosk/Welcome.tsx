"use client"

import { Button } from "../../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { useNavigate } from "react-router-dom"
import { QrCode, Users, MapPin } from "lucide-react"

export function Welcome() {
  const navigate = useNavigate()

  const handleStartScanning = () => {
    navigate('/kiosk/qr')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <Card className="shadow-lg">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <QrCode className="w-8 h-8 text-blue-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Welcome to Event Check-in
            </CardTitle>
            <p className="text-gray-600 mt-2">
              Scan your QR code to check in to the event
            </p>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <QrCode className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="font-medium text-gray-900">QR Code Scanning</p>
                  <p className="text-sm text-gray-600">Scan your invitation QR code</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <Users className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-medium text-gray-900">Guest Verification</p>
                  <p className="text-sm text-gray-600">Verify your guest information</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <MapPin className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="font-medium text-gray-900">Seat Assignment</p>
                  <p className="text-sm text-gray-600">Find your assigned seat</p>
                </div>
              </div>
            </div>
            
            <Button 
              onClick={handleStartScanning}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg font-medium"
            >
              Start QR Scanning
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
