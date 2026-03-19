import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { Layout } from './components/Layout'
import { LoginPage } from './pages/LoginPage'
import { UsersPage } from './pages/UsersPage'
import { UserDetailsPage } from './pages/UserDetailsPage'
import { FoodPage } from './pages/FoodPage'
import { DrinkPage } from './pages/DrinkPage'
import { ReportsPage } from './pages/ReportsPage'
import { CoursesPage } from './pages/CoursesPage'

function ProtectedRoute({ element }: { element: React.ReactNode }) {
  const { session, loading } = useAuth()

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  if (!session) {
    return <Navigate to="/login" replace />
  }

  return element as React.ReactElement
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <ProtectedRoute
            element={<Layout />}
          />
        }
      >
        <Route path="/users" element={<UsersPage />} />
        <Route path="/users/:userId" element={<UserDetailsPage />} />
        <Route path="/users/:userId/food" element={<FoodPage />} />
        <Route path="/users/:userId/drink" element={<DrinkPage />} />
        <Route path="/users/:userId/reports" element={<ReportsPage />} />
        <Route path="/users/:userId/courses" element={<CoursesPage />} />
      </Route>
      <Route path="/" element={<Navigate to="/users" replace />} />
    </Routes>
  )
}
