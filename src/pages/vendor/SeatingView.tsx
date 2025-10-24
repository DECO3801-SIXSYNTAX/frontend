import { useState, useEffect, useMemo } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import { Search, Bell, ArrowLeft } from "lucide-react"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Stage, Layer, Rect, Circle, Text } from "react-konva"
import {
  getVendorEvent,
  getVendorLayout,
  getVendorGuests,   // ✅ use your API
  listVendorEvents,
  type FirestoreEvent,
  type VendorLayout,
  type Guest,
} from "@/services/vendorApi"

export default function SeatingView() {
  const params = useParams<{ eventId?: string }>()
  const navigate = useNavigate()
  const [eventId, setEventId] = useState<string | undefined>(params.eventId)

  const [event, setEvent] = useState<FirestoreEvent | null>(null)
  const [layout, setLayout] = useState<VendorLayout | null>(null)

  // keep raw API guests; we’ll derive seat info below
  const [apiGuests, setApiGuests] = useState<Guest[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null)
  const [stageSize, setStageSize] = useState({ width: 800, height: 600 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // If no eventId in URL, fetch first event and redirect
  useEffect(() => {
    const loadFirstEvent = async () => {
      if (eventId) return
      try {
        setLoading(true)
        const events = await listVendorEvents()
        if (events.length > 0) {
          const firstEventId = events[0].id
          setEventId(firstEventId)
          navigate(`/vendor/seating/${firstEventId}`, { replace: true })
        } else {
          setError("No events assigned to your vendor account.")
          setLoading(false)
        }
      } catch (err: any) {
        console.error("Error loading first event:", err)
        setError(err?.response?.data?.detail || err?.message || "Failed to load events")
        setLoading(false)
      }
    }
    loadFirstEvent()
  }, [eventId, navigate])

  // Load event + layout + guests from your API
  useEffect(() => {
    if (!eventId) return;

    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);

      try {
        // event + layout fetch: if either fails, we show the error box (as before)
        const [eventData, layoutData] = await Promise.all([
          getVendorEvent(eventId),
          getVendorLayout(eventId),
        ]);
        if (cancelled) return;
        setEvent(eventData);
        setLayout(layoutData);
      } catch (err: any) {
        if (cancelled) return;
        console.error("Error loading event/layout:", err);
        setError(err?.response?.data?.detail || err?.message || "Failed to load event data");
        setLoading(false);
        return; // bail; nothing else to load
      }

      // guests fetch: DO NOT fail the whole page — tolerate 404 and just show 0 guests
      try {
        const guestsResp = await getVendorGuests(eventId, { limit: 500 });
        if (cancelled) return;
        const items = Array.isArray(guestsResp)
          ? (guestsResp as any)
          : (guestsResp?.items ?? []);
        setApiGuests(items);
      } catch (err: any) {
        if (cancelled) return;
        console.warn("Guests fetch failed; continuing without guests:", err?.response?.status || err);
        setApiGuests([]); // empty list – sidebar will say “No guests found”
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [eventId]);


  // Join: add seatId/seatName to each guest by scanning layout.elements[].assignedGuests
  const guests = useMemo(() => {
    if (!layout) return apiGuests
    const byGuest = new Map<string, { seatId: string; seatName: string }[]>()
    for (const el of layout.elements) {
      const ids = el.assignedGuests || []
      for (const gid of ids) {
        const list = byGuest.get(gid) || []
        list.push({ seatId: el.id, seatName: el.name || el.type || el.id })
        byGuest.set(gid, list)
      }
    }
    return apiGuests.map((g) => {
      const seats = byGuest.get(g.id) || []
      const first = seats[0]
      return {
        ...g,
        seatId: first?.seatId,
        seatName: first?.seatName,
      } as Guest & { seatId?: string; seatName?: string }
    })
  }, [apiGuests, layout])

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const container = document.getElementById("seating-container")
      if (container) setStageSize({ width: container.offsetWidth, height: 600 })
    }
    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  const filteredGuests = guests.filter(
    (guest) =>
      guest.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      guest.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      guest.tags?.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading seating view...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Link to="/vendor/events">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Events
            </Button>
          </Link>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    )
  }

  if (!event || !layout) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-gray-600">No event data available</p>
          <Link to="/vendor/events" className="text-blue-600 hover:underline mt-2 inline-block">
            Go to Events
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link to="/vendor/events">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{event.name}</h1>
            <p className="text-gray-600">Seating View • {event.venue || event.address || "Unknown Venue"}</p>
          </div>
        </div>
        <Button variant="outline" size="sm">
          <Bell className="h-4 w-4 mr-2" />
          Auto-refresh: ON
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Seating Map */}
        <div className="lg:col-span-3 bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Interactive Seating Map</h2>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>Occupied</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                <span>Available</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span>VIP</span>
              </div>
            </div>
          </div>

          <div id="seating-container" className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
            <Stage width={stageSize.width} height={stageSize.height}>
              <Layer>
                {/* Grid background */}
                {Array.from({ length: Math.ceil(stageSize.width / 50) }).map((_, i) =>
                  Array.from({ length: Math.ceil(stageSize.height / 50) }).map((_, j) => (
                    <Rect
                      key={`grid-${i}-${j}`}
                      x={i * 50}
                      y={j * 50}
                      width={50}
                      height={50}
                      stroke="#f0f0f0"
                      strokeWidth={0.5}
                    />
                  ))
                )}

                {/* Render layout elements */}
                {layout.elements.map((element) => {
                  const hasGuests = (element.assignedGuests?.length || 0) > 0
                  const fillColor = hasGuests ? "#22c55e" : "#6b7280"
                  const isVip = element.type?.toLowerCase().includes("vip")
                  const vipColor = "#3b82f6"

                  if (element.config?.shape === "circle" || element.type === "round-table") {
                    return (
                      <Circle
                        key={element.id}
                        x={element.x + element.width / 2}
                        y={element.y + element.height / 2}
                        radius={element.radius || element.width / 2}
                        fill={isVip ? vipColor : fillColor}
                        stroke={isVip ? "#2563eb" : "#4b5563"}
                        strokeWidth={2}
                      />
                    )
                  } else {
                    return (
                      <Rect
                        key={element.id}
                        x={element.x}
                        y={element.y}
                        width={element.width}
                        height={element.height}
                        fill={isVip ? vipColor : fillColor}
                        stroke={isVip ? "#2563eb" : "#4b5563"}
                        strokeWidth={2}
                        cornerRadius={8}
                      />
                    )
                  }
                })}

                {/* Element labels */}
                {layout.elements.map((element) => (
                  <Text
                    key={`text-${element.id}`}
                    x={element.x}
                    y={element.y + element.height / 2 - 6}
                    width={element.width}
                    text={element.name || element.type}
                    fontSize={12}
                    fontFamily="Arial"
                    fill="white"
                    align="center"
                  />
                ))}
              </Layer>
            </Stage>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Guest Search */}
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Guest Search</h3>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                label=""
                placeholder="Search guests..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {filteredGuests.map((guest) => (
                <div
                  key={guest.id}
                  className="p-2 border border-gray-200 rounded cursor-pointer hover:bg-gray-50"
                  onClick={() => setSelectedGuest(guest)}
                >
                  <p className="font-medium text-sm">{guest.name || "No name"}</p>
                  <p className="text-xs text-gray-500">{guest.email || "No email"}</p>

                  {/* Seat info provided by our join */}
                  {("seatName" in guest) && (guest as any).seatName && (
                    <p className="text-xs text-blue-600 mt-1">Seat: {(guest as any).seatName}</p>
                  )}

                  {guest.tags && guest.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {guest.tags.map((tag, idx) => (
                        <span key={idx} className="text-xs bg-blue-100 text-blue-600 px-1 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {filteredGuests.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">No guests found</p>
              )}
            </div>
          </div>

          {/* Guest Details */}
          {selectedGuest && (
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Guest Details</h3>
              <div className="space-y-2">
                <p className="font-medium">{selectedGuest.name || "No name"}</p>
                <p className="text-sm text-gray-600">{selectedGuest.email || "No email"}</p>
                {selectedGuest.phone && <p className="text-sm text-gray-600">{selectedGuest.phone}</p>}
                {("seatId" in selectedGuest) && (selectedGuest as any).seatId && (
                  <p className="text-sm text-gray-600">Seat: {(selectedGuest as any).seatId}</p>
                )}
                {selectedGuest.tags && selectedGuest.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {selectedGuest.tags.map((tag, idx) => (
                      <span key={idx} className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Quick Stats */}
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Quick Stats</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Guests</span>
                <span className="font-medium">{guests.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Elements</span>
                <span className="font-medium">{layout.elements.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Assigned Seats</span>
                <span className="font-medium">
                  {layout.elements.reduce((sum, el) => sum + (el.assignedGuests?.length || 0), 0)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export { SeatingView }
