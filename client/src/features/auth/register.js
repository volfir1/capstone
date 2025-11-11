import client from '@config/api/apiClient'

export const registerUser = async (firstName, lastName, email, username = null) => {
    try {
        console.log("registering...")
        
        // Log what we're sending
        const payload = {
            firstName,
            lastName,
            email,
            username: username || email
        };
        
        console.log("Sending to backend:", payload);
        
        const response = await client.post('/auth/register', payload);
        
        console.log('Registration successful', response.data)
        return response.data

    } catch (error) {
        console.error('Registration failed', error.response?.data)
        throw error
    }
}