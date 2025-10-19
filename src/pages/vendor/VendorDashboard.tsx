import React from 'react';
import { Store, Package, TrendingUp } from 'lucide-react';

export default function VendorDashboard() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Vendor Dashboard</h1>
          <p className="mt-2 text-gray-600">Manage your services and event collaborations</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Stats Cards */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Orders</p>
                <p className="text-3xl font-bold text-blue-600">8</p>
              </div>
              <div className="bg-blue-100 rounded-full p-3">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-3xl font-bold text-green-600">$24.5k</p>
              </div>
              <div className="bg-green-100 rounded-full p-3">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Services</p>
                <p className="text-3xl font-bold text-purple-600">15</p>
              </div>
              <div className="bg-purple-100 rounded-full p-3">
                <Store className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Welcome Message */}
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <Store className="h-8 w-8 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to Vendor Dashboard</h2>
          <p className="text-gray-600 mb-6">
            This is your vendor workspace. Here you can manage your services, view event invitations, and track your business performance.
          </p>
          <div className="text-sm text-gray-500">
            <p>More features coming soon!</p>
          </div>
        </div>
      </div>
    </div>
  );
}
