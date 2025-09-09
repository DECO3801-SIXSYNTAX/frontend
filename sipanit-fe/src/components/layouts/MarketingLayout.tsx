import { Outlet } from "react-router-dom"
import { Navbar } from "../../../components/Navbar"
import { Footer } from "../../../components/Footer"

export function MarketingLayout() {
  return (
    <div className="min-h-screen bg-[#F6F7FB]">
      <Navbar />
      <main>
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
