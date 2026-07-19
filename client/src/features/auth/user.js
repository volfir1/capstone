import client from '../../config/api/apiClient'

export const getUserData = async () => {
    try {
        const response = await client.get('/users/profile')
        return response.data.data
    } catch (error) {
        console.error('Failed to get user data:', error)
        throw error 
    }
}