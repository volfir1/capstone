import { auth } from "./firebase";
import { 
    createUserWithEmailAndPassword, 
    sendEmailVerification, 
    sendPasswordResetEmail, 
    signInWithEmailAndPassword, 
    updatePassword,
    signOut,
    GoogleAuthProvider,
    signInWithCredential
} from "firebase/auth";
import { GoogleSignin } from '@react-native-google-signin/google-signin';

// Configure Google Sign-In once
GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  offlineAccess: true,
  forceCodeForRefreshToken: true,
});

export const doCreateUserWithEmailAndPassword = async (email, password) => {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        return userCredential;
    } catch (error) {
        throw error;
    }
};

export const doSigninWithEmailAndPassword = async (email, password) => {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return userCredential;
    } catch (error) {
        throw error;
    }
};

export const doSignInWithGoogle = async () => {
    try {
        // Check if device supports Google Play Services
        await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
        
        // Sign out first to force account selection - use try/catch in case not signed in
        try {
            await GoogleSignin.signOut();
        } catch (signOutError) {
            // Ignore error if not signed in
            console.log('Not previously signed in, continuing...');
        }
        
        // Sign in and get user info - this will now show account picker
        const userInfo = await GoogleSignin.signIn();
        
        // Get the idToken
        const idToken = userInfo.idToken || userInfo.data?.idToken;
        
        if (!idToken) {
            throw new Error('No idToken received from Google Sign-In');
        }
        
        // Create Firebase credential with the token
        const googleCredential = GoogleAuthProvider.credential(idToken);
        
        // Sign in to Firebase with the credential
        const userCredential = await signInWithCredential(auth, googleCredential);
        
        return userCredential;
    } catch (error) {
        throw error;
    }
};

export const doSignOut = async () => {
    try {
        console.trace('doSignOut invoked (firebaseApp/auth.js)');
        // Sign out from Google - use try/catch in case not signed in
        try {
            await GoogleSignin.signOut();
        } catch (signOutError) {
            // Ignore error if not signed in with Google
            console.log('Not signed in with Google, continuing...');
        }
        
        // Sign out from Firebase
        await signOut(auth);
    } catch (error) {
        throw error;
    }
};

export const doSendEmailVerification = async () => {
    try {
        if (auth.currentUser) {
            await sendEmailVerification(auth.currentUser);
        }
    } catch (error) {
        throw error;
    }
};

export const doPasswordReset = async (email) => {
    try {
        await sendPasswordResetEmail(auth, email);
    } catch (error) {
        throw error;
    }
};

export const doPasswordChange = async (password) => {
    try {
        if (auth.currentUser) {
            await updatePassword(auth.currentUser, password);
        }
    } catch (error) {
        throw error;
    }
};

export const isSignedInWithGoogle = async () => {
    return await GoogleSignin.isSignedIn();
};