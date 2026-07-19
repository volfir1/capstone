import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useLocation } from "react-router";
import "@mantine/core/styles.css";
import "@mantine/dates/styles.css";
import "@mantine/charts/styles.css";
import "@mantine/notifications/styles.css";
import { Box, Group, Paper, Skeleton, Stack, createTheme, MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import { DatesProvider } from "@mantine/dates";
import { lazy, Suspense } from "react";
import AuthProvider, { useAuth } from "../context/authContext";
import { Layout } from "../components/layout/Layout";

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
const TenureHistory           = lazy(() => import("./pages/admin/TenureHistory"));
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

function AdminPageFallback() {
  return (
    <Box p={{ base: "md", sm: "xl" }}>
      <Stack gap="lg">
        <Box>
          <Skeleton height={28} width={220} radius="sm" />
          <Skeleton height={14} width={360} mt="sm" radius="sm" />
        </Box>

        <Group grow align="stretch" visibleFrom="sm">
          {[0, 1, 2].map((item) => (
            <Paper key={item} p="lg" radius="lg" bg="white" style={{ border: "1px solid #F0F0F0" }}>
              <Skeleton height={12} width="45%" radius="sm" />
              <Skeleton height={26} width="70%" mt="md" radius="sm" />
            </Paper>
          ))}
        </Group>

        <Paper p="lg" radius="lg" bg="white" style={{ border: "1px solid #F0F0F0" }}>
          <Stack gap="sm">
            <Skeleton height={16} width="100%" radius="sm" />
            <Skeleton height={16} width="92%" radius="sm" />
            <Skeleton height={16} width="96%" radius="sm" />
            <Skeleton height={16} width="88%" radius="sm" />
          </Stack>
        </Paper>
      </Stack>
    </Box>
  );
}

function AppLoadingFallback({ shell = false }) {
  if (shell) {
    return (
      <Box bg="#FAF8F4" mih="100vh">
        <Box h={60} bg="white" style={{ borderBottom: "1px solid #ECECEC" }}>
          <Group h="100%" px="lg" justify="space-between">
            <Group gap="sm">
              <Skeleton height={34} width={34} radius="xl" />
              <Box>
                <Skeleton height={14} width={72} radius="sm" />
                <Skeleton height={8} width={190} mt={6} radius="sm" />
              </Box>
            </Group>
            <Group gap="xs">
              <Skeleton height={34} width={34} radius="xl" />
              <Skeleton height={34} width={34} radius="xl" />
            </Group>
          </Group>
        </Box>

        <Group align="stretch" gap={0}>
          <Box visibleFrom="sm" w={260} bg="white" mih="calc(100vh - 60px)" p="lg" style={{ borderRight: "1px solid #E8E8E8" }}>
            <Stack gap="sm">
              <Skeleton height={12} width={58} radius="sm" mb={8} />
              {[0, 1, 2, 3, 4].map((item) => (
                <Skeleton key={item} height={38} radius="md" />
              ))}
            </Stack>
          </Box>
          <Box style={{ flex: 1 }}>
            <AdminPageFallback />
          </Box>
        </Group>
      </Box>
    );
  }

  return (
    <Box bg="#FAF8F4" mih="100vh" p={{ base: "md", sm: "xl" }}>
      <Stack maw={920} mx="auto" gap="lg">
        <Group justify="space-between" mt="xl">
          <Group gap="sm">
            <Skeleton height={40} width={40} radius="xl" />
            <Box>
              <Skeleton height={18} width={96} radius="sm" />
              <Skeleton height={10} width={220} mt={8} radius="sm" />
            </Box>
          </Group>
          <Skeleton height={36} width={120} radius="md" />
        </Group>

        <Paper p={{ base: "lg", sm: "xl" }} radius="lg" bg="white" style={{ border: "1px solid #F0F0F0" }}>
          <Stack gap="md">
            <Skeleton height={30} width="48%" radius="sm" />
            <Skeleton height={14} width="78%" radius="sm" />
            <Skeleton height={14} width="64%" radius="sm" />
            <Skeleton height={42} width="100%" mt="md" radius="md" />
          </Stack>
        </Paper>
      </Stack>
    </Box>
  );
}

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

  if (loading) return <AppLoadingFallback shell />;
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

  if (loading) return <AppLoadingFallback shell />;
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

  if (loading) return <AppLoadingFallback />;
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

  if (loading) return <AppLoadingFallback />;
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

  if (loading) return <AppLoadingFallback />;
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
    return <AppLoadingFallback shell={location.pathname.startsWith('/admin')} />;
  }

  return (
    <Suspense fallback={<AppLoadingFallback shell={location.pathname.startsWith('/admin')} />}>
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
              <Layout>
                <Suspense fallback={<AdminPageFallback />}>
                  <Outlet />
                </Suspense>
              </Layout>
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
          <Route path="tenure-history"         element={<TenureHistory />} />
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
