import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import EventSettingsPage from './pages/planner/EventSettings';

// Test component to verify EventSettings works
function TestEventSettings() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <EventSettingsPage />
      </div>
    </BrowserRouter>
  );
}

export default TestEventSettings;
