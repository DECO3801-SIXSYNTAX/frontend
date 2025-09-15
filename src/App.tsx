import { Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "./components/layout/Sidebar";
import Topbar from "./components/layout/Topbar";
import AdminDashboard from "./pages/admin/AdminDashboard";
import ViewEvents from "./pages/admin/ViewEvents";
import ManageUsers from "./pages/admin/ManageUsers";
import SystemSettings from "./pages/admin/SystemSettings";
import EventOverview from "./pages/admin/EventOverview";
import GuestManagement from "./pages/planner/GuestManagement";
import EventSettingsPage from "@/pages/planner/EventSettings";

export default function App() {
  return (
    <div className="min-h-screen">
      <Topbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          <Routes>
            <Route path="/" element={<Navigate to="/admin" replace />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/events" element={<ViewEvents />} />
            <Route path="/admin/events/:id" element={<EventOverview />} />
            <Route path="/admin/users" element={<ManageUsers />} />
            <Route path="/admin/settings" element={<SystemSettings />} />
            <Route path="*" element={<div>Not Found</div>} />
            <Route path="/planner/events/:id/guests" element={<GuestManagement />} />
            <Route path="/planner/events/:id/settings" element={<EventSettingsPage />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
