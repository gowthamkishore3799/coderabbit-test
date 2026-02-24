function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md ring-3 ring-purple-400">
        <h1 className="text-4xl! font-bold text-gray-800 mb-4">
          React + Tailwind v4
        </h1>
        <p className="text-2xl text-gray-600 mb-6">
          Your app is ready to go! Start editing src/App.jsx to see changes.
        </p>
        <button className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded transition duration-200 ring-3 ring-blue-300 hover:ring-blue-400">
          Get Started
        </button>
      </div>
    </div>
  )
}

export default App
