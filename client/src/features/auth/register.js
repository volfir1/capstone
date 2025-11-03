import client from '@config/api/apiClient'

export const registerUser = async (firstName, lastName, username) => {
    try {
        console.log("registering...")
        
        const response = await client.post('/auth/register', {
            firstName,
            lastName,
            username
        })
        
        console.log('Registration successful', response.data)
        return response.data

    } catch (error) {
        console.error('Registration failed', error.response?.data)
        throw error
    }
}