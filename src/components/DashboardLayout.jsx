import { useState } from 'react'
import { Outlet, NavLink } from 'react-router-dom'
import { Menu, X } from 'lucide-react'

export default function DashboardLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navLinks = (
    <>
      <NavLink
        to="/users"
        onClick={() => setMobileMenuOpen(false)}
        className={({ isActive }) =>
          `flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium ${isActive ? 'bg-accent-purple/20 text-accent-purpleLight' : 'text-dark-muted hover:text-white hover:bg-white/5'}`
        }
      >
        <span>Assessment</span>
      </NavLink>
      <NavLink
        to="/fi-app"
        onClick={() => setMobileMenuOpen(false)}
        className={({ isActive }) =>
          `flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium ${isActive ? 'bg-accent-purple/20 text-accent-purpleLight' : 'text-dark-muted hover:text-white hover:bg-white/5'}`
        }
      >
        <span>Fi App</span>
      </NavLink>
      <NavLink
        to="/chatbot"
        onClick={() => setMobileMenuOpen(false)}
        className={({ isActive }) =>
          `flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium ${isActive ? 'bg-accent-purple/20 text-accent-purpleLight' : 'text-dark-muted hover:text-white hover:bg-white/5'}`
        }
      >
        <span>Chatbot</span>
      </NavLink>
      <NavLink
        to="/api-credits"
        onClick={() => setMobileMenuOpen(false)}
        className={({ isActive }) =>
          `flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium ${isActive ? 'bg-accent-purple/20 text-accent-purpleLight' : 'text-dark-muted hover:text-white hover:bg-white/5'}`
        }
      >
        <span>API Credits</span>
      </NavLink>
    </>
  )

  return (
    <div className="min-h-screen flex bg-dark-bg">
      {/* Hamburger button - mobile only */}
      <button
        onClick={() => setMobileMenuOpen(true)}
        className="md:hidden fixed top-4 left-4 z-40 p-2 rounded-lg bg-dark-card border border-dark-border text-white hover:bg-dark-card/80 transition"
        aria-label="Open menu"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Mobile overlay backdrop */}
      {mobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/60 z-30"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile sidebar drawer - hidden on desktop */}
      <aside
        className={`md:hidden fixed inset-y-0 left-0 z-40 w-56 shrink-0 bg-dark-card border-r border-dark-border flex flex-col transition-transform duration-200 ease-out ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-5 border-b border-dark-border flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-white">Dashboard</h1>
            <p className="text-xs text-dark-muted mt-0.5">All Details</p>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="md:hidden p-2 rounded-lg text-dark-muted hover:text-white hover:bg-white/5"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="p-3 flex-1 space-y-2">{navLinks}</nav>
      </aside>

      {/* Desktop sidebar - hidden on mobile, shown from md up */}
      <aside className="hidden md:flex w-56 shrink-0 bg-dark-card border-r border-dark-border flex-col">
        <div className="p-5 border-b border-dark-border">
          <h1 className="text-lg font-semibold text-white">Dashboard</h1>
          <p className="text-xs text-dark-muted mt-0.5">All Details</p>
        </div>
        <nav className="p-3 flex-1 space-y-2">{navLinks}</nav>
      </aside>

      <main className="flex-1 overflow-auto pt-14 md:pt-0">
        <Outlet />
      </main>
    </div>
  )
}
