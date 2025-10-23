// Verify.tsx
"use client"

import { useEffect, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Button } from "../../components/ui/button"
import { Loader2, CheckCircle, XCircle, Utensils, Heart } from "lucide-react"

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
  payload: { e: string; g: string }
  guest: GuestInfo
}

const API_BASE = (import.meta as any).env?.VITE_API_BASE || "http://127.0.0.1:8000/api"

// shared caches (StrictMode-safe)
type VerifyResult = { ok: true; guest: GuestInfo } | { ok: false; detail: string }
const promiseCache = new Map<string, Promise<VerifyResult>>()
const resultCache = new Map<string, VerifyResult>()

export function Verify() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const tokenParam = (searchParams.get("token") || "").trim()
  const eventId = (searchParams.get("eventId") || "").trim()
  const scanId = (searchParams.get("scan") || "").trim() // ← NEW
  const showData = searchParams.get("showData") === "true" // ← NEW
  console.log("[Verify] API_BASE =", API_BASE, "scanId =", scanId, "showData =", showData)

  const [isLoading, setIsLoading] = useState(true)
  const [guestInfo, setGuestInfo] = useState<GuestInfo | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isCheckedIn, setIsCheckedIn] = useState(false)

  // reset UI when params change
  useEffect(() => {
    setGuestInfo(null)
    setError(null)
    setIsCheckedIn(false)
    setIsLoading(true)
  }, [tokenParam, eventId, scanId])

  // redirect if params missing
  useEffect(() => {
    if (!tokenParam || !eventId) navigate("/kiosk", { replace: true })
  }, [tokenParam, eventId, navigate])

  // verify token – cache key includes scanId so every scan hits backend
  useEffect(() => {
    if (!tokenParam || !eventId) return

    const key = `${eventId}::${tokenParam}::${scanId || "noscan"}`
    let active = true

    async function ensure(): Promise<VerifyResult> {
      if (resultCache.has(key)) {
        console.log("[Verify] using cached result for", key)
        return Promise.resolve(resultCache.get(key)!)
      }
      if (!promiseCache.has(key)) {
        console.log("[Verify] fetching from", `${API_BASE}/guest/debug-decode-guest/`)
        const p = (async (): Promise<VerifyResult> => {
          const res = await fetch(`${API_BASE}/guest/debug-decode-guest/?_=${Date.now()}`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify({ token: tokenParam }),
            keepalive: true,
          })
          let data: any = null
          try {
            data = await res.json()
          } catch {}
          const result: VerifyResult = res.ok
            ? { ok: true, guest: (data as VerifyResponse).guest }
            : { ok: false, detail: data?.detail || "Invalid QR code. Please contact event staff." }
          resultCache.set(key, result)
          return result
        })()
        promiseCache.set(key, p)
      }
      return promiseCache.get(key)!
    }

    ensure()
      .then((r) => {
        if (!active) return
        if (r.ok) {
          setGuestInfo(r.guest)
          setError(null)
        } else {
          setGuestInfo(null)
          setError(r.detail)
        }
      })
      .catch(() => {
        if (active) setError("Network error. Please try again.")
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })

    return () => {
      active = false
    }
  }, [tokenParam, eventId, scanId])

  // auto "checked in" immediately when guest info is loaded
  useEffect(() => {
    if (!guestInfo) return
    setIsCheckedIn(true)
    // Immediately redirect to guest data view after check-in
    setTimeout(() => {
      navigate(`/kiosk/verify?eventId=${encodeURIComponent(eventId)}&token=${encodeURIComponent(tokenParam)}&scan=${encodeURIComponent(scanId)}&showData=true`, { replace: true })
    }, 1000) // Show success message for 1 second
  }, [guestInfo, navigate, eventId, tokenParam, scanId])

  const handleBackToScan = () => {
    navigate(`/kiosk/qr?eventId=${encodeURIComponent(eventId)}&fromVerify=true`)
  }

  // reset UI when params change
  useEffect(() => {
    setGuestInfo(null)
    setError(null)
    setIsCheckedIn(false)
    setIsLoading(true)
  }, [tokenParam, eventId, scanId])

  // Show loading only briefly while waiting for guest info
  if (isLoading && !guestInfo && !error) {
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

  if (isCheckedIn && !showData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <CheckCircle className="h-16 w-16 text-green-600 mb-6 animate-pulse" />
            <h1 className="text-3xl font-bold text-green-900 mb-2">Success! You're checked in</h1>
            <p className="text-green-700 text-center text-lg mb-8">
              Welcome, {guestInfo?.name}! Enjoy the event!
            </p>
            <div className="mt-4 flex items-center justify-center">
              <Loader2 className="h-4 w-4 animate-spin text-gray-600 mr-2" />
              <p className="text-sm text-gray-600">Loading your information...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show guest data page after check-in
  if (guestInfo && showData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-3xl font-bold text-gray-900 mb-2">
              Welcome, {guestInfo.name}!
            </CardTitle>
            <p className="text-lg text-green-600 font-semibold">✓ Successfully Checked In</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-white rounded-lg p-6 border border-gray-200">
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

            {guestInfo.dietaryRestriction && (
              <div className="bg-green-50 rounded-lg p-6 border border-green-200">
                <div className="flex items-center mb-4">
                  <Utensils className="h-6 w-6 text-green-600 mr-3" />
                  <h3 className="text-lg font-semibold text-green-900">Dietary Requirements</h3>
                </div>
                <p className="text-green-800">{guestInfo.dietaryRestriction}</p>
              </div>
            )}

            {guestInfo.accessibilityNeeds && (
              <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                <div className="flex items-center mb-4">
                  <Heart className="h-6 w-6 text-blue-600 mr-3" />
                  <h3 className="text-lg font-semibold text-blue-900">Accessibility Needs</h3>
                </div>
                <p className="text-blue-800">{guestInfo.accessibilityNeeds}</p>
              </div>
            )}

            <div className="pt-4">
              <Button
                onClick={() => navigate(`/kiosk/qr?eventId=${encodeURIComponent(eventId)}`)}
                size="lg"
                className="w-full h-14 text-lg bg-blue-600 hover:bg-blue-700"
              >
                Back to QR Scanner
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }


  return null
}