import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useLocation } from "react-router";
import "@mantine/core/styles.css";
import "@mantine/dates/styles.css";
import "@mantine/charts/styles.css";
import "@mantine/notifications/styles.css";
import { createTheme, MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import { DatesProvider } from "@mantine/dates";
import { lazy, Suspense } from "react";
import AuthProvider, { useAuth } from "../context/authContext";
import { Layout } from "../components/layout/Layout";
import { Loaders } from "../components/ui/Loader";

// Auth
const Login          = lazy(() => import("./pages/auth/Login/Login"));
const Signup         = lazy(() => import("./pages/auth/Signup/Signup"));
const ForgotPassword = lazy(() => import("./pages/other/ForgotPassword"));
const AdminLogin     = lazy(() => import("./pages/auth/Login/AdminLogin"));
// Public pages
const LandingPage  = lazy(() => import("./pages/LandingPage"));
const AboutPage    = lazy(() => import("./pages/About"));
const FeaturesPage = lazy(() => import("./pages/Features"));
const HowItWorks   = lazy(() => import("./pages/How"));
const Appointment  = lazy(() => import("./pages/Appointment"));
const Privacy      = lazy(() => import("./pages/admin/Privacy"));
const Terms        = lazy(() => import("./pages/admin/Terms"));
const PageNotFound = lazy(() => import("./pages/other/PageNotFound"));

// Admin pages
const AdminDashboard          = lazy(() => import("./pages/admin/Dashboard"));
const UserManagement          = lazy(() => import("./pages/admin/userManagement"));
const FinalizedCases          = lazy(() => import("./pages/admin/FinalizedCases"));
const AssignedCases           = lazy(() => import("./pages/admin/AssignedCases"));
const Analytics               = lazy(() => import("./pages/admin/Analytics"));
const RecommendationForAction = lazy(() => import("./pages/other/RecommendationForAction"));
const ClientApplicationStatus = lazy(() => import("./pages/other/ClientFormStatus"));
const ClientInfoView          = lazy(() => import("./pages/other/ClientInfoView"));
const AdminProfile            = lazy(() => import("./pages/other/Profiles/AdminProfile"));

// Roles:
//   'user'              — pending/holding, no routes, redirected to login until promoted
//   'secretary'         — admin access
//   'supervising_lawyer'— admin access
//   'director'          — admin access
//   'intern'            — admin access
const ADMIN_ROLES = new Set(['secretary', 'supervising_lawyer', 'director', 'intern']);

const theme = createTheme({ fontFamily: "Montserrat, sans-serif" });

function ProtectedRoute({ children }) {
  const { userLoggedIn, userData, loading } = useAuth();

  if (loading || (userLoggedIn && !userData)) return <Loaders height={window.innerHeight} />;
  if (!userLoggedIn)         return <Navigate to="/auth/admin" replace />;
  if (!userData?.isVerified) return <Navigate to="/auth/admin" replace />;

  // 'user' role = pending — hold at login until an admin promotes them
  if (!ADMIN_ROLES.has(userData?.role)) return <Navigate to="/auth/admin" replace />;

  return children;
}

function AppRoutes() {
  const { loading } = useAuth();
  const location = useLocation();

  if (loading && !location.pathname.startsWith('/auth')) {
    return <Loaders height={window.innerHeight} />;
  }

  return (
    <Suspense fallback={<Loaders height={window.innerHeight} />}>
      <Routes>
        {/* Public */}
        <Route path="/"                element={<LandingPage />} />
        <Route path="/about"           element={<AboutPage />} />
        <Route path="/features"        element={<FeaturesPage />} />
        <Route path="/how"             element={<HowItWorks />} />
        <Route path="/appointment"     element={<Appointment />} />
        <Route path="/privacy"         element={<Privacy />} />
        <Route path="/terms"           element={<Terms />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Auth */}
        <Route path="auth">
          <Route path="login"  element={<Login />} />
          <Route path="signup" element={<Signup />} />
          <Route path="admin" element={<AdminLogin />} />
        </Route>

        {/* Convenience redirects */}
        <Route path="/login"  element={<Navigate to="/auth/login"  replace />} />
        <Route path="/signup" element={<Navigate to="/auth/signup" replace />} />

        {/* Admin — secretary | supervising_lawyer | director | intern */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <Layout><Outlet /></Layout>
            </ProtectedRoute>
          }
        >
          <Route index                          element={<AdminDashboard />} />
          <Route path="users"                   element={<UserManagement />} />
          <Route path="recommendation/:caseId?" element={<RecommendationForAction />} />
          <Route path="assigned-cases"          element={<AssignedCases />} />
          <Route path="finalized"               element={<FinalizedCases />} />
          <Route path="clientformstatus"        element={<ClientApplicationStatus />} />
          <Route path="clientinfo/:id"          element={<ClientInfoView />} />
          <Route path="analytics"               element={<Analytics />} />
          <Route path="profile"                 element={<AdminProfile />} />
        </Route>

        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </Suspense>
  );
}

function App() {
  return (
    <MantineProvider theme={theme}>
      <Notifications position="top-right" zIndex={1000} />
      <DatesProvider settings={{ locale: 'en', firstDayOfWeek: 0, weekendDays: [0, 6] }}>
        <AuthProvider>
          <Router>
            <AppRoutes />
          </Router>
        </AuthProvider>
      </DatesProvider>
    </MantineProvider>
  );
}

export default App;