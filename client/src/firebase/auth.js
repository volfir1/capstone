import { auth } from "./firebase";

import { createUserWithEmailAndPassword, GoogleAuthProvider, sendEmailVerification, sendPasswordResetEmail, signInWithEmailAndPassword, signInWithPopup, updatePassword } from "firebase/auth";

export const doCreateUserWithEmailAndPassword = async (email, password) =>{
    return createUserWithEmailAndPassword(auth, email, password)
}

export const doSigninWithEmailAndPassword = (email, password) =>{
    return signInWithEmailAndPassword(auth, email, password)
}

export const doSignInWithGoogle = async () =>{
    const provider =  new GoogleAuthProvider()
    // Request Google Calendar scopes so the OAuth access token can be used to insert events
    provider.addScope('https://www.googleapis.com/auth/calendar');
    provider.addScope('https://www.googleapis.com/auth/calendar.events');
    // Ask for consent to ensure scopes are granted
    provider.setCustomParameters({ prompt: 'consent' });
    const result = await signInWithPopup(auth, provider)

    // Try to extract credential and access token and attach to returned result
    try {
        const credential = GoogleAuthProvider.credentialFromResult(result);
        const accessToken = credential?.accessToken;
        // attach for callers
        result.credential = credential;
        result.googleAccessToken = accessToken;
        if (accessToken) {
            try { localStorage.setItem('googleAccessToken', accessToken); } catch(_) {}
        }
    } catch (err) {
        console.warn('doSignInWithGoogle: failed to extract credential', err);
    }

    // save to firestore
    // result.user
    return result
}

export const doSignOut = () =>{
    // Clear all localStorage items related to authentication
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    localStorage.removeItem('role');
    localStorage.removeItem('taguig_geocoding_cache');
    // Clear cached Google access token
    localStorage.removeItem('googleAccessToken');
    
    return auth.signOut()
}

// for email verification
export const doSendEmailVerification = () => {
    return sendEmailVerification(auth.currentUser, {
        // Redirect to landing page after email verification
        url: `${window.location.origin}/`
    })
}

// For Password Reset
export const doPasswordReset = (email) =>{
    return sendPasswordResetEmail(auth, email)
}

// For Email Verification
export const doPasswordChange = (password) =>{
    return updatePassword(auth.currentUser, password)
}