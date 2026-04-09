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
const Signup         = lazy(() => import("./pages/auth/Signup/Signup"));
const ForgotPassword = lazy(() => import("./pages/other/ForgotPassword"));
const AdminLogin     = lazy(() => import("./pages/auth/Login/AdminLogin"));
const ProfileSelection = lazy(() => import("./pages/auth/ProfileSelection"));
const ProfilePin = lazy(() => import("./pages/auth/ProfilePin"));
// Public pages
const LandingPage  = lazy(() => import("./pages/LandingPage"));
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
const PROFILE_MANAGER_ROLES = new Set(['secretary', 'director']);

const theme = createTheme({ fontFamily: "Montserrat, sans-serif" });

function ProtectedRoute({ children }) {
  const {
    userLoggedIn,
    userData,
    loading,
    isVerified,
    requiresProfileSelection,
    activeProfileId,
    requiresPinSetup,
    requiresPinVerification,
  } = useAuth();

  if (loading) return <Loaders height={window.innerHeight} />;
  if (!userLoggedIn) return <Navigate to="/auth/admin" replace />;
  if (!isVerified) return <Navigate to="/auth/admin" replace />;
  if (requiresProfileSelection || !activeProfileId) {
    return <Navigate to="/auth/profiles" replace />;
  }
  if (requiresPinSetup || requiresPinVerification || !userData) {
    return <Navigate to="/auth/profile-pin" replace />;
  }

  if (!ADMIN_ROLES.has(userData?.role)) return <Navigate to="/auth/admin" replace />;

  return children;
}

function RoleProtectedRoute({ children, allowedRoles }) {
  const { loading, userData } = useAuth();

  if (loading) return <Loaders height={window.innerHeight} />;
  if (!allowedRoles.has(userData?.role)) {
    return <Navigate to="/admin" replace />;
  }

  return children;
}

function AuthEntryRoute({ children }) {
  const {
    userLoggedIn,
    userData,
    loading,
    isVerified,
    requiresProfileSelection,
    activeProfileId,
    requiresPinSetup,
    requiresPinVerification,
  } = useAuth();

  if (loading) return <Loaders height={window.innerHeight} />;
  if (!userLoggedIn || !isVerified) return children;
  if (requiresProfileSelection || !activeProfileId) {
    return <Navigate to="/auth/profiles" replace />;
  }
  if (requiresPinSetup || requiresPinVerification || !userData) {
    return <Navigate to="/auth/profile-pin" replace />;
  }

  return <Navigate to="/admin" replace />;
}

function ProfileSelectionRoute({ children }) {
  const {
    userLoggedIn,
    userData,
    loading,
    isVerified,
    requiresProfileSelection,
    activeProfileId,
    requiresPinSetup,
    requiresPinVerification,
  } = useAuth();

  if (loading) return <Loaders height={window.innerHeight} />;
  if (!userLoggedIn || !isVerified) return <Navigate to="/auth/admin" replace />;
  if (!requiresProfileSelection && activeProfileId) {
    if (requiresPinSetup || requiresPinVerification || !userData) {
      return <Navigate to="/auth/profile-pin" replace />;
    }
    return <Navigate to="/admin" replace />;
  }

  return children;
}

function ProfilePinRoute({ children }) {
  const {
    userLoggedIn,
    userData,
    loading,
    isVerified,
    requiresProfileSelection,
    activeProfileId,
    requiresPinSetup,
    requiresPinVerification,
  } = useAuth();

  if (loading) return <Loaders height={window.innerHeight} />;
  if (!userLoggedIn || !isVerified) return <Navigate to="/auth/admin" replace />;
  if (requiresProfileSelection || !activeProfileId) {
    return <Navigate to="/auth/profiles" replace />;
  }
  if (!requiresPinSetup && !requiresPinVerification && userData) {
    return <Navigate to="/admin" replace />;
  }

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
        <Route path="/appointment"     element={<Appointment />} />
        <Route path="/privacy"         element={<Privacy />} />
        <Route path="/terms"           element={<Terms />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Auth */}
        <Route path="auth">
          {/* <Route path="login"  element={<Login />} /> */}
          <Route
            path="signup"
            element={
              <AuthEntryRoute>
                <Signup />
              </AuthEntryRoute>
            }
          />
          <Route
            path="admin"
            element={
              <AuthEntryRoute>
                <AdminLogin />
              </AuthEntryRoute>
            }
          />
          <Route
            path="profiles"
            element={
              <ProfileSelectionRoute>
                <ProfileSelection />
              </ProfileSelectionRoute>
            }
          />
          <Route
            path="profile-pin"
            element={
              <ProfilePinRoute>
                <ProfilePin />
              </ProfilePinRoute>
            }
          />
        </Route>

        {/* Convenience redirects */}
        {/* <Route path="/login"  element={<Navigate to="/auth/login"  replace />} /> */}
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
          <Route
            path="users"
            element={
              <RoleProtectedRoute allowedRoles={PROFILE_MANAGER_ROLES}>
                <UserManagement />
              </RoleProtectedRoute>
            }
          />
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
      <Notifications
        position="top-center"
        zIndex={1000}
        transitionDuration={500}
        containerWidth={370}
        limit={4}
      />
      <DatesProvider settings={{ locale: 'en', firstDayOfWeek: 0, weekendDays: [0, 6] }}>
        <Router>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </Router>
      </DatesProvider>
    </MantineProvider>
  );
}

export default App;
