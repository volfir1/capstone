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
    const result = await signInWithPopup(auth, provider)

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
    
    return auth.signOut()
}

// for email verification
export const doSendEmailVerification = () => {
    return sendEmailVerification(auth.currentUser, {
        url: `${window.location.origin}/login`
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