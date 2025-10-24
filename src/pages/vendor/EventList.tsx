import { useState, useEffect } from "react"
import { Search, Filter, Calendar, MapPin, Users, Eye } from "lucide-react"
import { Button, Input } from "../../components"
import { Link } from "react-router-dom"
import { listVendorEvents, type VendorEventCard } from "@/services/vendorApi"

export function EventList() {
  const [events, setEvents] = useState<VendorEventCard[]>([])
  const [filteredEvents, setFilteredEvents] = useState<VendorEventCard[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("All Status")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadEvents()
  }, [])

  useEffect(() => {
    filterEvents()
  }, [events, searchTerm, statusFilter])

  const loadEvents = async () => {
    try {
      setLoading(true)
      const data = await listVendorEvents()
      setEvents(data)
      setFilteredEvents(data)
    } catch (err: any) {
      console.error("Error loading events:", err)
      setError(err?.response?.data?.detail || err?.message || "Failed to load events")
    } finally {
      setLoading(false)
    }
  }

  const filterEvents = () => {
    let filtered = events

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter((event) =>
        event.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Status filter
    if (statusFilter !== "All Status") {
      filtered = filtered.filter((event) => event.status === statusFilter)
    }

    setFilteredEvents(filtered)
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-800"
      case "Upcoming":
        return "bg-blue-100 text-blue-800"
      case "Completed":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading events...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Assigned Events</h1>
          <p className="text-gray-600">Manage seating arrangements for your assigned events</p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <span className="flex items-center space-x-1">
            <Calendar className="h-4 w-4" />
            <span>{events.length} Total Events</span>
          </span>
          <span>•</span>
          <span className="text-green-600">
            {events.filter(e => e.status === "Active").length} Active
          </span>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search events by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            label=""
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option>All Status</option>
          <option>Active</option>
          <option>Upcoming</option>
          <option>Completed</option>
        </select>
        <Button variant="outline" size="sm">
          <Filter className="h-4 w-4 mr-2" />
          Filter
        </Button>
      </div>

      {filteredEvents.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No events found</h3>
          <p className="text-gray-600">
            {searchTerm || statusFilter !== "All Status"
              ? "Try adjusting your filters"
              : "No events have been assigned to you yet"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event) => (
            <div
              key={event.id}
              className="bg-white p-6 rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{event.name}</h3>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(event.status)}`}>
                  {event.status || "Planning"}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>
                    {event.date ? new Date(event.date).toLocaleDateString() : "No date set"}
                  </span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin className="h-4 w-4 mr-2" />
                  <span>{event.venue || "No venue"}</span>
                </div>
              </div>

              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center text-sm text-gray-600">
                  <Users className="h-4 w-4 mr-1" />
                  <span>{(event.attendees || 0).toLocaleString()} attendees</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <div className="w-4 h-4 mr-1 bg-gray-200 rounded-full relative">
                    <div
                      className="h-full bg-blue-500 rounded-full"
                      style={{ 
                        width: `${Math.min((event.attendees || 0) / Math.max(event.capacity || 1, 1) * 100, 100)}%` 
                      }}
                    ></div>
                  </div>
                  <span>
                    {Math.round((event.attendees || 0) / Math.max(event.capacity || 1, 1) * 100)}% capacity
                  </span>
                </div>
              </div>

              <div className="flex space-x-2">
                <Link to={`/vendor/seating/${event.id}`} className="flex-1">
                  <Button variant="default" size="sm" className="w-full">
                    <Eye className="h-4 w-4 mr-2" />
                    {event.status === "Completed" ? "View Report" : "Manage Seating"}
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {filteredEvents.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Showing {filteredEvents.length} of {events.length} events
          </p>
        </div>
      )}
    </div>
  )
}