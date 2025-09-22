import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css"; // Tailwind directives
import SignIn from "./pages/SignIn";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import Dashboard from "./pages/Dashboard";
import EventsList from "./pages/EventsList";
import ActivityLog from "./pages/ActivityLog";
import AppSettings from "./pages/AppSettings";
import EventSettings from "./pages/EventSettings";
import EventConfiguration from "./pages/EventConfiguration";
import Layout from "./components/layout/Layout";
import { DashboardProvider, useDashboard } from "./contexts/DashboardContext";
import { ThemeProvider } from "./contexts/ThemeContext";

// Main app component with state-based navigation
function AppContent() {
  const { currentPage } = useDashboard();
  const path = window.location.pathname;

  // Handle URL-based routing for password reset
  if (path.startsWith('/reset-password/')) {
    return <ResetPasswordPage />;
  }

  // Handle state-based navigation
  switch (currentPage) {
    case 'signin':
      return <SignIn />;
    case 'dashboard':
      return (
        <Layout>
          <Dashboard />
        </Layout>
      );
    case 'events-list':
      return (
        <Layout>
          <EventsList />
        </Layout>
      );
    case 'activity-log':
      return (
        <Layout>
          <ActivityLog />
        </Layout>
      );
    case 'app-settings':
      return <AppSettings />;
    case 'event-settings':
      return <EventSettings />;
    default:
      // Handle dynamic event configuration pages
      if (currentPage.startsWith('event-config-')) {
        const eventId = currentPage.replace('event-config-', '');
        return <EventConfiguration eventId={eventId} />;
      }
      return <SignIn />;
  }
}

function App() {
  return (
    <ThemeProvider>
      <DashboardProvider>
        <AppContent />
      </DashboardProvider>
    </ThemeProvider>
  );
}

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
