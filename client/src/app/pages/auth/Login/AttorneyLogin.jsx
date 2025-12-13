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
    <Box
      style={{
        minHeight: '100vh',
        backgroundColor: '#F9F6F1',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
      }}
    >
      <Container size="xs">
        <Paper p="xl" radius="lg" shadow="xl" style={{ backgroundColor: 'white' }}>
          <Stack spacing="xl">
            {/* Hero Section */}
            <Center>
              <Stack spacing="md" align="center">
                <Box
                  style={{
                    width: 80,
                    height: 80,
                    backgroundColor: THEMED_LIGHT_BG,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <IconBriefcase size={48} color={PRIMARY_GOLD} />
                </Box>
                <Box style={{ textAlign: 'center' }}>
                  <Title order={1} style={{ color: PRIMARY_BROWN, marginBottom: '0.5rem' }}>
                    Attorney Portal
                  </Title>
                  <Text size="sm" color="dimmed">
                    Sign in to your attorney account
                  </Text>
                </Box>
              </Stack>
            </Center>

            <Divider />

            {/* Form Section */}
            <form onSubmit={handleSubmit(handleAttorneyLogin)}>
              <Stack spacing="md">
                {/* Email Input */}
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
                      label="Email"
                      placeholder="Enter your email"
                      icon={<IconMail size={18} />}
                      size="md"
                      required
                      error={errors.email?.message}
                      disabled={loading}
                      styles={{
                        input: { backgroundColor: THEMED_LIGHT_BG },
                      }}
                    />
                  )}
                />

                {/* Password Input */}
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
                      label="Password"
                      placeholder="Enter your password"
                      icon={<IconLock size={18} />}
                      size="md"
                      required
                      error={errors.password?.message}
                      disabled={loading}
                      styles={{
                        input: { backgroundColor: THEMED_LIGHT_BG },
                      }}
                    />
                  )}
                />

                {/* Login Button */}
                <Button
                  type="submit"
                  size="md"
                  fullWidth
                  loading={loading}
                  style={{
                    backgroundColor: PRIMARY_BROWN,
                    marginTop: '1rem',
                  }}
                  styles={{
                    root: {
                      '&:hover': {
                        backgroundColor: '#6B4423',
                      },
                    },
                  }}
                >
                  {loading ? 'Signing in...' : 'Sign in as Attorney'}
                </Button>
              </Stack>
            </form>

            {/* Divider */}
            <Divider label="or" labelPosition="center" />

            {/* Sign Up Link */}
            <Center>
              <Text size="sm" color="dimmed">
                Don't have an attorney account?{' '}
                <Anchor
                  component="button"
                  type="button"
                  onClick={() => navigate('/auth/attorneysignup')}
                  style={{ color: PRIMARY_BROWN, fontWeight: 600 }}
                >
                  Sign up
                </Anchor>
              </Text>
            </Center>

            {/* Back to User Login */}
            <Center>
              <Text size="sm" color="dimmed">
                Not an attorney?{' '}
                <Anchor
                  component="button"
                  type="button"
                  onClick={() => navigate('/auth/login')}
                  style={{ color: PRIMARY_BROWN, fontWeight: 600 }}
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