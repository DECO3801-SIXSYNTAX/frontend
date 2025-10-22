import { useEffect, useState } from "react"
import { Calendar, Users, MapPin, TrendingUp, Eye } from "lucide-react"
import { Link } from "react-router-dom"
import { listVendorEvents, type VendorEventCard } from "../../services/vendorApi"

export function VendorDashboard() {
  const [events, setEvents] = useState<VendorEventCard[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadEvents()
  }, [])

  const loadEvents = async () => {
    try {
      setLoading(true)
      const data = await listVendorEvents()
      setEvents(data)
    } catch (err: any) {
      console.error("Error loading events:", err)
      setError(err?.response?.data?.detail || err?.message || "Failed to load events")
    } finally {
      setLoading(false)
    }
  }

  // Calculate stats from real data
  const totalEvents = events.length
  const activeEvents = events.filter(e => e.status === "Active").length
  const totalAttendees = events.reduce((sum, e) => sum + (e.attendees || 0), 0)
  const uniqueVenues = new Set(events.map(e => e.venue).filter(Boolean)).size

  const stats = [
    { 
      name: "Total Events", 
      value: loading ? "..." : totalEvents.toString(), 
      icon: Calendar, 
      change: loading ? "Loading..." : `${totalEvents} assigned to you`,
      color: "bg-blue-50 text-blue-600"
    },
    { 
      name: "Active Events", 
      value: loading ? "..." : activeEvents.toString(), 
      icon: TrendingUp, 
      change: "Currently ongoing",
      color: "bg-green-50 text-green-600"
    },
    { 
      name: "Total Attendees", 
      value: loading ? "..." : totalAttendees.toLocaleString(), 
      icon: Users, 
      change: loading ? "Loading..." : "Across all events",
      color: "bg-purple-50 text-purple-600"
    },
    { 
      name: "Venues", 
      value: loading ? "..." : uniqueVenues.toString(), 
      icon: MapPin, 
      change: loading ? "Loading..." : "Different locations",
      color: "bg-orange-50 text-orange-600"
    },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="text-gray-600">Welcome back! Here's what's happening with your events.</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white p-6 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                <p className="text-sm text-gray-500 mt-1">{stat.change}</p>
              </div>
              <div className={`p-3 rounded-lg ${stat.color}`}>
                <stat.icon className="h-6 w-6" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity / Upcoming Events */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Upcoming Events</h2>
          <Link 
            to="/vendor/events" 
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            View All →
          </Link>
        </div>

        {events.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-400" />
            <p>No events assigned yet.</p>
            <p className="text-sm mt-1">Contact your event planner for access.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {events.slice(0, 5).map((event) => {
              const statusColor = 
                event.status === "Active" ? "bg-green-100 text-green-800" : 
                event.status === "Upcoming" ? "bg-blue-100 text-blue-800" : 
                "bg-gray-100 text-gray-800"
              
              const statusDot = 
                event.status === "Active" ? "bg-green-500" : 
                event.status === "Upcoming" ? "bg-blue-500" : 
                "bg-gray-500"
              
              return (
                <div 
                  key={event.id} 
                  className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-4 flex-1">
                    <div className={`w-2 h-2 ${statusDot} rounded-full`}></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {event.name}
                      </p>
                      <div className="flex items-center space-x-3 mt-1">
                        <p className="text-xs text-gray-500">
                          {event.venue || "No venue"}
                        </p>
                        <span className="text-gray-300">•</span>
                        <p className="text-xs text-gray-500">
                          {event.date ? new Date(event.date).toLocaleDateString() : "No date"}
                        </p>
                        <span className="text-gray-300">•</span>
                        <p className="text-xs text-gray-500">
                          {event.attendees || 0} attendees
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor}`}>
                      {event.status || "Planning"}
                    </span>
                    <Link 
                      to={`/vendor/seating/${event.id}`}
                      className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          to="/vendor/events"
          className="bg-white p-6 rounded-lg border border-gray-200 hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">My Events</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{totalEvents}</p>
            </div>
            <Calendar className="h-8 w-8 text-gray-400 group-hover:text-blue-600 transition-colors" />
          </div>
          <p className="text-sm text-blue-600 mt-4 font-medium group-hover:underline">
            View all events →
          </p>
        </Link>

        <Link
          to="/vendor/seating"
          className="bg-white p-6 rounded-lg border border-gray-200 hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Seating View</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">Active</p>
            </div>
            <Eye className="h-8 w-8 text-gray-400 group-hover:text-blue-600 transition-colors" />
          </div>
          <p className="text-sm text-blue-600 mt-4 font-medium group-hover:underline">
            Open seating view →
          </p>
        </Link>

        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-100">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-medium text-gray-700">Need Help?</p>
              <p className="text-xs text-gray-600 mt-1">Contact support</p>
            </div>
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
              <span className="text-xl">💬</span>
            </div>
          </div>
          <button className="text-sm text-blue-600 font-medium hover:underline">
            Get in touch →
          </button>
        </div>
      </div>
    </div>
  )
}
export default VendorDashboard;