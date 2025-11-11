import { getAuth, getIdToken } from 'firebase/auth';
import apiClient from '../../api/apiClient';

export const registerUser = async (firstName, lastName, email, username) => {
  try {
    console.log("registering...");
    
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) {
      throw new Error('No authenticated user found');
    }
    
    const idToken = await getIdToken(user);
    console.log("Got token", idToken);
    
    // Make sure we're sending the right data
    const payload = {
      idToken,
      firstName: firstName,
      lastName: lastName,
      email: email,
      username: username
    };
    
    console.log("Sending payload:", payload);
    
    const response = await apiClient.post('/auth/register', payload);
    
    console.log("Registration successful", response.data);
    return response.data;
    
  } catch (error) {
    console.error("Registration failed", error.response?.data || error.message);
    throw error;
  }
};