import React, { useContext, useEffect, useState } from "react";
import { auth } from "../../firebase/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { getUserData } from "@/features/auth/user";
import { verifyUser } from "@/features/auth/auth";

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
              const backendUserData = await getUserData();
              setUserData(backendUserData);
              console.log('User data loaded:', backendUserData);
            } catch (userError) {
              console.log('User not found in MongoDB, creating new user...');

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
        setLoading(true);

        await currentUser.reload();

        if (currentUser.emailVerified) {
          await verifyUser(); 
        }

        const backendUserData = await getUserData();
        setUserData(backendUserData);
      } catch (error) {
        console.error("Failed to refresh user data:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  const value = {
    currentUser,
    userLoggedIn,
    loading,
    userData,
    isAdmin: userData?.role === "admin",
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