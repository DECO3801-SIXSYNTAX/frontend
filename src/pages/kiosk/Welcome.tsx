"use client"

import { useEffect, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { usePublicEvent } from "../../lib/hooks/kiosk"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "../../components/ui/sheet"
import { QrCode, Map, HelpCircle, Loader2 } from "lucide-react"

export function Welcome() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [eventId, setEventId] = useState(searchParams.get("eventId") || "")
  const [showEventInput, setShowEventInput] = useState(!searchParams.get("eventId"))

  const { data: event, isLoading, isError } = usePublicEvent(eventId)

  useEffect(() => {
    if (searchParams.get("eventId") && !eventId) {
      setEventId(searchParams.get("eventId") || "")
    }
  }, [searchParams, eventId])

  const handleEventSubmit = () => {
    if (eventId.trim()) {
      setShowEventInput(false)
      navigate(`/kiosk?eventId=${eventId}`)
    }
  }

  const handlePrimaryAction = () => {
    if (!event) return

    if (event.requireQr) {
      navigate(`/kiosk/qr?eventId=${event.id}`)
    } else {
      navigate(`/kiosk/events/${event.id}/map`)
    }
  }

  if (showEventInput) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Welcome to SiPanit Kiosk</CardTitle>
            <p className="text-gray-600">Enter your event ID to continue</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Input
                placeholder="Event ID (e.g., tech-conf-2024)"
                value={eventId}
                onChange={(e) => setEventId(e.target.value)}
                className="text-lg h-14"
                onKeyPress={(e) => e.key === "Enter" && handleEventSubmit()}
              />
              <div className="text-sm text-gray-500">Try: tech-conf-2024, gala-dinner, or music-festival</div>
            </div>
            <Button onClick={handleEventSubmit} className="w-full h-14 text-lg" disabled={!eventId.trim()}>
              Continue
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mb-4" />
            <p className="text-lg text-gray-600">Loading event...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isError || !event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-12">
            <p className="text-xl text-red-600 mb-4">Event not found</p>
            <Button onClick={() => setShowEventInput(true)} variant="outline">
              Try Another Event
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center pb-8">
          {event.logoUrl && (
            <img src={event.logoUrl || "/placeholder.svg"} alt={`${event.name} logo`} className="h-20 mx-auto mb-6" />
          )}
          <CardTitle className="text-4xl font-bold text-gray-900 mb-2">{event.name}</CardTitle>
          <p className="text-xl text-gray-600">Welcome to our event!</p>
        </CardHeader>

        <CardContent className="space-y-6">
          <Button onClick={handlePrimaryAction} size="lg" className="w-full h-16 text-xl font-semibold">
            {event.requireQr ? (
              <>
                <QrCode className="mr-3 h-6 w-6" />
                Scan QR to Check Your Seat
              </>
            ) : (
              <>
                <Map className="mr-3 h-6 w-6" />
                View Seating Map
              </>
            )}
          </Button>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="lg" className="w-full h-14 text-lg bg-transparent">
                <HelpCircle className="mr-2 h-5 w-5" />
                Need Help?
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[400px]">
              <SheetHeader>
                <SheetTitle>Need Assistance?</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-900 mb-2">Event Staff</h3>
                  <p className="text-blue-800">Look for staff members wearing blue badges around the venue.</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-green-900 mb-2">Help Desk</h3>
                  <p className="text-green-800">Visit the help desk located at the main entrance.</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-purple-900 mb-2">Technical Issues</h3>
                  <p className="text-purple-800">For QR code or seating issues, contact: support@sipanit.com</p>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </CardContent>
      </Card>
    </div>
  )
}
