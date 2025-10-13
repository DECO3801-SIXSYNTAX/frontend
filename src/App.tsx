import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Sidebar from "./components/layout/Sidebar";
import Topbar from "./components/layout/Topbar";
import AdminDashboard from "./pages/admin/AdminDashboard";
import ViewEvents from "./pages/admin/ViewEvents";
import ManageUsers from "./pages/admin/ManageUsers";
import EventOverview from "./pages/admin/EventOverview";
import GuestManagement from "./pages/planner/GuestManagement";
import EventSettingsPage from "@/pages/planner/EventSettings";
import Login from "@/pages/auth/Login";
import { isAuthenticated, AUTH_ENABLED } from "@/lib/auth";

function Protected({ children }: { children: React.ReactNode }) {
  if (AUTH_ENABLED && !isAuthenticated()) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AdminOnly({ children }: { children: React.ReactNode }) {
  if (AUTH_ENABLED && !isAuthenticated()) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  const location = useLocation();
  const isLoginRoute = location.pathname.startsWith('/login');
  return (
    <div className="min-h-screen">
      {!isLoginRoute && <Topbar />}
      <div className="flex">
        {!isLoginRoute && <Sidebar />}
        <main className="flex-1 p-6">
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/admin" element={<AdminOnly><AdminDashboard /></AdminOnly>} />
            <Route path="/admin/events" element={<AdminOnly><ViewEvents /></AdminOnly>} />
            <Route path="/admin/events/:slug" element={<AdminOnly><EventOverview /></AdminOnly>} />
            <Route path="/admin/users" element={<AdminOnly><ManageUsers /></AdminOnly>} />
            <Route path="*" element={<div>Not Found</div>} />
            <Route path="/planner/events/:slug/guests" element={<Protected><GuestManagement /></Protected>} />
            <Route path="/planner/events/:slug/settings" element={<Protected><EventSettingsPage /></Protected>} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
