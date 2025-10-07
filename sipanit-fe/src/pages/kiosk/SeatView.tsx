"use client"

import { useParams, useSearchParams, useNavigate } from "react-router-dom"
import { useSeatView, usePublicEvent } from "../../lib/hooks/kiosk"
import { SeatMap } from "../../components/kiosk/SeatMap"
import { GuestCard } from "../../components/kiosk/GuestCard"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Badge } from "../../components/ui/badge"
import { Loader2, MapPin, Users } from "lucide-react"

export function SeatView() {
  const { eventId } = useParams<{ eventId: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const guestId = searchParams.get("guestId")

  const { data: event } = usePublicEvent(eventId || "")
  const { data: seatView, isLoading, isError } = useSeatView(eventId || "", guestId || undefined)

  const handleBackToScan = () => {
    navigate(`/kiosk/qr?eventId=${eventId}`)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
            <p className="text-lg text-gray-600">Loading seating map...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isError || !seatView) {
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-16">
            <p className="text-xl text-red-600 mb-4">Failed to load seating information</p>
            <p className="text-gray-600">Please try again or contact event staff</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-4 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            {event?.logoUrl && (
              <img src={event.logoUrl || "/placeholder.svg"} alt={`${event.name} logo`} className="h-10" />
            )}
            <div>
              <h1 className="text-xl font-bold text-gray-900">{event?.name || "Event Seating"}</h1>
              <p className="text-sm text-gray-600">Interactive Seating Map</p>
            </div>
          </div>
          <Badge variant="secondary" className="text-sm">
            Kiosk Mode
          </Badge>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Seating Map */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Seating Layout
                  {seatView.seatId && (
                    <Badge variant="default" className="ml-2">
                      Your seat is highlighted
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <SeatMap
                  layout={seatView.layout}
                  highlightSeatId={seatView.seatId}
                  width={800}
                  height={600}
                  allowZoom={true}
                  allowPan={true}
                />
              </CardContent>
            </Card>
          </div>

          {/* Guest Info or Legend */}
          <div className="space-y-6">
            {seatView.guest ? (
              <GuestCard guest={seatView.guest} showBackToScan={event?.requireQr} onBackToScan={handleBackToScan} />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Seating Legend
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 bg-gray-200 border-2 border-gray-400 rounded"></div>
                      <span className="text-sm">Tables</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 bg-white border-2 border-gray-500 rounded-full"></div>
                      <span className="text-sm">Available Seats</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 bg-blue-500 border-2 border-blue-700 rounded-full"></div>
                      <span className="text-sm">Highlighted Seat</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <p className="text-sm text-gray-600">
                      Use mouse wheel to zoom and drag to pan around the seating area.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Additional Info Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Event Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-gray-600">
                  This is a real-time view of the seating arrangement.
                  {event?.requireQr
                    ? " Scan your QR code to see your assigned seat."
                    : " All seating areas are shown for your reference."}
                </p>
                {!event?.requireQr && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                      This is a free-entry event. Seating is available on a first-come, first-served basis.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
