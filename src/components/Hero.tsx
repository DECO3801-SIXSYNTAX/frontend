import { Link } from "react-router-dom"
import Button from "@/components/ui/Button"

export function Hero() {
  return (
    <section id="home" className="pt-24 pb-16 lg:pt-32 lg:pb-24">
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
                <Link to="/signin">Login</Link>
              </Button>
            </div>
          </div>

          {/* Right Illustration */}
          <div className="flex justify-center lg:justify-end">
            <div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-violet-500 rounded-2xl shadow-2xl p-8 max-w-md w-full">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-white">
                <div className="space-y-4">
                  <div className="flex items-center justify-center space-x-2 mb-6">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 3.5a1.5 1.5 0 013 0V4a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-.5a1.5 1.5 0 000 3h.5a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-.5a1.5 1.5 0 00-3 0v.5a1 1 0 01-1 1H6a1 1 0 01-1-1v-3a1 1 0 00-1-1h-.5a1.5 1.5 0 010-3H4a1 1 0 001-1V6a1 1 0 011-1h3a1 1 0 001-1v-.5z" />
                      </svg>
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-center">Interactive Floor Plans</h3>
                  <p className="text-white/80 text-center text-sm">Drag & drop seating arrangements with real-time collaboration</p>
                  <div className="grid grid-cols-3 gap-2 mt-6">
                    {[1,2,3,4,5,6].map(i => (
                      <div key={i} className="bg-white/20 rounded-lg h-16 flex items-center justify-center">
                        <div className="w-8 h-8 bg-white/30 rounded-full"></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#F6F7FB] via-[#F6F7FB] to-blue-50/30 -z-10"></div>
    </section>
  )
}
