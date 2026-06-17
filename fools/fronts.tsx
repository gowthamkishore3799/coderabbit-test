import React from 'react';

/**
 * Root application component that renders a centered card layout
 * with a heading and description, styled with Tailwind CSS.
 *
 * @returns The rendered application layout.
 */
export default function App() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="p-8 bg-white rounded-2xl shadow-lg">
        <h1 className="text-3xl! font-bold text-blue-600 mb-4">Hello, Tailwind + TypeScript!</h1>
        <p className="text-gray-700">This is a sample component styled with Tailwind CSS and written in TypeScript.</p>
      </div>
    </div>
  );
}
