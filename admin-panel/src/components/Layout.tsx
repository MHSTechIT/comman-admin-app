import { Outlet, Link } from 'react-router-dom'

export function Layout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/users" className="text-2xl font-bold text-blue-600">
              Admin Panel
            </Link>
            <a href="/" className="text-sm text-gray-500 hover:text-gray-700 transition">
              ← Back to Dashboard
            </a>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  )
}
