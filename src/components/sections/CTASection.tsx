import { Link } from "react-router-dom"
import { Button } from "../ui/button"

export function CTASection() {
  return (
    <section className="py-16 lg:py-24 bg-gradient-to-r from-[#2563EB] to-[#7C3AED] text-white">
      <div className="max-w-[1200px] mx-auto px-4 md:px-6 lg:px-8 text-center">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
          <span className="text-balance">Ready to organize your event seamlessly?</span>
        </h2>

        <p className="text-lg md:text-xl leading-relaxed mb-8 max-w-2xl mx-auto opacity-90">
          Join thousands of event professionals who trust EventSeater to deliver exceptional experiences.
        </p>

        <Button
          asChild
          size="lg"
          className="bg-white text-gray-900 hover:bg-gray-100 px-8 py-4 text-lg font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
        >
          <Link to="/signup">Sign Up Free</Link>
        </Button>
      </div>
    </section>
  )
}
