import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/hooks/useAuth'
import { AppLayout } from '@/components/layout/AppLayout'
import { RequireAuth, RequireRole } from '@/components/layout/RoleGuard'

// Auth pages
import LoginPage from '@/pages/LoginPage'
import SetPasswordPage from '@/pages/SetPasswordPage'
import OnboardingPage from '@/pages/OnboardingPage'

// App pages
import DashboardPage from '@/pages/DashboardPage'
import EmployeesPage from '@/pages/EmployeesPage'
import EmployeeDetailPage from '@/pages/EmployeeDetailPage'
import NewEmployeePage from '@/pages/NewEmployeePage'
import BulkImportPage from '@/pages/BulkImportPage'
import AttendancePage from '@/pages/AttendancePage'
import TeamAttendancePage from '@/pages/TeamAttendancePage'
import RegularizationPage from '@/pages/RegularizationPage'
import LeaveDashboardPage from '@/pages/LeaveDashboardPage'
import ApplyLeavePage from '@/pages/ApplyLeavePage'
import LeaveApplicationDetailPage from '@/pages/LeaveApplicationDetailPage'
import CompOffPage from '@/pages/CompOffPage'
import TeamLeavePage from '@/pages/TeamLeavePage'
import HolidayCalendarPage from '@/pages/HolidayCalendarPage'
import DepartmentsPage from '@/pages/DepartmentsPage'
import DesignationsPage from '@/pages/DesignationsPage'
import ShiftsPage from '@/pages/ShiftsPage'
import LeaveTypesPage from '@/pages/LeaveTypesPage'
import AppConfigPage from '@/pages/AppConfigPage'
import IPWhitelistPage from '@/pages/IPWhitelistPage'
import GeofencePage from '@/pages/GeofencePage'

export default function App() {
  const { setAuth, clearAuth, setLoading } = useAuthStore()

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const { data: employee } = await supabase
          .from('employees')
          .select('*')
          .eq('auth_id', session.user.id)
          .single()
        if (employee) {
          setAuth(session.user, employee)
        } else {
          setLoading(false)
        }
      } else {
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') clearAuth()
    })

    return () => subscription.unsubscribe()
  }, [setAuth, clearAuth, setLoading])

  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/set-password" element={<SetPasswordPage />} />

      {/* Protected — requires auth + layout shell */}
      <Route element={<RequireAuth />}>
        <Route path="/onboarding" element={<OnboardingPage />} />

        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />

          {/* Employees */}
          <Route path="/employees" element={<EmployeesPage />} />
          <Route element={<RequireRole allow={['owner']} />}>
            <Route path="/employees/new" element={<NewEmployeePage />} />
            <Route path="/employees/bulk-import" element={<BulkImportPage />} />
          </Route>
          <Route path="/employees/:id" element={<EmployeeDetailPage />} />

          {/* Attendance */}
          <Route path="/attendance" element={<AttendancePage />} />
          <Route element={<RequireRole allow={['owner', 'hr']} />}>
            <Route path="/attendance/team" element={<TeamAttendancePage />} />
          </Route>
          <Route path="/attendance/regularization" element={<RegularizationPage />} />

          {/* Leave */}
          <Route path="/leave" element={<LeaveDashboardPage />} />
          <Route path="/leave/apply" element={<ApplyLeavePage />} />
          <Route path="/leave/applications/:id" element={<LeaveApplicationDetailPage />} />
          <Route path="/leave/comp-off/request" element={<CompOffPage />} />
          <Route element={<RequireRole allow={['owner', 'hr']} />}>
            <Route path="/leave/team" element={<TeamLeavePage />} />
          </Route>
          <Route path="/leave/holidays" element={<HolidayCalendarPage />} />

          {/* Settings */}
          <Route element={<RequireRole allow={['owner']} />}>
            <Route path="/settings/departments" element={<DepartmentsPage />} />
            <Route path="/settings/designations" element={<DesignationsPage />} />
            <Route path="/settings/leave-types" element={<LeaveTypesPage />} />
            <Route path="/settings/app-config" element={<AppConfigPage />} />
          </Route>
          <Route element={<RequireRole allow={['owner', 'hr']} />}>
            <Route path="/settings/shifts" element={<ShiftsPage />} />
            <Route path="/settings/holidays" element={<HolidayCalendarPage />} />
          </Route>
          <Route element={<RequireRole allow={['owner', 'system_admin']} />}>
            <Route path="/settings/ip-whitelist" element={<IPWhitelistPage />} />
            <Route path="/settings/geofence" element={<GeofencePage />} />
          </Route>
        </Route>
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
