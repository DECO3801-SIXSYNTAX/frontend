import { Routes, Route } from "react-router-dom"
import { MarketingLayout } from "./components/layouts/MarketingLayout"
import { DashboardLayout } from "./components/layouts/DashboardLayout"
import { VendorDashboard } from "./pages/vendor/VendorDashboard"
import { EventList } from "./pages/vendor/EventList"
import { SeatingView } from "./pages/vendor/SeatingView"
import { LandingPage } from "./pages/LandingPage"
import { Welcome } from "./pages/kiosk/Welcome"
import { QrScan } from "./pages/kiosk/QrScan"
import { Verify } from "./pages/kiosk/Verify"
import { SeatView } from "./pages/kiosk/SeatView"

function App() {
  return (
    <Routes>
      <Route path="/" element={<MarketingLayout />}>
        <Route index element={<LandingPage />} />
      </Route>
      <Route path="/vendor" element={<DashboardLayout />}>
        <Route index element={<VendorDashboard />} />
        <Route path="events" element={<EventList />} />
        <Route path="seating/:eventId" element={<SeatingView />} />
      </Route>
      <Route path="/kiosk" element={<Welcome />} />
      <Route path="/kiosk/qr" element={<QrScan />} />
      <Route path="/kiosk/verify" element={<Verify />} />
      <Route path="/kiosk/events/:eventId/map" element={<SeatView />} />
    </Routes>
  )
}

export default App
