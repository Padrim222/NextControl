import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { RoleGuard } from "@/components/layout/RoleGuard";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

// Eager — always needed on first load
import LandingPage from "@/pages/LandingPage";
import Login from "@/pages/auth/Login";
import Register from "@/pages/auth/Register";
import NotFound from "@/pages/NotFound";

// Lazy — loaded only when the route is visited
const SellerDashboard  = lazy(() => import("@/pages/seller/SellerDashboard"));
const DailyReport      = lazy(() => import("@/pages/seller/DailyReport"));
const WeeklyEvolution  = lazy(() => import("@/pages/seller/WeeklyEvolution"));
const CloserDashboard  = lazy(() => import("@/pages/closer/CloserDashboard"));
const CallAnalysis     = lazy(() => import("@/pages/closer/CallAnalysis"));
const AdminDashboard   = lazy(() => import("@/pages/admin/AdminDashboard"));
const AdminManage      = lazy(() => import("@/pages/admin/AdminManage"));
const RagManager       = lazy(() => import("@/pages/admin/RagManager"));
const IntelligenceHub  = lazy(() => import("@/pages/admin/IntelligenceHub"));
const CallsPipeline    = lazy(() => import("@/pages/admin/CallsPipeline"));
const BetaManagement   = lazy(() => import("@/pages/admin/BetaManagement"));
const ClientDashboard  = lazy(() => import("@/pages/client/ClientDashboard"));
const AgentPage        = lazy(() => import("@/pages/client/AgentPage"));
const OnboardingForm   = lazy(() => import("@/pages/client/OnboardingForm"));
const CSInbox          = lazy(() => import("@/pages/cs/CSInbox"));
const TrainingHub      = lazy(() => import("@/pages/training/TrainingHub"));
const CoachChat        = lazy(() => import("@/pages/training/CoachChat"));

// Public Form Pages (no auth)
const ExpertForm  = lazy(() => import("@/pages/forms/ExpertForm"));
const SellerForm  = lazy(() => import("@/pages/forms/SellerForm"));
const CloserForm  = lazy(() => import("@/pages/forms/CloserForm"));
const FormSuccess = lazy(() => import("@/pages/forms/FormSuccess"));

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider>
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <BrowserRouter>
        <AuthProvider>
          <Suspense fallback={<div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-solar" /></div>}>
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
                <RoleGuard allowedRoles={['seller', 'admin', 'team_member']}>
                  <DashboardLayout>
                    <SellerDashboard />
                  </DashboardLayout>
                </RoleGuard>
              }
            />
            <Route
              path="/seller/report"
              element={
                <RoleGuard allowedRoles={['seller', 'closer', 'admin', 'team_member']}>
                  <DashboardLayout>
                    <DailyReport />
                  </DashboardLayout>
                </RoleGuard>
              }
            />
            <Route
              path="/seller/report/:clientId"
              element={
                <RoleGuard allowedRoles={['seller', 'closer', 'admin', 'team_member']}>
                  <DashboardLayout>
                    <DailyReport />
                  </DashboardLayout>
                </RoleGuard>
              }
            />

            <Route
              path="/seller/evolution"
              element={
                <RoleGuard allowedRoles={['seller', 'closer', 'admin', 'team_member']}>
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
                <RoleGuard allowedRoles={['closer', 'admin', 'team_member']}>
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

            {/* Client Onboarding — briefing form that feeds the RAG knowledge base */}
            <Route
              path="/client/onboarding"
              element={
                <RoleGuard allowedRoles={['client', 'admin']}>
                  <OnboardingForm />
                </RoleGuard>
              }
            />

            {/* Client Routes — redirect to /agent (client sees only the consulting chat) */}
            <Route path="/client" element={<Navigate to="/agent" replace />} />
            <Route path="/client/weekly-report" element={<Navigate to="/agent" replace />} />

            {/* Admin-only: ClientDashboard accessible via /admin/client/:id */}
            <Route
              path="/admin/client/:id"
              element={
                <RoleGuard allowedRoles={['admin', 'cs']}>
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
                <RoleGuard allowedRoles={['seller', 'closer', 'admin', 'team_member']}>
                  <DashboardLayout>
                    <TrainingHub />
                  </DashboardLayout>
                </RoleGuard>
              }
            />
            <Route
              path="/training/coach"
              element={
                <RoleGuard allowedRoles={['seller', 'closer', 'admin', 'team_member']}>
                  <DashboardLayout>
                    <CoachChat />
                  </DashboardLayout>
                </RoleGuard>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  </ThemeProvider>
);

export default App;
