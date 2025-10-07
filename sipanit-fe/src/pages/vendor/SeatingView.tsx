import { useState, useEffect } from "react"
import { useParams } from "react-router-dom"
import { Search, Bell, Utensils, Accessibility } from "lucide-react"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Stage, Layer, Rect, Circle, Text } from "react-konva"

const mockEventData = {
  1: { name: "Tech Conference 2024", venue: "Convention Center" },
  2: { name: "Annual Gala Dinner", venue: "Grand Ballroom" },
  3: { name: "Product Launch Event", venue: "Innovation Hub" },
  4: { name: "Music Festival 2024", venue: "Golden Gate Park" },
  5: { name: "Business Summit", venue: "Moscone Center" },
  6: { name: "Wedding Reception", venue: "The Ritz-Carlton" },
}

const mockGuests = [
  { id: 1, name: "John Doe", table: "Table 1", dietary: ["Vegetarian"], accessibility: ["Wheelchair"] },
  { id: 2, name: "Jane Smith", table: "Table 2", dietary: ["Gluten-Free"], accessibility: [] },
  { id: 3, name: "Mike Johnson", table: "Table 1", dietary: ["Vegan"], accessibility: [] },
  { id: 4, name: "Sarah Wilson", table: "VIP 1", dietary: ["Kosher"], accessibility: ["Hearing Aid"] },
]

const notifications = [
  { id: 1, message: "Guest John Doe moved to Table 3", time: "2 min ago", type: "update" },
  { id: 2, message: "New dietary requirement added for Table 5", time: "5 min ago", type: "dietary" },
  { id: 3, message: "Accessibility request updated", time: "10 min ago", type: "accessibility" },
]

export function SeatingView() {
  const { eventId } = useParams()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedGuest, setSelectedGuest] = useState(null)
  const [stageSize, setStageSize] = useState({ width: 800, height: 600 })

  const eventData = mockEventData[eventId as keyof typeof mockEventData] || {
    name: "Unknown Event",
    venue: "Unknown Venue",
  }

  useEffect(() => {
    const handleResize = () => {
      const container = document.getElementById("seating-container")
      if (container) {
        setStageSize({
          width: container.offsetWidth,
          height: 600,
        })
      }
    }

    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  const filteredGuests = mockGuests.filter(
    (guest) =>
      guest.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      guest.dietary.some((diet) => diet.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{eventData.name}</h1>
          <p className="text-gray-600">Seating View • {eventData.venue}</p>
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

          <div id="seating-container" className="border border-gray-200 rounded-lg overflow-hidden">
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
                  )),
                )}

                {/* Round Tables */}
                <Circle x={150} y={150} radius={40} fill="#22c55e" stroke="#16a34a" strokeWidth={2} />
                <Text x={135} y={145} text="Table 1" fontSize={12} fill="white" />

                <Circle x={300} y={150} radius={40} fill="#6b7280" stroke="#4b5563" strokeWidth={2} />
                <Text x={285} y={145} text="Table 2" fontSize={12} fill="white" />

                <Circle x={450} y={150} radius={40} fill="#22c55e" stroke="#16a34a" strokeWidth={2} />
                <Text x={435} y={145} text="Table 3" fontSize={12} fill="white" />

                {/* Rectangular Tables */}
                <Rect x={100} y={300} width={100} height={60} fill="#6b7280" stroke="#4b5563" strokeWidth={2} rx={5} />
                <Text x={135} y={325} text="Table 4" fontSize={12} fill="white" />

                <Rect x={250} y={300} width={100} height={60} fill="#22c55e" stroke="#16a34a" strokeWidth={2} rx={5} />
                <Text x={285} y={325} text="Table 5" fontSize={12} fill="white" />

                {/* VIP Tables */}
                <Rect x={400} y={300} width={120} height={80} fill="#3b82f6" stroke="#2563eb" strokeWidth={2} rx={10} />
                <Text x={445} y={335} text="VIP 1" fontSize={14} fill="white" />

                <Rect x={550} y={300} width={120} height={80} fill="#3b82f6" stroke="#2563eb" strokeWidth={2} rx={10} />
                <Text x={595} y={335} text="VIP 2" fontSize={14} fill="white" />

                {/* Stage */}
                <Rect x={200} y={50} width={200} height={40} fill="#1f2937" stroke="#111827" strokeWidth={2} rx={5} />
                <Text x={285} y={65} text="STAGE" fontSize={16} fill="white" />
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
                  <p className="font-medium text-sm">{guest.name}</p>
                  <p className="text-xs text-gray-500">{guest.table}</p>
                  <div className="flex items-center space-x-1 mt-1">
                    {guest.dietary.length > 0 && (
                      <div className="flex items-center">
                        <Utensils className="h-3 w-3 text-orange-500 mr-1" />
                        <span className="text-xs text-orange-600">{guest.dietary.join(", ")}</span>
                      </div>
                    )}
                    {guest.accessibility.length > 0 && (
                      <div className="flex items-center">
                        <Accessibility className="h-3 w-3 text-blue-500 mr-1" />
                        <span className="text-xs text-blue-600">{guest.accessibility.join(", ")}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Guest Details */}
          {selectedGuest && (
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Guest Details</h3>
              <div className="space-y-2">
                <p className="font-medium">{selectedGuest.name}</p>
                <p className="text-sm text-gray-600">Assigned to: {selectedGuest.table}</p>
                {selectedGuest.dietary.length > 0 && (
                  <div className="flex items-center space-x-1">
                    <Utensils className="h-4 w-4 text-orange-500" />
                    <span className="text-sm">Dietary: {selectedGuest.dietary.join(", ")}</span>
                  </div>
                )}
                {selectedGuest.accessibility.length > 0 && (
                  <div className="flex items-center space-x-1">
                    <Accessibility className="h-4 w-4 text-blue-500" />
                    <span className="text-sm">Accessibility: {selectedGuest.accessibility.join(", ")}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Notifications */}
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Live Updates</h3>
            <div className="space-y-3">
              {notifications.map((notification) => (
                <div key={notification.id} className="p-2 bg-gray-50 rounded text-sm">
                  <p className="text-gray-900">{notification.message}</p>
                  <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
