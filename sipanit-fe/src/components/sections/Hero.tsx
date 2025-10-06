import { Link } from "react-router-dom"
import { Button } from "../ui/button"
import { InteractiveSeatingDemo } from "../demo/InteractiveSeatingDemo"

export function Hero() {
  return (
    <section id="home" className="pt-24 pb-16 lg:pt-32 lg:pb-24 relative">
      <div className="max-w-[1200px] mx-auto px-4 md:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Content */}
          <div className="text-center lg:text-left">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
              <span className="text-balance">Simplify Your Event Seating Management</span>
            </h1>

            <p className="text-lg md:text-xl text-gray-600 leading-relaxed mb-8 max-w-2xl mx-auto lg:mx-0">
              For Planners, Vendors, and Guests all in one platform. Create, manage, and optimize your event layouts
              with ease.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button
                asChild
                size="lg"
                className="bg-[#2563EB] hover:bg-[#1d4ed8] text-white px-8 py-3 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Link to="/signup">Get Started</Link>
              </Button>
              <Button
                asChild
                variant="ghost"
                size="lg"
                className="text-[#2563EB] hover:bg-[#2563EB]/10 px-8 py-3 text-lg rounded-xl border border-[#2563EB]/20 hover:border-[#2563EB]/40 transition-all duration-200"
              >
                <Link to="/login">Login</Link>
              </Button>
            </div>
          </div>

          {/* Right Interactive Demo */}
          <div className="flex justify-center lg:justify-end">
            <InteractiveSeatingDemo />
          </div>
        </div>
      </div>

      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#F6F7FB] via-[#F6F7FB] to-blue-50/30 -z-10"></div>
    </section>
  )
}
