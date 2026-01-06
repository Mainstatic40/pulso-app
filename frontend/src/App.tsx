import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/react-query';
import { AuthProvider } from './stores/auth.store.tsx';
import { ProtectedRoute } from './components/shared/ProtectedRoute';
import { Layout } from './components/shared/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { TimeEntries } from './pages/TimeEntries';
import { Tasks } from './pages/Tasks';
import { Events } from './pages/Events';
import { Calendar } from './pages/Calendar';
import { WeeklyLog } from './pages/WeeklyLog';
import { Users } from './pages/Users';
import { Reports } from './pages/Reports';
import { Equipment } from './pages/Equipment';
import { EquipmentLoans } from './pages/EquipmentLoans';
import { Chat } from './pages/Chat';
import { RfidManagement } from './pages/RfidManagement';
import { EventRequests } from './pages/EventRequests';
import { SolicitorPortal } from './pages/public/SolicitorPortal';
import { EventRequestForm } from './pages/public/EventRequestForm';
import { MyEventRequests } from './pages/public/MyEventRequests';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/solicitar/:accessCode" element={<SolicitorPortal />} />
            <Route path="/solicitar/:accessCode/nuevo" element={<EventRequestForm />} />
            <Route path="/mis-solicitudes/:token" element={<MyEventRequests />} />

            {/* Protected routes with Layout */}
            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/dashboard" element={<Navigate to="/" replace />} />
                <Route path="/time-entries" element={<TimeEntries />} />
                <Route path="/tasks" element={<Tasks />} />
                <Route path="/events" element={<Events />} />
                <Route path="/calendar" element={<Calendar />} />
                <Route path="/equipment" element={<Equipment />} />
                <Route path="/equipment-loans" element={<EquipmentLoans />} />
                <Route path="/chat" element={<Chat />} />
                <Route path="/weekly-log" element={<WeeklyLog />} />
              </Route>
            </Route>

            {/* Admin/Supervisor only routes */}
            <Route element={<ProtectedRoute allowedRoles={['admin', 'supervisor']} />}>
              <Route element={<Layout />}>
                <Route path="/users" element={<Users />} />
                <Route path="/rfid" element={<RfidManagement />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/solicitudes" element={<EventRequests />} />
              </Route>
            </Route>

            {/* Catch all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
