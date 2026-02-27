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
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userLoggedIn, setUserLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const loginLoggedRef = useRef(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('Auth state changed:', user ? 'User logged in' : 'No user');
      setLoading(true);

      if (user) {
        setCurrentUser({ ...user });
        setUserLoggedIn(true);

        try {
          await user.reload();

          if (user.emailVerified) {
            console.log('User is verified in Firebase, syncing verification with backend...');

            try {
              await verifyUser();
              console.log('Backend verification status updated');
            } catch (verifyError) {
              console.error('Failed to update backend verification:', verifyError);
            }

            try {
              console.log('Fetching user data from backend...');

              // First try to fetch as regular user
              try {
                const backendUserData = await getUserData();
                setUserData(backendUserData);
                console.log('User data loaded:', backendUserData);
                // Register with Socket.IO for real-time events
                registerSocketUser(user.uid);
                // Log login activity
                if (!loginLoggedRef.current) {
                  loginLoggedRef.current = true;
                  apiClient.post('/activity-logs', {
                    action: 'login',
                    userEmail: user.email || '',
                    userName: backendUserData.displayName || backendUserData.fullName || `${backendUserData.firstName || ''} ${backendUserData.lastName || ''}`.trim() || user.email,
                    userRole: backendUserData.role || '',
                  }).catch(err => console.error('Activity log error:', err));
                }
              } catch (userError) {
                // If regular user fetch fails, try to fetch as attorney
                console.log('Not found as regular user, checking if attorney...');
                try {
                  const attorneyResponse = await apiClient.post('/auth/verify-attorney', {
                    email: user.email,
                  });

                  if (attorneyResponse.data.success) {
                    const attorneyData = attorneyResponse.data.data;
                    setUserData(attorneyData);
                    console.log('Attorney data loaded:', attorneyData);
                    // Register with Socket.IO for real-time events
                    registerSocketUser(user.uid);

                    // Log login activity for attorney
                    if (!loginLoggedRef.current) {
                      loginLoggedRef.current = true;
                      apiClient.post('/activity-logs', {
                        action: 'login',
                        userEmail: user.email || '',
                        userName: attorneyData.displayName || attorneyData.fullName || `${attorneyData.firstName || ''} ${attorneyData.lastName || ''}`.trim() || user.email,
                        userRole: attorneyData.role || '',
                      }).catch(err => console.error('Activity log error:', err));
                    }
                  } else {
                    throw new Error('Not found as attorney either');
                  }
                } catch (attorneyError) {
                  // Not an attorney either, create as regular user
                  console.log('Not found as attorney, creating new regular user...');

                  const displayName = user.displayName || '';
                  const nameParts = displayName.split(' ');
                  const firstName = nameParts[0] || '';
                  const lastName = nameParts.slice(1).join(' ') || '';
                  const username = user.email;

                  const { registerUser } = await import('@/features/auth/register');
                  await registerUser(firstName, lastName, username);

                  const newUserData = await getUserData();
                  setUserData(newUserData);
                  console.log('New user created and loaded:', newUserData);
                }
              }
            } catch (error) {
              console.error('Failed to fetch any user data:', error);
              setUserData(null);
            }
          } else {
            console.log('User is not verified yet — skipping backend sync');
            setUserData(null);
          }
        } catch (error) {
          console.error('Failed to fetch user data:', error);
          setUserData(null);
        } finally {
          console.log('Setting loading to false');
          setLoading(false);
        }
      } else {
        // Clear everything when user logs out
        setCurrentUser(null);
        setUserLoggedIn(false);
        setUserData(null);
        loginLoggedRef.current = false;
        disconnectSocket();

        // Clear localStorage
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('userName');
        localStorage.removeItem('role');

        console.log('Setting loading to false (no user)');
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const refreshUserData = async () => {
    if (currentUser) {
      try {
        const backendUserData = await getUserData();
        setUserData(backendUserData);
        return backendUserData;
      } catch (error) {
        console.error("Failed to refresh user data:", error);
      }
    }
  };

  const value = {
    currentUser,
    userLoggedIn,
    loading,
    userData,
    isAdmin: userData?.role === "secretary",
    isVerified: userData?.isVerified || false,
    refreshUserData,
  };

  console.log('AuthContext state:', { loading, userLoggedIn, hasUserData: !!userData });

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}