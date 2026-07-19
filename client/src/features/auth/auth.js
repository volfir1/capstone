import client from "@config/api/apiClient";
import { auth } from '@/firebase/firebase';

export const verifyUser = async () => {
    try {
        // Ensure we send a fresh ID token so Firebase emailVerified state is up-to-date
        const user = auth.currentUser;
        if (user) {
            const fresh = await user.getIdToken(true);
            const response = await client.put('/auth/verify-user', null, { headers: { Authorization: `Bearer ${fresh}` } });
            return response.data;
        }
        const response = await client.put('/auth/verify-user');
        return response.data;
    } catch (error) {
        console.error('Failed to verify user', error);
        throw error;
    }
}

export const checkEmailExists = async (email) => {
    try {
        const response = await client.post('/auth/check-email', { email });
        return response.data;
    } catch (error) {
        console.error('Failed to check email', error);
        throw error;
    }
}