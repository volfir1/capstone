import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut, updateProfile } from 'firebase/auth';
import { auth } from '../firebaseApp/firebase';
import { 
  doCreateUserWithEmailAndPassword, 
  doSigninWithEmailAndPassword,
  doSendEmailVerification 
} from '../firebaseApp/auth';
import { getUserData } from '../features/auth/user';
import { verifyUser } from '../features/auth/auth';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userLoggedIn, setUserLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [userData, setUserData] = useState(null);

  // Monitor auth state changes - THIS IS KEY!
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, initializeUser);
    return unsubscribe;
  }, []);

  // This function runs EVERY TIME auth state changes (login, logout, etc.)
  async function initializeUser(user) {
    if (user) {
      setCurrentUser({ ...user });
      setUserLoggedIn(true);

      try {
        await user.reload(); // Refresh user data from Firebase

        // Always sync verification status with backend first
        if (user.emailVerified) {
          console.log('User is verified in Firebase, syncing verification with backend...');
          
          try {
            await verifyUser(); // This updates MongoDB isVerified: true
            console.log('Backend verification status updated');
          } catch (verifyError) {
            console.log('Failed to update backend verification:', verifyError);
          }

          // Then fetch/create user data
          try {
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

            const { registerUser } = await import('../features/auth/register');
            await registerUser(firstName, lastName, username);

            const newUserData = await getUserData();
            setUserData(newUserData);
            console.log('New user created and loaded:', newUserData);
          }
        } else {
          // Email not verified yet — don't fetch or create backend user
          console.log('User is not verified yet — skipping backend sync');
          setUserData(null);
        }
      } catch (error) {
        console.error('Failed to fetch user data:', error);
        setUserData(null);
      }
    } else {
      setCurrentUser(null);
      setUserLoggedIn(false);
      setUserData(null);
    }
    
    if (initializing) setInitializing(false);
    setIsLoading(false);
  }

  // Login function - simplified since initializeUser handles the rest
  const login = async (email, password) => {
    try {
      setIsLoading(true);
      const userCredential = await doSigninWithEmailAndPassword(email, password);
      // Don't need to do anything else here - onAuthStateChanged will trigger initializeUser
      return userCredential;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Rest of your functions stay the same...
  const register = async (userData) => {
    try {
      setIsLoading(true);
      const { email, password, firstName, lastName, username } = userData;
      
      console.log('Step 1: Creating Firebase user with:', { email, password: 'hidden' });
      const userCredential = await doCreateUserWithEmailAndPassword(email, password);

      await updateProfile(userCredential.user, {
        displayName: `${firstName} ${lastName}`
      });

      console.log('Step 2: Sending verification email...');
      await doSendEmailVerification();

      console.log('Step 3: Registering user with values:', {
        firstName, lastName, username: username || email
      });
      
      const { registerUser } = await import('../features/auth/register');
      await registerUser(firstName, lastName, username || email);

      await signOut(auth);
      return userCredential;
    } catch (error) {
      console.error('Register error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const googleSignIn = async () => {
    try {
      setIsLoading(true);
      throw new Error('Google Sign-In not implemented yet');
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const getAuthErrorMessage = (errorCode) => {
    switch (errorCode) {
      case 'auth/user-not-found':
        return 'No account found with this email.';
      case 'auth/wrong-password':
        return 'Incorrect password.';
      case 'auth/invalid-email':
        return 'Invalid email address.';
      case 'auth/email-already-in-use':
        return 'An account with this email already exists.';
      case 'auth/weak-password':
        return 'Password should be at least 6 characters.';
      default:
        return 'An error occurred. Please try again.';
    }
  };

  const value = {
    user: currentUser,
    isLoading,
    initializing,
    login,
    register,
    googleSignIn,
    logout,
    getAuthErrorMessage,
    currentUser,
    userLoggedIn,
    userData,
    isVerified: userData?.isVerified || false,
  };

  return (
    <AuthContext.Provider value={value}>
      {!initializing && children}
    </AuthContext.Provider>
  );
};