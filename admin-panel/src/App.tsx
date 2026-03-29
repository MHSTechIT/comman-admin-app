import { Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from './components/Layout'
import { UsersPage } from './pages/UsersPage'
import { UserDetailsPage } from './pages/UserDetailsPage'
import { FoodPage } from './pages/FoodPage'
import { DrinkPage } from './pages/DrinkPage'
import { ReportsPage } from './pages/ReportsPage'
import { CoursesPage } from './pages/CoursesPage'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/users" element={<UsersPage />} />
        <Route path="/users/:userId" element={<UserDetailsPage />} />
        <Route path="/users/:userId/food" element={<FoodPage />} />
        <Route path="/users/:userId/drink" element={<DrinkPage />} />
        <Route path="/users/:userId/reports" element={<ReportsPage />} />
        <Route path="/users/:userId/courses" element={<CoursesPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/users" replace />} />
    </Routes>
  )
}
