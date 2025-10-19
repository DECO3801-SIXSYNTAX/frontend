import { LayoutGrid, Users, Zap, QrCode } from "lucide-react"

const features = [
  {
    icon: LayoutGrid,
    title: "Drag-and-Drop Layout Editor",
    description:
      "Create stunning event layouts with our intuitive drag-and-drop interface. No design experience required.",
    color: "bg-blue-100 text-blue-600",
  },
  {
    icon: Users,
    title: "Guest Seating & Dietary Management",
    description:
      "Manage guest preferences, dietary restrictions, and seating arrangements all in one centralized system.",
    color: "bg-green-100 text-green-600",
  },
  {
    icon: Zap,
    title: "Vendor Real-time Updates",
    description: "Keep vendors informed with real-time updates and seamless communication throughout your event.",
    color: "bg-purple-100 text-purple-600",
  },
  {
    icon: QrCode,
    title: "Guest Kiosk Search & QR Scan",
    description: "Enable guests to find their seats instantly with QR code scanning and interactive kiosk search.",
    color: "bg-orange-100 text-orange-600",
  },
]

export function FeaturesGrid() {
  return (
    <section id="features" className="py-16 lg:py-24 bg-white">
      <div className="max-w-[1200px] mx-auto px-4 md:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            <span className="text-balance">Everything You Need for Perfect Events</span>
          </h2>
          <p className="text-lg md:text-xl text-gray-600 leading-relaxed max-w-3xl mx-auto">
            Streamline your event management with our comprehensive suite of tools designed for modern event
            professionals.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => {
            const IconComponent = feature.icon
            return (
              <div
                key={index}
                className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-gray-200 group"
              >
                <div
                  className={`w-16 h-16 rounded-2xl ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-200`}
                >
                  <IconComponent size={32} />
                </div>

                <h3 className="text-xl font-bold text-gray-900 mb-4 leading-tight">{feature.title}</h3>

                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
