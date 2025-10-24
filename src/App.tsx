import { Routes, Route } from "react-router-dom"
import { MarketingLayout } from "./components/layouts/MarketingLayout"
import { DashboardLayout } from "./components/layouts/DashboardLayout"
import { VendorDashboard } from "./pages/vendor/VendorDashboard"
import { EventList } from "./pages/vendor/EventList"
import { SeatingView } from "./pages/vendor/SeatingView"
import { LandingPage } from "./pages/LandingPage"
import { QrScan } from "./pages/kiosk/QrScan"
import { Verify } from "./pages/kiosk/Verify"
import { SeatView } from "./pages/kiosk/SeatView"
import SignIn from "./pages/auth/SignIn"
import SignUp from "./pages/auth/SignUp"
import ResetPasswordPage from "./pages/auth/ResetPasswordPage"
import AdminDashboard from "./pages/admin/AdminDashboard"
import PlannerDashboard from "./pages/planner/PlannerDashboard"

function App() {
  return (
    <Routes>
      <Route path="/" element={<MarketingLayout />}>
        <Route index element={<LandingPage />} />
      </Route>
      <Route path="/auth/sign-in" element={<SignIn />} />
      <Route path="/auth/sign-up" element={<SignUp onBackToSignIn={() => {}} />} />
      <Route path="/auth/reset" element={<ResetPasswordPage />} />
      
      {/* Vendor Dashboard */}
      <Route path="/vendor" element={<DashboardLayout />}>
        <Route index element={<VendorDashboard />} />
        <Route path="events" element={<EventList />} />
        {/* Fix: Both routes for seating view */}
        <Route path="seating" element={<SeatingView />} />  {/* For /vendor/seating */}
        <Route path="seating/:eventId" element={<SeatingView />} />  {/* For /vendor/seating/:eventId */}
      </Route>
      
      {/* Kiosk Routes */}
      <Route path="/kiosk" element={<QrScan />} />
      <Route path="/kiosk/qr" element={<QrScan />} />
      <Route path="/kiosk/verify" element={<Verify />} />
      <Route path="/kiosk/events/:eventId/map" element={<SeatView />} />
      
      {/* Admin & Planner Routes */}
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/planner/dashboard" element={<PlannerDashboard />} />
    </Routes>
  )
}

export default App