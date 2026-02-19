import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { RoleGuard } from "@/components/layout/RoleGuard";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

// Pages
import LandingPage from "@/pages/LandingPage";
import Login from "@/pages/auth/Login";
import Register from "@/pages/auth/Register";
import SellerDashboard from "@/pages/seller/SellerDashboard";
import DailyReport from "@/pages/seller/DailyReport";
import WeeklyEvolution from "@/pages/seller/WeeklyEvolution";
import CloserDashboard from "@/pages/closer/CloserDashboard";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import ClientDashboard from "@/pages/client/ClientDashboard";
import CSInbox from "@/pages/cs/CSInbox";
import TrainingHub from "@/pages/training/TrainingHub";
import CoachChat from "@/pages/training/CoachChat";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Seller Routes */}
            <Route
              path="/seller"
              element={
                <RoleGuard allowedRoles={['seller', 'admin']}>
                  <DashboardLayout>
                    <SellerDashboard />
                  </DashboardLayout>
                </RoleGuard>
              }
            />
            <Route
              path="/seller/report"
              element={
                <RoleGuard allowedRoles={['seller', 'closer', 'admin']}>
                  <DashboardLayout>
                    <DailyReport />
                  </DashboardLayout>
                </RoleGuard>
              }
            />
            <Route
              path="/seller/report/:clientId"
              element={
                <RoleGuard allowedRoles={['seller', 'closer', 'admin']}>
                  <DashboardLayout>
                    <DailyReport />
                  </DashboardLayout>
                </RoleGuard>
              }
            />

            <Route
              path="/seller/evolution"
              element={
                <RoleGuard allowedRoles={['seller', 'admin']}>
                  <DashboardLayout>
                    <WeeklyEvolution />
                  </DashboardLayout>
                </RoleGuard>
              }
            />

            {/* Closer Routes */}
            <Route
              path="/closer"
              element={
                <RoleGuard allowedRoles={['closer', 'admin']}>
                  <DashboardLayout>
                    <CloserDashboard />
                  </DashboardLayout>
                </RoleGuard>
              }
            />

            {/* Admin Routes */}
            <Route
              path="/admin"
              element={
                <RoleGuard allowedRoles={['admin']}>
                  <DashboardLayout>
                    <AdminDashboard />
                  </DashboardLayout>
                </RoleGuard>
              }
            />

            {/* Client Routes */}
            <Route
              path="/client"
              element={
                <RoleGuard allowedRoles={['client', 'admin']}>
                  <DashboardLayout>
                    <ClientDashboard />
                  </DashboardLayout>
                </RoleGuard>
              }
            />

            {/* CS Dashboard Route */}
            <Route
              path="/cs"
              element={
                <RoleGuard allowedRoles={['admin', 'cs']}>
                  <DashboardLayout>
                    <CSInbox />
                  </DashboardLayout>
                </RoleGuard>
              }
            />

            {/* Training Routes */}
            <Route
              path="/training"
              element={
                <RoleGuard allowedRoles={['seller', 'closer', 'admin']}>
                  <DashboardLayout>
                    <TrainingHub />
                  </DashboardLayout>
                </RoleGuard>
              }
            />
            <Route
              path="/training/coach"
              element={
                <RoleGuard allowedRoles={['seller', 'closer', 'admin']}>
                  <DashboardLayout>
                    <CoachChat />
                  </DashboardLayout>
                </RoleGuard>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
