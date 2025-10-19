import React from 'react';
import { Calendar, Users, CheckCircle } from 'lucide-react';

export default function PlannerDashboard() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Planner Dashboard</h1>
          <p className="mt-2 text-gray-600">Manage your events and collaborations</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Stats Cards */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Events</p>
                <p className="text-3xl font-bold text-indigo-600">12</p>
              </div>
              <div className="bg-indigo-100 rounded-full p-3">
                <Calendar className="h-6 w-6 text-indigo-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Vendors</p>
                <p className="text-3xl font-bold text-green-600">28</p>
              </div>
              <div className="bg-green-100 rounded-full p-3">
                <Users className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-3xl font-bold text-purple-600">45</p>
              </div>
              <div className="bg-purple-100 rounded-full p-3">
                <CheckCircle className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Welcome Message */}
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="bg-indigo-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <Calendar className="h-8 w-8 text-indigo-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to Planner Dashboard</h2>
          <p className="text-gray-600 mb-6">
            This is your planner workspace. Here you can manage events, collaborate with vendors, and track your event planning progress.
          </p>
          <div className="text-sm text-gray-500">
            <p>More features coming soon!</p>
          </div>
        </div>
      </div>
    </div>
  );
}
