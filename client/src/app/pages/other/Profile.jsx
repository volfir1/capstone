import React, { useState, useEffect } from 'react';
import { Box, Center, Loader, Stack, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { THEMED_LIGHT_BG, MUTED_OLIVE } from '@utils/constants';
import { useAuth } from '@/context/authContext';
import ClientProfile from './Profiles/UserProfile';
import AttorneyProfile from './Profiles/AttorneyProfile';
import AdminProfile from './Profiles/AdminProfile';

export default function Profile() {
  const { currentUser, userRole } = useAuth();
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState(null);

  useEffect(() => {
    // Determine user role
    const determineRole = async () => {
      try {
        if (userRole) {
          setRole(userRole);
        } else if (currentUser) {
          // Fallback: try to get role from user object
          const userRoleFromObject = currentUser.role || 'user';
          setRole(userRoleFromObject);
        }
      } catch (error) {
        console.error('Error determining user role:', error);
        notifications.show({
          title: 'Error',
          message: 'Failed to determine user role',
          color: 'red',
        });
      } finally {
        setLoading(false);
      }
    };

    determineRole();
  }, [currentUser, userRole]);

  if (loading) {
    return (
      <Box bg={THEMED_LIGHT_BG} mih="100vh" py="xl">
        <Center py="xl">
          <Stack align="center" gap="md">
            <Loader size="lg" />
            <Text c={MUTED_OLIVE}>Loading profile...</Text>
          </Stack>
        </Center>
      </Box>
    );
  }

  // Render the appropriate profile component based on role
  switch (role) {
    case 'user':
    case 'client':
      return <ClientProfile />;
    
    case 'attorney':
    case 'pao_lawyer':
    case 'legal_volunteer':
      return <AttorneyProfile />;
    
    case 'admin':
    case 'superadmin':
      return <AdminProfile />;
    
    default:
      return (
        <Box bg={THEMED_LIGHT_BG} mih="100vh" py="xl">
          <Center py="xl">
            <Stack align="center" gap="md">
              <Text size="lg" fw={600}>
                Unable to load profile
              </Text>
              <Text c={MUTED_OLIVE} ta="center">
                Your account role could not be determined. Please contact support.
              </Text>
            </Stack>
          </Center>
        </Box>
      );
  }
}