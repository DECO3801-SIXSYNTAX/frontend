import React from "react";
import { Routes, Route, Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import SidebarAdmin from "./components/layout/SidebarAdmin";
import TopbarAdmin from "./components/layout/TopbarAdmin";
import SidebarPlanner from "./components/layout/SidebarPlanner";
import NavbarPlanner from "./components/layout/NavbarPlanner";
import FooterPlanner from "./components/layout/FooterPlanner";
import SidebarVendor from "./components/layout/SidebarVendor";
import TopbarVendor from "./components/layout/TopbarVendor";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";
import AdminDashboard from "./pages/admin/AdminDashboard";
import ViewEvents from "./pages/admin/ViewEvents";
import ManageUsers from "./pages/admin/ManageUsers";
import EventOverview from "./pages/admin/EventOverview";
import PlannerDashboard from "./pages/planner/PlannerDashboard";
import VendorDashboard from "./pages/vendor/VendorDashboard";
import { LandingPage } from "./pages/LandingPage";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
// Planner pages
import Dashboard from "./pages/Dashboard";
import EventsList from "./pages/EventsList";
import EventSettings from "./pages/EventSettings";
import EventConfiguration from "./pages/EventConfiguration";
import EventListForLayout from "./pages/EventListForLayout";
import LayoutEditor from "./pages/LayoutEditor";
import ViewLayout from "./pages/ViewLayout";
import ActivityLog from "./pages/ActivityLog";
import AppSettings from "./pages/AppSettings";
import { auth } from "./config/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useDashboard } from "./contexts/DashboardContext";

function SignUpWrapper() {
  const navigate = useNavigate();
  return <SignUp onBackToSignIn={() => navigate('/signin')} />;
}

function EventConfigurationWrapper() {
  const { eventId } = useParams<{ eventId: string }>();
  if (!eventId) return <Navigate to="/planner/event-settings" replace />;
  return <EventConfiguration eventId={eventId} />;
}

function ViewLayoutWrapper() {
  const { eventId } = useParams<{ eventId: string }>();
  if (!eventId) return <Navigate to="/planner/event-list-for-layout" replace />;
  return <ViewLayout eventId={eventId} />;
}

function Protected({ children }: { children: React.ReactNode }) {
  const [isChecking, setIsChecking] = React.useState(true);
  const [isAuth, setIsAuth] = React.useState(false);

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuth(!!user);
      setIsChecking(false);
    });
    return () => unsubscribe();
  }, []);

  if (isChecking) return <div className="p-6 text-sm text-slate-500">Loading...</div>;
  if (!isAuth) return <Navigate to="/signin" replace />;
  return <>{children}</>;
}

function RoleGuard({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: string[] }) {
  const { currentUser } = useDashboard();
  const [isChecking, setIsChecking] = React.useState(true);

  React.useEffect(() => {
    // Check for JWT token from Django backend
    const token = localStorage.getItem('access_token');
    setIsChecking(false);
  }, []);

  if (isChecking) return <div className="p-6 text-sm text-slate-500">Loading...</div>;
  
  // Check if user is authenticated (has JWT token and currentUser)
  const token = localStorage.getItem('access_token');
  if (!token || !currentUser) {
    console.log('No auth token or user - redirecting to signin');
    return <Navigate to="/signin" replace />;
  }
  
  // Check if user role is allowed
  const userRole = currentUser?.role?.toLowerCase() || '';
  console.log('RoleGuard: User role =', userRole, ', Allowed roles =', allowedRoles);
  
  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    console.log('Role not allowed, redirecting to correct dashboard');
    // Redirect to their appropriate dashboard
    if (userRole === 'admin') return <Navigate to="/admin" replace />;
    if (userRole === 'planner') return <Navigate to="/planner" replace />;
    if (userRole === 'vendor') return <Navigate to="/vendor" replace />;
    return <Navigate to="/signin" replace />;
  }
  
  return <>{children}</>;
}

function AdminOnly({ children }: { children: React.ReactNode }) {
  return <RoleGuard allowedRoles={['admin']}>{children}</RoleGuard>;
}

function PlannerOnly({ children }: { children: React.ReactNode }) {
  return <RoleGuard allowedRoles={['planner']}>{children}</RoleGuard>;
}

function VendorOnly({ children }: { children: React.ReactNode }) {
  return <RoleGuard allowedRoles={['vendor']}>{children}</RoleGuard>;
}

export default function App() {
  const location = useLocation();
  const { currentUser } = useDashboard();
  const [isAuth, setIsAuth] = React.useState(false);
  const [isChecking, setIsChecking] = React.useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);

  React.useEffect(() => {
    // Check for JWT token instead of Firebase
    const token = localStorage.getItem('access_token');
    setIsAuth(!!token && !!currentUser);
    setIsChecking(false);
  }, [currentUser]);

  const isAuthRoute = location.pathname.startsWith('/signin') || location.pathname.startsWith('/signup');
  const isLandingRoute = location.pathname === '/';
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isPlannerRoute = location.pathname.startsWith('/planner');
  const isVendorRoute = location.pathname.startsWith('/vendor');
  
  // Layout editor and view layout should be full screen (no sidebar)
  const isLayoutEditorRoute = location.pathname.includes('/layout-editor/') || location.pathname.includes('/view-layout/');
  
  if (isChecking && !isLandingRoute) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="text-sm text-slate-500">Loading...</div>
    </div>;
  }

  return (
    <div className="min-h-screen">
      {/* Landing page layout */}
      {isLandingRoute && (
        <>
          <Navbar />
          <Routes>
            <Route path="/" element={<LandingPage />} />
          </Routes>
          <Footer />
        </>
      )}
      
      {/* Auth pages layout (no nav) */}
      {isAuthRoute && (
        <Routes>
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUpWrapper />} />
        </Routes>
      )}
      
      {/* Layout Editor & View Layout - Full screen (no sidebar) */}
      {isLayoutEditorRoute && isPlannerRoute && (
        <div className="min-h-screen bg-gray-50">
          <Routes>
            <Route path="/planner/layout-editor/:eventId" element={<PlannerOnly><LayoutEditor /></PlannerOnly>} />
            <Route path="/planner/view-layout/:eventId" element={<PlannerOnly><ViewLayoutWrapper /></PlannerOnly>} />
          </Routes>
        </div>
      )}
      
      {/* Planner layout (special layout with Navbar, Sidebar, Footer) */}
      {isPlannerRoute && !isLayoutEditorRoute && (
        <div className="min-h-screen bg-gray-50 flex">
          <SidebarPlanner isCollapsed={sidebarCollapsed} setIsCollapsed={setSidebarCollapsed} />
          <div className="flex-1 flex flex-col">
            <NavbarPlanner />
            <main className="flex-1 p-6 overflow-auto">
              <Routes>
                <Route path="/planner" element={<PlannerOnly><Dashboard /></PlannerOnly>} />
                <Route path="/planner/dashboard" element={<PlannerOnly><Dashboard /></PlannerOnly>} />
                <Route path="/planner/events" element={<PlannerOnly><EventsList /></PlannerOnly>} />
                <Route path="/planner/event-settings" element={<PlannerOnly><EventSettings /></PlannerOnly>} />
                <Route path="/planner/event-config/:eventId" element={<PlannerOnly><EventConfigurationWrapper /></PlannerOnly>} />
                <Route path="/planner/event-list-for-layout" element={<PlannerOnly><EventListForLayout /></PlannerOnly>} />
                <Route path="/planner/activity-log" element={<PlannerOnly><ActivityLog /></PlannerOnly>} />
                <Route path="/planner/settings" element={<PlannerOnly><AppSettings /></PlannerOnly>} />
                <Route path="/planner/*" element={<PlannerOnly><Dashboard /></PlannerOnly>} />
              </Routes>
            </main>
            <FooterPlanner />
          </div>
        </div>
      )}
      
      {/* Admin & Vendor layout (sidebar + topbar) */}
      {(isAdminRoute || isVendorRoute) && (
        <>
          {isAdminRoute && <TopbarAdmin />}
          {isVendorRoute && <TopbarVendor />}
          <div className="flex">
            {isAdminRoute && <SidebarAdmin isCollapsed={sidebarCollapsed} setIsCollapsed={setSidebarCollapsed} />}
            {isVendorRoute && <SidebarVendor isCollapsed={sidebarCollapsed} setIsCollapsed={setSidebarCollapsed} />}
            <main className="flex-1 p-6">
              <Routes>
                {/* Legacy route redirect */}
                <Route path="/login" element={<Navigate to="/signin" replace />} />
                
                {/* Admin Routes */}
                <Route path="/admin" element={<AdminOnly><AdminDashboard /></AdminOnly>} />
                <Route path="/admin/events" element={<AdminOnly><ViewEvents /></AdminOnly>} />
                <Route path="/admin/events/:slug" element={<AdminOnly><EventOverview /></AdminOnly>} />
                <Route path="/admin/users" element={<AdminOnly><ManageUsers /></AdminOnly>} />
                
                {/* Vendor Routes */}
                <Route path="/vendor" element={<VendorOnly><VendorDashboard /></VendorOnly>} />
                
                <Route path="*" element={<div>Not Found</div>} />
              </Routes>
            </main>
          </div>
        </>
      )}
    </div>
  );
}
