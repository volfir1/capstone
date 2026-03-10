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

const ADMIN_ROLES = new Set(['secretary', 'supervising_lawyer', 'director', 'intern']);

export default function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userLoggedIn, setUserLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const currentUidRef = useRef(null); // ✅ ref to track uid across closure

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);

      if (user) {
        currentUidRef.current = user.uid; // ✅ store uid in ref
        setCurrentUser({ ...user });
        setUserLoggedIn(true);

        try {
          await user.reload();

          if (!user.emailVerified) {
            setUserData(null);
            return;
          }

          try {
            await verifyUser();
          } catch (err) {
            console.error('Backend verification sync failed:', err);
          }

          try {
            const backendUserData = await getUserData();
            setUserData(backendUserData);

            registerSocketUser(user.uid);

            const sessionKey = `login_logged_${user.uid}`;
            if (!sessionStorage.getItem(sessionKey)) {
              sessionStorage.setItem(sessionKey, 'true');

              const userName = `${backendUserData.firstName || ''} ${backendUserData.lastName || ''}`.trim()
                || user.email;

              apiClient.post('/activity-logs', {
                action: 'login',
                userEmail: user.email || '',
                userName,
                userRole: backendUserData.role || '',
                firstName: backendUserData.firstName || '',
                lastName: backendUserData.lastName || '',
              }).catch(err => console.error('Activity log error:', err));
            }

          } catch (userError) {
            console.log('User not found in backend, registering as new user...');
            try {
              const displayName = user.displayName || '';
              const nameParts = displayName.split(' ');
              const firstName = nameParts[0] || '';
              const lastName = nameParts.slice(1).join(' ') || '';
              const username = user.email;

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
        // ✅ ref always has the real uid, no stale closure issue
        const lastUid = currentUidRef.current;
        if (lastUid) {
          sessionStorage.removeItem(`login_logged_${lastUid}`);
          currentUidRef.current = null;
        }

        setCurrentUser(null);
        setUserLoggedIn(false);
        setUserData(null);
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