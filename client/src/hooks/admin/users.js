import { useState, useEffect, useCallback } from 'react';
import { fetchUsers } from '@/api/admin/userManagement';

export function useUsers() {
  // 1. State to store the list of users, loading status, and any errors.
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // 2. The function to fetch data.
  //    useCallback prevents this function from being recreated on every render.
  const fetchUsersData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchUsers();
      setUsers(data);
    } catch (err) {
      setError(err.message || 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 3. useEffect to run the fetch function when the hook is first used.
  useEffect(() => {
    fetchUsersData();
  }, [fetchUsersData]); // It runs once because fetchUsersData is stable.

  // 4. Return the state and the refetch function for the component to use.
  return { users, isLoading, error, refetch: fetchUsersData };
}