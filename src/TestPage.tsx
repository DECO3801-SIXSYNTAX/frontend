import React from 'react';

export default function TestPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Test Page</h1>
      <p>If you can see this, the app is working!</p>
      <div className="mt-4 space-y-2">
        <div>
          <a href="/simple-settings" className="text-blue-600 hover:underline">
            Go to Simple Event Settings (Working Version)
          </a>
        </div>
        <div>
          <a href="/test-event-settings" className="text-blue-600 hover:underline">
            Go to Full Event Settings Test Page
          </a>
        </div>
      </div>
    </div>
  );
}
