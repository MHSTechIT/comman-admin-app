import { Routes, Route, Navigate } from 'react-router-dom'
import DashboardLayout from './components/DashboardLayout'
import UsersPage from './pages/UsersPage'
import FiAppPage from './pages/FiAppPage'
import FiAppDetailsPage from './pages/FiAppDetailsPage'
import FiAppFoodPage from './pages/FiAppFoodPage'
import FiAppDrinkPage from './pages/FiAppDrinkPage'
import FiAppSleepPage from './pages/FiAppSleepPage'
import FiAppReportPage from './pages/FiAppReportPage'
import FiAppCoursePage from './pages/FiAppCoursePage'
import ChatbotPage from './pages/ChatbotPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<DashboardLayout />}>
        <Route index element={<Navigate to="/users" replace />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="fi-app" element={<FiAppPage />} />
        <Route path="fi-app/:id" element={<FiAppDetailsPage />} />
        <Route path="fi-app/:id/food" element={<FiAppFoodPage />} />
        <Route path="fi-app/:id/drink" element={<FiAppDrinkPage />} />
        <Route path="fi-app/:id/sleep" element={<FiAppSleepPage />} />
        <Route path="fi-app/:id/report" element={<FiAppReportPage />} />
        <Route path="fi-app/:id/course" element={<FiAppCoursePage />} />
        <Route path="chatbot" element={<ChatbotPage />} />
      </Route>
    </Routes>
  )
}
