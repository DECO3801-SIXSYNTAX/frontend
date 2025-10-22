"use client"

import { useEffect } from "react"
import { useNavigate } from "react-router-dom"

export function Welcome() {
  const navigate = useNavigate()

  useEffect(() => {
    // Redirect langsung ke QR scanner
    navigate('/kiosk/qr')
  }, [navigate])

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Loading...</h1>
        <p className="text-gray-600">Redirecting to QR scanner...</p>
      </div>
    </div>
  )
}