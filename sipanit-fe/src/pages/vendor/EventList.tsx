import { useState } from "react"
import { Search, Filter, Calendar, MapPin, Users, Eye } from "lucide-react"
import { Button, Input } from "../../components"
import { Link } from "react-router-dom"

const events = [
  {
    id: 1,
    name: "Tech Conference 2025",
    date: "March 15, 2025",
    time: "9:00 AM",
    venue: "Convention Center, San Francisco",
    status: "Active",
    attendees: 2500,
    seated: 85,
    statusColor: "bg-green-100 text-green-800",
  },
  {
    id: 2,
    name: "Annual Gala Dinner",
    date: "March 22, 2025",
    time: "7:00 PM",
    venue: "Grand Ballroom, Marriott Hotel",
    status: "Upcoming",
    attendees: 800,
    seated: 45,
    statusColor: "bg-blue-100 text-blue-800",
  },
  {
    id: 3,
    name: "Product Launch Event",
    date: "March 8, 2025",
    time: "2:00 PM",
    venue: "Innovation Hub, Palo Alto",
    status: "Completed",
    attendees: 1200,
    seated: 100,
    statusColor: "bg-gray-100 text-gray-800",
  },
  {
    id: 4,
    name: "Music Festival 2025",
    date: "April 5, 2025",
    time: "6:00 PM",
    venue: "Golden Gate Park, San Francisco",
    status: "Active",
    attendees: 15000,
    seated: 92,
    statusColor: "bg-green-100 text-green-800",
  },
  {
    id: 5,
    name: "Business Summit",
    date: "April 12, 2025",
    time: "8:00 AM",
    venue: "Moscone Center, San Francisco",
    status: "Upcoming",
    attendees: 3200,
    seated: 60,
    statusColor: "bg-blue-100 text-blue-800",
  },
  {
    id: 6,
    name: "Wedding Reception",
    date: "March 30, 2025",
    time: "5:00 PM",
    venue: "The Ritz-Carlton, Half Moon Bay",
    status: "Upcoming",
    attendees: 150,
    seated: 30,
    statusColor: "bg-blue-100 text-blue-800",
  },
]

export function EventList() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("All Status")

  const filteredEvents = events.filter((event) => {
    const matchesSearch = event.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "All Status" || event.status === statusFilter
    return matchesSearch && matchesStatus
  })

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
            <span>12 Total Events</span>
          </span>
          <span>•</span>
          <span className="text-green-600">8 Active</span>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search events by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEvents.map((event) => (
          <div
            key={event.id}
            className="bg-white p-6 rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{event.name}</h3>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${event.statusColor}`}>{event.status}</span>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center text-sm text-gray-600">
                <Calendar className="h-4 w-4 mr-2" />
                <span>
                  {event.date} • {event.time}
                </span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <MapPin className="h-4 w-4 mr-2" />
                <span>{event.venue}</span>
              </div>
            </div>

            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center text-sm text-gray-600">
                <Users className="h-4 w-4 mr-1" />
                <span>{event.attendees.toLocaleString()} attendees</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <div className="w-4 h-4 mr-1 bg-gray-200 rounded-full relative">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: `${event.seated}%` }}></div>
                </div>
                <span>{event.seated}% seated</span>
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

      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">Showing 1-6 of 12 events</p>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" disabled>
            Previous
          </Button>
          <Button variant="default" size="sm">
            1
          </Button>
          <Button variant="outline" size="sm">
            2
          </Button>
          <Button variant="outline" size="sm">
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
