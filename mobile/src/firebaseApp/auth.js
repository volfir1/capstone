import { auth } from "./firebase";
import { 
    createUserWithEmailAndPassword, 
    sendEmailVerification, 
    sendPasswordResetEmail, 
    signInWithEmailAndPassword, 
    updatePassword,
    signOut
} from "firebase/auth";

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

export const doSignOut = async () => {
    try {
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