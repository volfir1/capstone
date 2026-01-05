import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router";
import "@mantine/core/styles.css";
import "@mantine/dates/styles.css";
import { createTheme, MantineProvider } from "@mantine/core";
import { DatesProvider } from "@mantine/dates";
import AuthProvider, { useAuth } from "../context/authContext";
import { Outlet } from "react-router";
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
const TrackAppointment = lazy (()=> import('./pages/user/TrackAppointment'))

const Home = lazy(() => import("./pages/user/Home"));
const AdminDashboard = lazy(() => import("./pages/other/Dashboard"));
const ForgotPassword = lazy(() => import("./pages/other/ForgotPassword"));
const PageNotFound = lazy(() => import("./pages/other/PageNotFound"));

const LandingPage = lazy(()=> import("./pages/LandingPage"))
const AboutPage = lazy(()=> import('./pages/About'))
const FeaturesPage = lazy(()=> import('./pages/Features'))
const HowItWorks = lazy(()=> import('./pages/How')) 
const UserForm = lazy(() => import('./pages/user/UserForm'))
const TrackCase = lazy(() => import('./pages/user/TrackCase'))
const UserChat = lazy(() => import('./pages/user/Chat'))
const ProfilePage = lazy(() => import('./pages/other/Profile'))
const ClientApplicationStatus = lazy(() => import('./pages/other/ClientFormStatus'))

// Admin
const ManageAttorney = lazy(() => import('./pages/admin/ManageAttorney'))
const AssignCase = lazy(() => import('./pages/admin/AssingCase'))
const UserManagement = lazy(() => import('./pages/admin/userManagement'))
const RecommendationForAction = lazy(() => import('./pages/other/RecommendationForAction'))


// Attorney
const AttorneyDashboard = lazy(() => import('./pages/attorney/AttorneyDashboard'))
const AttorneyMessenger = lazy(() => import('./pages/attorney/Messenger.jsx'))

// Intern


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

  if (adminOnly && userData?.role !== "secretary" && userData?.role !== "attorney" && userData?.role !== "pao_lawyer" && userData?.role !== "legal_volunteer" && userData?.role !== "intern") {
    console.log('ProtectedRoute: Redirecting to /user/home - not secretary or attorney');
    return <Navigate to="/user/home" replace />;
  }

  if (attorneyOnly && userData?.role !== "attorney" && userData?.role !== "pao_lawyer" && userData?.role !== "legal_volunteer") {
    console.log('ProtectedRoute: Redirecting - not attorney');
    return <Navigate to="/auth/login" replace />;
  }

  if (internOnly && userData?.role !== "intern") {
    console.log('ProtectedRoute: Redirecting - not intern');
    return <Navigate to="/auth/login" replace />;
  }

  if (!adminOnly && !attorneyOnly && !internOnly && userData?.role === "secretary") {
    console.log('ProtectedRoute: Redirecting to /admin - is secretary');
    return <Navigate to="/admin" replace />;
  }
  if (!adminOnly && !attorneyOnly && !internOnly && userData?.role === "intern") {
    console.log('ProtectedRoute: Redirecting to /intern - is intern');
    return <Navigate to="/intern" replace />;
  }
  // Note: Attorneys can access both attorney and admin routes, so no redirect needed here

  console.log('ProtectedRoute: Rendering children');
  return children;
}

function AppRoutes() {
  const { userLoggedIn, userData, loading } = useAuth();

  console.log('AppRoutes render:', { loading, userLoggedIn, hasUserData: !!userData, pathname: window.location.pathname });

  if (loading) {
    console.log('AppRoutes: Showing loader');
    return <Loaders height={window.innerHeight} />;
  }

  console.log('AppRoutes: Rendering routes');

  return (
    <Suspense fallback={<Loaders height={window.innerHeight} />}>
      <Routes>
         <Route path="auth">
          <Route path="login" element={<Login />} />
          <Route path="signup" element={<Signup />} />
          <Route path="attorneylogin" element={<AttorneyLogin />} />
          <Route path="attorneysignup" element={<AttorneySignup />} />
        </Route>
       
       
        {/* User */}
        <Route
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
          <Route path="chat/:caseId?" element={<UserChat/>}/>
          <Route path="profile" element={<UserProfile />} />
          <Route path="appointment" element={<UserForm />} />
          <Route path="track" element={<TrackAppointment />} />
        </Route>

        {/* Admin */}
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
          <Route path="attorneys" element={<ManageAttorney />} />
          < Route path="assigncase" element={<AssignCase />}/>
          <Route path="recommendation" element={<RecommendationForAction />} />
          <Route path="profile" element={<AdminProfile />} />
          <Route path="clientstats" element={<ClientApplicationStatus />} />
        </Route>
      
      {/* Attorney */}
        <Route
          path="attorney"
          element={
            <ProtectedRoute attorneyOnly>
              <Layout>
                <Outlet />
              </Layout>
            </ProtectedRoute> 
          }
        >
          <Route index element={<AttorneyDashboard />} />
          <Route path="chat" element={<AttorneyMessenger />} />
          <Route path="profile" element={<AttorneyProfile />} />
          <Route path="clientstats" element={<ClientApplicationStatus />} />
        </Route>
      
      {/* Intern */}
        <Route
          path="/intern"
          element={
            <ProtectedRoute internOnly>
              <Layout>
                <Outlet />
              </Layout>
            </ProtectedRoute> 
          }
        >
          <Route path="recommendation" element={<RecommendationForAction />} />
          <Route path="clientstats" element={<ClientApplicationStatus />} />  
        </Route>
        
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/" element={<LandingPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/features" element={<FeaturesPage />} />
        <Route path="/how" element={<HowItWorks/>} />
        <Route path="*" element={<PageNotFound />} />

      </Routes>
    </Suspense>
  );
}

function App() {
  return (
    <MantineProvider theme={theme}>
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