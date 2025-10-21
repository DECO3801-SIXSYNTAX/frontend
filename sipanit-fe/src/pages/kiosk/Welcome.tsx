"use client"

import { useEffect } from "react"
import { useNavigate } from "react-router-dom"

export function Welcome() {
  const navigate = useNavigate()

  useEffect(() => {
    // Redirect ke QR scanner langsung
    navigate('/kiosk/qr')
  }, [navigate])

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Welcome to Kiosk</h1>
        <p className="text-gray-600">Redirecting to QR scanner...</p>
      </div>
    </div>
  )
}
