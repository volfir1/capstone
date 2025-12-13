import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router";
import "@mantine/core/styles.css";
import { createTheme, MantineProvider } from "@mantine/core";
import AuthProvider, { useAuth } from "../context/authContext";
import { Outlet } from "react-router";
import { Layout } from "../components/layout/Layout";
import { lazy, Suspense } from "react";
import { Loaders } from "../components/ui/Loader";
import SubmitCase from "./pages/user/SubmitCase";

const Signup = lazy(() => import("./pages/auth/Signup/Signup"));
const Login = lazy(() => import("./pages/auth/Login/Login"));
const Home = lazy(() => import("./pages/user/Home"));
const AdminDashboard = lazy(() => import("./pages/admin/Dashboard"));
const ForgotPassword = lazy(() => import("./pages/other/ForgotPassword"));
const PageNotFound = lazy(() => import("./pages/other/PageNotFound"));

const LandingPage = lazy(()=> import("./pages/LandingPage"))
const AboutPage = lazy(()=> import('./pages/About'))
const FeaturesPage = lazy(()=> import('./pages/Features'))
const HowItWorks = lazy(()=> import('./pages/How')) 
const UserForm = lazy(() => import('./pages/other/UserForm'))
const TrackCase = lazy(() => import('./pages/user/TrackCase'))
const UserChat = lazy(() => import('./pages/user/Chat'))

// Admin
const ManageAttorney = lazy(() => import('./pages/admin/ManageAttorney'))
const AssignCase = lazy(() => import('./pages/admin/AssingCase'))
const UserManagement = lazy(() => import("@admin/userManagement"))

const theme = createTheme({
  fontFamily: "Montserrat, sans-serif",
});

function ProtectedRoute({ children, adminOnly = false }) {
  const { userLoggedIn, userData, loading } = useAuth();

  console.log('ProtectedRoute render:', { loading, userLoggedIn, hasUserData: !!userData, adminOnly });

  if (loading) {
    console.log('ProtectedRoute: Showing loader - loading is true');
    return <Loaders height={window.innerHeight} />;
  }
  
  if (!userLoggedIn) {
    console.log('ProtectedRoute: Redirecting to login - not logged in');
    return <Navigate to="/login" replace />;
  }
  
  if (!userData) {
    console.log('ProtectedRoute: Showing loader - userData is null');
    return <Loaders height={window.innerHeight} />;
  }
  
  if (!userData?.isVerified) {
    console.log('ProtectedRoute: Redirecting to login - not verified');
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && userData?.role !== "admin") {
    console.log('ProtectedRoute: Redirecting to /user/home - not admin');
    return <Navigate to="/user/home" replace />;
  }

  if (!adminOnly && userData?.role === "admin") {
    console.log('ProtectedRoute: Redirecting to /admin - is admin');
    return <Navigate to="/admin" replace />;
  }

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
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/formapp" element={<UserForm />} />
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
          <Route  path="submitcase" element={< SubmitCase/>}/>
          <Route  path="trackcase" element={< TrackCase/>}/>
          <Route path="chat/:caseId?" element={<UserChat/>}/>
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
          < Route path="assign" element={<AssignCase />}/>
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
      <AuthProvider>
        <Router>
          <AppRoutes />
        </Router>
      </AuthProvider>
    </MantineProvider>
  );
}

export default App;