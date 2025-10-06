import { Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "./components/layout/Sidebar";
import Topbar from "./components/layout/Topbar";
import AdminDashboard from "./pages/admin/AdminDashboard";
import ViewEvents from "./pages/admin/ViewEvents";
import ManageUsers from "./pages/admin/ManageUsers";
import EventOverview from "./pages/admin/EventOverview";
import GuestManagement from "./pages/planner/GuestManagement";
import EventSettingsPage from "./pages/planner/EventSettings";
import SimpleEventSettings from "./pages/planner/SimpleEventSettings";
import LoginPage from "./pages/LoginPage";
import TestPage from "./TestPage";
import { useAuth } from "./contexts/AuthContext";

export default function App() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Topbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          <Routes>
            <Route path="/login" element={<Navigate to="/admin" replace />} />
            <Route path="/" element={<Navigate to="/admin" replace />} />
            <Route path="/test" element={<TestPage />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/events" element={<ViewEvents />} />
            <Route path="/admin/events/:id" element={<EventOverview />} />
            <Route path="/admin/users" element={<ManageUsers />} />
            <Route path="/planner/events/:id/guests" element={<GuestManagement />} />
            <Route path="/planner/events/:id/settings" element={<EventSettingsPage />} />
            {/* Test route for direct access */}
            <Route path="/test-event-settings" element={<EventSettingsPage />} />
            <Route path="/simple-settings" element={<SimpleEventSettings />} />
            <Route path="*" element={<div>Not Found</div>} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
