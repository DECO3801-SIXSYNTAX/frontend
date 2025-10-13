"use client"

import { useEffect } from "react"
import { useNavigate } from "react-router-dom"

export function Welcome() {
  const navigate = useNavigate()

  useEffect(() => {
    // Redirect langsung ke QR scanner
    navigate('/kiosk/qr')
  }, [navigate])

  return null
}
