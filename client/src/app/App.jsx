import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router";
import "@mantine/core/styles.css";
import "@mantine/dates/styles.css";
import "@mantine/charts/styles.css";
import { createTheme, MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import "@mantine/notifications/styles.css";
import { DatesProvider } from "@mantine/dates";
import AuthProvider, { useAuth } from "../context/authContext";
import { Outlet, useLocation } from "react-router";
import { Layout } from "../components/layout/Layout";
import { lazy, Suspense } from "react";
import { Loaders } from "../components/ui/Loader";
import UserProfile from "./pages/other/Profiles/UserProfile";
import AttorneyProfile from "./pages/other/Profiles/AttorneyProfile";
import AdminProfile from "./pages/other/Profiles/AdminProfile";

// Auth
const Signup = lazy(() => import("./pages/auth/Signup/Signup"));
const Login = lazy(() => import("./pages/auth/Login/Login"));
const AttorneySignup = lazy(() => import('./pages/auth/Signup/AttorneySingup.jsx'))
const AttorneyLogin = lazy(() => import('./pages/auth/Login/AttorneyLogin.jsx'))
const TrackAppointment = lazy(() => import('./pages/user/TrackAppointment'))

const Home = lazy(() => import("./pages/user/Home"));
const AdminDashboard = lazy(() => import("./pages/admin/Dashboard"));
const ForgotPassword = lazy(() => import("./pages/other/ForgotPassword"));
const PageNotFound = lazy(() => import("./pages/other/PageNotFound"));
const AIChatbot = lazy(() => import("./pages/other/AIChatbot"));

const LandingPage = lazy(() => import("./pages/LandingPage"))
const AboutPage = lazy(() => import('./pages/About'))
const FeaturesPage = lazy(() => import('./pages/Features'))
const HowItWorks = lazy(() => import('./pages/How'))
const UserForm = lazy(() => import('./pages/user/UserForm'))
  const Appointment = lazy(() => import('./pages/Appointment'))
  // const TrackCase = lazy(() => import('./pages/user/TrackCase'))
  // const ProfilePage = lazy(() => import('./pages/other/Profile'))
const ClientApplicationStatus = lazy(() => import('./pages/other/ClientFormStatus'))

// Admin
const UserManagement = lazy(() => import('./pages/admin/userManagement'))
const RecommendationForAction = lazy(() => import('./pages/other/RecommendationForAction'))
const FinalizedCases = lazy(() => import('./pages/admin/FinalizedCases'))
const AssignedCases = lazy(() => import('./pages/admin/AssignedCases'))
const ClientInfoView = lazy(() => import('./pages/other/ClientInfoView'))
const Analytics = lazy(() => import('./pages/admin/Analytics'))

// Public
const Privacy = lazy(() => import('./pages/admin/Privacy'))
const Terms = lazy(() => import('./pages/admin/Terms'))

const theme = createTheme({
  fontFamily: "Montserrat, sans-serif",
});

function ProtectedRoute({ children, adminOnly = false, attorneyOnly = false, internOnly = false }) {
  const { userLoggedIn, userData, loading } = useAuth();

  console.log('ProtectedRoute render:', { loading, userLoggedIn, hasUserData: !!userData, adminOnly, attorneyOnly, internOnly });

  if (loading) {
    console.log('ProtectedRoute: Showing loader - loading is true');
    return <Loaders height={window.innerHeight} />;
  }

  if (!userLoggedIn) {
    console.log('ProtectedRoute: Redirecting to login - not logged in');
    return <Navigate to="/auth/login" replace />;
  }

  if (!userData) {
    console.log('ProtectedRoute: Showing loader - userData is null');
    return <Loaders height={window.innerHeight} />;
  }

  if (!userData?.isVerified) {
    console.log('ProtectedRoute: Redirecting to login - not verified');
    return <Navigate to="/auth/login" replace />;
  }

  // Block default `user` role (pending state) from accessing any routes.
  if (userData?.role === 'user') {
    console.log('ProtectedRoute: Blocking default `user` role - redirecting to login');
    return <Navigate to="/auth/login" replace />;
  }

  if (adminOnly && userData?.role !== "secretary" && userData?.role !== "attorney" && userData?.role !== "pao_lawyer" && userData?.role !== "legal_volunteer" && userData?.role !== "intern" && userData?.role !== "supervising_lawyer" && userData?.role !== "director") {
    /*
    console.log('ProtectedRoute: Redirecting to /user/home - not secretary or attorney');
    return <Navigate to="/user/home" replace />;
    */
  }

  if (attorneyOnly && userData?.role !== "attorney" && userData?.role !== "pao_lawyer" && userData?.role !== "legal_volunteer") {
    console.log('ProtectedRoute: Redirecting - not attorney');
    return <Navigate to="/auth/login" replace />;
  }

  if (internOnly && userData?.role !== "intern") {
    console.log('ProtectedRoute: Redirecting - not intern');
    return <Navigate to="/auth/login" replace />;
  }

  if (!adminOnly && !attorneyOnly && !internOnly && (userData?.role === "secretary" || userData?.role === "attorney" || userData?.role === "pao_lawyer" || userData?.role === "legal_volunteer" || userData?.role === "intern" || userData?.role === "supervising_lawyer" || userData?.role === "director")) {
    console.log('ProtectedRoute: Redirecting to /admin - is admin role');
    return <Navigate to="/admin" replace />;
  }

  console.log('ProtectedRoute: Rendering children');
  return children;
}

function AppRoutes() {
  const { userLoggedIn, userData, loading } = useAuth();
  const location = useLocation();

  console.log('AppRoutes render:', { loading, userLoggedIn, hasUserData: !!userData, pathname: window.location.pathname });

  if (loading) {
    // If we're on auth pages, don't show the global loader overlay — keep the login UI visible
    if (location.pathname && location.pathname.startsWith('/auth')) {
      console.log('AppRoutes: Loading but on auth page — skipping global loader');
    } else {
      console.log('AppRoutes: Showing loader');
      return <Loaders height={window.innerHeight} />;
    }
  }

  console.log('AppRoutes: Rendering routes');

  return (
    <Suspense fallback={<Loaders height={window.innerHeight} />}>
      <Routes>
        {/* Public routes */}
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />

        <Route path="auth">
          <Route path="login" element={<Login />} />
          <Route path="signup" element={<Signup />} />
          <Route path="attorneylogin" element={<AttorneyLogin />} />
          <Route path="attorneysignup" element={<AttorneySignup />} />
        </Route>


       {/* User Routes */}
        {/* <Route
          path="/user"
          element={
            <ProtectedRoute>
              <Layout>
                <Outlet />
              </Layout>
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="home" replace />} />
          <Route path="home" element={<Home />} />
           Chat route disabled per checklist. Commented out to preserve code for future use.
  const UserChat = lazy(() => import('./pages/user/Chat'))
  <Route path="chat/:caseId?" element={<UserChat/>}/>

          <Route path="profile" element={<UserProfile />} />
          <Route path="appointment" element={<UserForm />} />
          <Route path="track" element={<TrackAppointment />} />
        </Route> */}

        {/* Admin - Unified for Secretary, Attorney, and Intern */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute adminOnly>
              <Layout>
                <Outlet />
              </Layout>
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="recommendation/:caseId?" element={<RecommendationForAction />} />
          <Route path="assigned-cases" element={<AssignedCases />} />
          <Route path="finalized" element={<FinalizedCases />} />
          <Route path="clientformstatus" element={<ClientApplicationStatus />} />
          <Route path="clientinfo/:id" element={<ClientInfoView />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="profile" element={<AdminProfile />} />
        </Route>

        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Navigate to="/auth/login" replace />} />
        <Route path="/signup" element={<Navigate to="/auth/signup" replace />} />
        <Route path="/appointment" element={<Appointment />} />
        <Route path="/ai-chatbot" element={<AIChatbot />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/features" element={<FeaturesPage />} />
        <Route path="/how" element={<HowItWorks />} />
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