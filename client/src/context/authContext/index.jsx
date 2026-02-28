import React, { useContext, useEffect, useState, useRef } from "react";
import { auth } from "../../firebase/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { getUserData } from "@/features/auth/user";
import { verifyUser } from "@/features/auth/auth";
import apiClient from "@config/api/apiClient";
import { registerUser as registerSocketUser, disconnectSocket } from "@/config/socket";

const AuthContext = React.createContext();

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}

// Roles that have access to the admin panel
const ADMIN_ROLES = new Set(['secretary', 'supervising_lawyer', 'director', 'intern']);

export default function AuthProvider({ children }) {
  const [currentUser, setCurrentUser]   = useState(null);
  const [userLoggedIn, setUserLoggedIn] = useState(false);
  const [loading, setLoading]           = useState(true);
  const [userData, setUserData]         = useState(null);
  const loginLoggedRef                  = useRef(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);

      if (user) {
        setCurrentUser({ ...user });
        setUserLoggedIn(true);

        try {
          await user.reload();

          if (!user.emailVerified) {
            setUserData(null);
            return;
          }

          // Sync Firebase verification status with backend
          try {
            await verifyUser();
          } catch (err) {
            console.error('Backend verification sync failed:', err);
          }

          try {
            // Fetch user data from backend
            const backendUserData = await getUserData();
            setUserData(backendUserData);

            // Register socket for real-time events
            registerSocketUser(user.uid);

            // Log login activity once per session
            if (!loginLoggedRef.current) {
              loginLoggedRef.current = true;
              apiClient.post('/activity-logs', {
                action: 'login',
                userEmail: user.email || '',
                userName: backendUserData.displayName
                  || backendUserData.fullName
                  || `${backendUserData.firstName || ''} ${backendUserData.lastName || ''}`.trim()
                  || user.email,
                userRole: backendUserData.role || '',
              }).catch(err => console.error('Activity log error:', err));
            }
          } catch (userError) {
            // User not found in backend — register as new 'user' (pending) role
            console.log('User not found in backend, registering as new user...');
            try {
              const displayName  = user.displayName || '';
              const nameParts    = displayName.split(' ');
              const firstName    = nameParts[0] || '';
              const lastName     = nameParts.slice(1).join(' ') || '';
              const username     = user.email;

              const { registerUser } = await import('@/features/auth/register');
              await registerUser(firstName, lastName, username);

              const newUserData = await getUserData();
              setUserData(newUserData);
            } catch (registerError) {
              console.error('Failed to register new user:', registerError);
              setUserData(null);
            }
          }
        } catch (error) {
          console.error('Auth state error:', error);
          setUserData(null);
        } finally {
          setLoading(false);
        }
      } else {
        // User signed out — clear all state
        setCurrentUser(null);
        setUserLoggedIn(false);
        setUserData(null);
        loginLoggedRef.current = false;
        disconnectSocket();

        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('userName');
        localStorage.removeItem('role');

        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const refreshUserData = async () => {
    if (!currentUser) return;
    try {
      const backendUserData = await getUserData();
      setUserData(backendUserData);
      return backendUserData;
    } catch (error) {
      console.error('Failed to refresh user data:', error);
    }
  };

  const value = {
    currentUser,
    userLoggedIn,
    loading,
    userData,
    isAdmin: ADMIN_ROLES.has(userData?.role),
    isVerified: userData?.isVerified || false,
    refreshUserData,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}