import { NavLink, Outlet } from 'react-router-dom'

export function AppShell() {
  return (
    <div className="app-root">
      <aside className="app-sidebar">
        <div className="app-sidebar-header">
          <h1>Admin Panel</h1>
          <p>Dashboard</p>
        </div>
        <nav className="app-nav">
          <NavLink
            to="/users"
            className={({ isActive }) =>
              `nav-item ${isActive ? 'nav-item-active' : ''}`
            }
          >
            Users
          </NavLink>
        </nav>
      </aside>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  )
}

