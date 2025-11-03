import client from "@config/api/apiClient";

export const verifyUser = async () => {
    try {
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