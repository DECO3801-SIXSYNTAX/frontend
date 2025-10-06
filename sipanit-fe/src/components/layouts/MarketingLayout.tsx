import { Outlet } from "react-router-dom"
import { Navbar, Footer } from "../"

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
