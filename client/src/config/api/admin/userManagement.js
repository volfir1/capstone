import { getAuth } from "firebase/auth";
import client from "../apiClient";
/**
 * Fetches a list of all users from the backend.
 * This function must be called by an authenticated admin user.
 * @returns {Promise<Array>} A promise that resolves to an array of user objects.
 */


export async function fetchUsers () {
    try{
        const response = await client.get('/users/fetchUsers')

        return response.data.data
    }catch (error) {
    // Axios provides better error details
    console.error("Failed to fetch users:", error.response?.data?.message || error.message);
    throw new Error(error.response?.data?.message || 'Could not fetch users.');
  }
}