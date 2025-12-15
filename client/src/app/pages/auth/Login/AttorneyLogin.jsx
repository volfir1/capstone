import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import {
  Container,
  Paper,
  Title,
  Text,
  TextInput,
  PasswordInput,
  Button,
  Group,
  Stack,
  Box,
  Divider,
  Center,
  Anchor,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconBriefcase, IconMail, IconLock } from '@tabler/icons-react';
import { PRIMARY_GOLD, PRIMARY_BROWN, MUTED_OLIVE, THEMED_LIGHT_BG, CHARCOAL } from '@utils/constants';
import { useAuth } from '@/context/authContext';
import { doSigninWithEmailAndPassword, doSignOut } from '@/firebase/auth';
import apiClient from '@config/api/apiClient';

export default function AttorneyLogin() {
  const navigate = useNavigate();
  const { getAuthErrorMessage } = useAuth();
  const hasNavigated = useRef(false);
  const [loading, setLoading] = useState(false);
  const [attorneyData, setAttorneyData] = useState(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // Handle navigation when attorney data is loaded
  useEffect(() => {
    if (attorneyData && !hasNavigated.current) {
      console.log('Attorney data loaded, checking role for navigation');
      hasNavigated.current = true;
      // Navigate based on role
      if (attorneyData.role === 'admin') {
        console.log('Admin role detected, navigating to admin dashboard');
        navigate('/admin');
      } else if (attorneyData.role === 'intern') {
        console.log('Intern role detected, navigating to intern dashboard');
        navigate('/intern');
      } else {
        console.log('Attorney role detected, navigating to attorney dashboard');
        navigate('/attorney');
      }
    }
  }, [attorneyData, navigate]);

  const handleAttorneyLogin = async (data) => {
    try {
      setLoading(true);
      console.log('Step 1: Signing in with Firebase');
      console.log('Attempting login with email:', data.email);

      const userCredential = await doSigninWithEmailAndPassword(
        data.email,
        data.password
      );
      const user = userCredential.user;
      console.log('Firebase login successful for:', user.email);

      console.log('Step 2: Checking attorney in MongoDB');
      try {
        const response = await apiClient.post('/auth/verify-attorney', {
          email: data.email,
        });

        if (!response.data.success) {
          notifications.show({
            title: 'Login Failed',
            message: response.data.message,
            color: 'red',
          });
          await doSignOut();
          setLoading(false);
          return;
        }

        const attorney = response.data.data;

        // Check if attorney is verified in MongoDB
        if (!attorney.isVerified) {
          notifications.show({
            title: 'Account Not Verified',
            message: 'Your attorney account is pending verification. Please wait for admin approval.',
            color: 'orange',
          });
          await doSignOut();
          setLoading(false);
          return;
        }

        // Check account status
        if (attorney.accountStatus !== 'active') {
          notifications.show({
            title: 'Account Inactive',
            message: `Your account is currently ${attorney.accountStatus}. Please contact support.`,
            color: 'red',
          });
          await doSignOut();
          setLoading(false);
          return;
        }

        console.log('Step 3: Attorney verified, logging in');
        setAttorneyData(attorney);
        setLoading(false);
      } catch (backendError) {
        console.error('Backend verification error:', backendError);
        let errorMessage = 'Failed to verify attorney account.';
        
        if (backendError.response?.status === 404) {
          errorMessage = 'Attorney account not found. Please sign up as an attorney first.';
        } else if (backendError.response?.data?.message) {
          errorMessage = backendError.response.data.message;
        }

        notifications.show({
          title: 'Login Failed',
          message: errorMessage,
          color: 'red',
        });
        await doSignOut();
        setLoading(false);
        return;
      }
    } catch (error) {
      console.error('Attorney login error:', error);
      let errorMessage = 'An error occurred during login.';

      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found') {
        errorMessage = 'Invalid email or password. Make sure you signed up as an attorney first.';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password. Please try again.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email format.';
      } else if (getAuthErrorMessage) {
        errorMessage = getAuthErrorMessage(error.code) || error.message;
      } else {
        errorMessage = error.message;
      }

      notifications.show({
        title: 'Login Failed',
        message: errorMessage,
        color: 'red',
      });
      setLoading(false);
    }
  };

  return (
    <Box bg={THEMED_LIGHT_BG} mih="100vh" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }} py="xl">
      <style>
        {`
          ::-webkit-scrollbar {
            width: 8px;
          }
          ::-webkit-scrollbar-track {
            background: transparent;
          }
          ::-webkit-scrollbar-thumb {
            background: ${MUTED_OLIVE};
            border-radius: 4px;
          }
          ::-webkit-scrollbar-thumb:hover {
            background: ${PRIMARY_BROWN};
          }
          * {
            scrollbar-width: thin;
            scrollbar-color: ${MUTED_OLIVE} transparent;
          }
        `}
      </style>
      <Container size="sm" style={{ maxWidth: '600px' }}>
        <Paper shadow="xs" p="xl" radius="lg" bg="white">
          <Stack gap="xl">
            {/* Header Section */}
            <Stack gap="md" align="center">
              <Box
                style={{
                  width: 70,
                  height: 70,
                  backgroundColor: PRIMARY_BROWN,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: `3px solid ${PRIMARY_GOLD}`,
                }}
              >
                <IconBriefcase size={36} color="white" stroke={2} />
              </Box>
              <Box style={{ textAlign: 'center' }}>
                <Title order={2} c={CHARCOAL} mb={4}>
                  Attorney Portal
                </Title>
                <Text size="sm" c={MUTED_OLIVE}>
                  Sign in to your attorney account
                </Text>
              </Box>
            </Stack>

            <Divider color="#F0F0F0" />

            {/* Form Section */}
            <form onSubmit={handleSubmit(handleAttorneyLogin)}>
              <Group grow align="flex-start" gap="lg">
                {/* Email Input */}
                <Box style={{ flex: 1 }}>
                  <Group gap={8} mb={8}>
                    <Text size="sm" fw={600} c={CHARCOAL}>Email</Text>
                    <Text size="sm" c="red">*</Text>
                  </Group>
                  <Controller
                    name="email"
                    control={control}
                    rules={{
                      required: 'Email is required',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Invalid email address',
                      },
                    }}
                    render={({ field }) => (
                      <TextInput
                        {...field}
                        placeholder="attorney@example.com"
                        leftSection={<IconMail size={18} color={MUTED_OLIVE} />}
                        size="md"
                        error={errors.email?.message}
                        disabled={loading}
                        styles={{
                          input: {
                            borderColor: errors.email ? '#E74C3C' : '#E0E0E0',
                            '&:focus': {
                              borderColor: errors.email ? '#E74C3C' : PRIMARY_BROWN,
                            },
                          },
                        }}
                      />
                    )}
                  />
                </Box>

                {/* Password Input */}
                <Box style={{ flex: 1 }}>
                  <Group gap={8} mb={8}>
                    <Text size="sm" fw={600} c={CHARCOAL}>Password</Text>
                    <Text size="sm" c="red">*</Text>
                  </Group>
                  <Controller
                    name="password"
                    control={control}
                    rules={{
                      required: 'Password is required',
                      minLength: {
                        value: 6,
                        message: 'Password must be at least 6 characters',
                      },
                    }}
                    render={({ field }) => (
                      <PasswordInput
                        {...field}
                        placeholder="Enter your password"
                        leftSection={<IconLock size={18} color={MUTED_OLIVE} />}
                        size="md"
                        error={errors.password?.message}
                        disabled={loading}
                        styles={{
                          input: {
                            borderColor: errors.password ? '#E74C3C' : '#E0E0E0',
                            '&:focus': {
                              borderColor: errors.password ? '#E74C3C' : PRIMARY_BROWN,
                            },
                          },
                        }}
                      />
                    )}
                  />
                </Box>
              </Group>

              {/* Login Button */}
              <Button
                type="submit"
                size="md"
                fullWidth
                loading={loading}
                mt="lg"
                style={{
                  backgroundColor: PRIMARY_BROWN,
                }}
              >
                {loading ? 'Signing in...' : 'Sign in as Attorney'}
              </Button>
            </form>

            {/* Divider */}
            <Divider label="or" labelPosition="center" color="#F0F0F0" />

            {/* Sign Up Link */}
            <Paper p="md" radius="md" style={{ backgroundColor: THEMED_LIGHT_BG, border: '1px solid #F0F0F0' }}>
              <Center>
                <Text size="sm" c={CHARCOAL}>
                  Don't have an attorney account?{' '}
                  <Anchor
                    component="button"
                    type="button"
                    onClick={() => navigate('/auth/attorneysignup')}
                    c={PRIMARY_BROWN}
                    fw={600}
                    style={{ textDecoration: 'none' }}
                  >
                    Sign up
                  </Anchor>
                </Text>
              </Center>
            </Paper>

            {/* Back to User Login */}
            <Center>
              <Text size="sm" c={MUTED_OLIVE}>
                Not an attorney?{' '}
                <Anchor
                  component="button"
                  type="button"
                  onClick={() => navigate('/auth/login')}
                  c={PRIMARY_BROWN}
                  fw={600}
                  style={{ textDecoration: 'none' }}
                >
                  User Login
                </Anchor>
              </Text>
            </Center>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}