import { useState, useEffect, useCallback } from 'react';
import { fetchProfiles } from '@/api/admin/userManagement';
import { useAuth } from '@/context/authContext';

export function useProfiles() {
  // Get auth context to wait for authentication
  const { currentUser, loading: authLoading } = useAuth();
  
  // 1. State to store the list of profiles, loading status, and any errors.
  const [profiles, setProfiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // 2. The function to fetch data.
  //    useCallback prevents this function from being recreated on every render.
  const fetchProfilesData = useCallback(async () => {
    // Don't fetch if auth is still loading or user is not authenticated
    if (authLoading || !currentUser) {
      console.log('Waiting for authentication...', { authLoading, hasUser: !!currentUser });
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      console.log('Fetching profiles with authenticated user...');
      const data = await fetchProfiles();
      setProfiles(data);
    } catch (err) {
      console.error('Failed to fetch profiles:', err);
      setError(err.message || 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [authLoading, currentUser]);

  // 3. useEffect to run the fetch function when auth is ready
  useEffect(() => {
    fetchProfilesData();
  }, [fetchProfilesData]);

  // 4. Return the state and the refetch function for the component to use.
  return { profiles, isLoading, error, refetch: fetchProfilesData };
}

export const useUsers = useProfiles;
