import { Navigate, Route, Routes } from 'react-router-dom'
import { UsersPage } from './pages/UsersPage'
import { UserDetailsPage } from './pages/UserDetailsPage'
import { UserFoodPage } from './pages/UserFoodPage'
import { UserDrinkPage } from './pages/UserDrinkPage'
import { UserReportsPage } from './pages/UserReportsPage'
import { UserCoursesPage } from './pages/UserCoursesPage'
import { AppShell } from './components/layout/AppShell'

function App() {
  return (
    <Routes>
      <Route path="/" element={<AppShell />}>
        <Route index element={<Navigate to="/users" replace />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="users/:id" element={<UserDetailsPage />} />
        <Route path="users/:id/food" element={<UserFoodPage />} />
        <Route path="users/:id/drink" element={<UserDrinkPage />} />
        <Route path="users/:id/reports" element={<UserReportsPage />} />
        <Route path="users/:id/courses" element={<UserCoursesPage />} />
      </Route>
      <Route path="/login" element={<Navigate to="/users" replace />} />
      <Route path="*" element={<Navigate to="/users" replace />} />
    </Routes>
  )
}

export default App
