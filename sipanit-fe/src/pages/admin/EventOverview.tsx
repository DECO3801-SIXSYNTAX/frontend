import React from "react";
import { useNavigate, useParams } from "react-router-dom";

export default function EventOverview() {
  const navigate = useNavigate();
  const { id } = useParams();

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Event Overview</h1>
          <button
            onClick={() => navigate('/admin/events')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Back to Events
          </button>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600">Event overview for ID: {id} - Coming soon!</p>
        </div>
      </div>
    </div>
  );
}
