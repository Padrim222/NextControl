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
import CallAnalysis from "@/pages/closer/CallAnalysis";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminManage from "@/pages/admin/AdminManage";
import ClientDashboard from "@/pages/client/ClientDashboard";
import CSInbox from "@/pages/cs/CSInbox";
import TrainingHub from "@/pages/training/TrainingHub";
import CoachChat from "@/pages/training/CoachChat";
import RagManager from "@/pages/admin/RagManager";
import IntelligenceHub from "@/pages/admin/IntelligenceHub";
import CallsPipeline from "@/pages/admin/CallsPipeline";
import BetaManagement from "@/pages/admin/BetaManagement";
import WeeklyReportPage from "@/pages/client/WeeklyReportPage";
import AgentPage from "@/pages/client/AgentPage";

// Public Form Pages (no auth)
import ExpertForm from "@/pages/forms/ExpertForm";
import SellerForm from "@/pages/forms/SellerForm";
import CloserForm from "@/pages/forms/CloserForm";
import FormSuccess from "@/pages/forms/FormSuccess";

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

            {/* Public Form Routes (no auth, no dashboard layout) */}
            <Route path="/form/expert-weekly" element={<ExpertForm />} />
            <Route path="/form/seller-daily" element={<SellerForm />} />
            <Route path="/form/closer-daily" element={<CloserForm />} />
            <Route path="/form/success" element={<FormSuccess />} />

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
                <RoleGuard allowedRoles={['seller', 'closer', 'admin']}>
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

            <Route
              path="/closer/call-analysis"
              element={
                <RoleGuard allowedRoles={['closer', 'admin']}>
                  <DashboardLayout>
                    <CallAnalysis />
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
            <Route
              path="/admin/manage"
              element={
                <RoleGuard allowedRoles={['admin']}>
                  <DashboardLayout>
                    <AdminManage />
                  </DashboardLayout>
                </RoleGuard>
              }
            />
            <Route
              path="/admin/rag"
              element={
                <RoleGuard allowedRoles={['admin']}>
                  <DashboardLayout>
                    <RagManager />
                  </DashboardLayout>
                </RoleGuard>
              }
            />
            <Route
              path="/admin/hub"
              element={
                <RoleGuard allowedRoles={['admin']}>
                  <DashboardLayout>
                    <IntelligenceHub />
                  </DashboardLayout>
                </RoleGuard>
              }
            />
            <Route
              path="/admin/calls-pipeline"
              element={
                <RoleGuard allowedRoles={['admin']}>
                  <DashboardLayout>
                    <CallsPipeline />
                  </DashboardLayout>
                </RoleGuard>
              }
            />
            <Route
              path="/admin/beta-management"
              element={
                <RoleGuard allowedRoles={['admin']}>
                  <DashboardLayout>
                    <BetaManagement />
                  </DashboardLayout>
                </RoleGuard>
              }
            />

            {/* Agent Route — client's primary page */}
            <Route
              path="/agent"
              element={
                <RoleGuard allowedRoles={['client', 'admin']}>
                  <DashboardLayout>
                    <AgentPage />
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
            <Route
              path="/client/weekly-report"
              element={
                <RoleGuard allowedRoles={['client', 'admin']}>
                  <DashboardLayout>
                    <WeeklyReportPage />
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
                <RoleGuard allowedRoles={['seller', 'closer', 'client', 'admin']}>
                  <DashboardLayout>
                    <TrainingHub />
                  </DashboardLayout>
                </RoleGuard>
              }
            />
            <Route
              path="/training/coach"
              element={
                <RoleGuard allowedRoles={['seller', 'closer', 'client', 'admin']}>
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
