import React, { useState } from 'react';
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
  Select,
  Textarea,
  Checkbox,
  Grid,
  Stepper,
  ActionIcon,
  Divider,
  MultiSelect,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconArrowLeft,
  IconBriefcase,
  IconUser,
  IconFileText,
  IconMapPin,
  IconCheck,
} from '@tabler/icons-react';
import { PRIMARY_GOLD, PRIMARY_BROWN, MUTED_OLIVE, THEMED_LIGHT_BG, CHARCOAL } from '@utils/constants';
import { useAuth } from '@/context/authContext';
import {
  doCreateUserWithEmailAndPassword,
  doSendEmailVerification,
  doSignOut,
} from '@/firebase/auth';
import apiClient from '@config/api/apiClient';

const SPECIALIZATIONS = [
  { value: 'criminal', label: 'Criminal Law' },
  { value: 'civil', label: 'Civil Law' },
  { value: 'family', label: 'Family Law' },
  { value: 'labor', label: 'Labor Law' },
  { value: 'commercial', label: 'Commercial Law' },
  { value: 'tax', label: 'Tax Law' },
  { value: 'immigration', label: 'Immigration Law' },
  { value: 'property', label: 'Land and Property Law' },
  { value: 'human_rights', label: 'Human Rights' },
  { value: 'environmental', label: 'Environmental Law' },
  { value: 'agrarian', label: 'Agrarian Law' },
  { value: 'administrative', label: 'Administrative Law' },
  { value: 'corporate', label: 'Corporate Law' },
  { value: 'ip', label: 'Intellectual Property' },
  { value: 'other', label: 'Other' },
];

const LANGUAGES = [
  { value: 'english', label: 'English' },
  { value: 'filipino', label: 'Filipino/Tagalog' },
  { value: 'cebuano', label: 'Cebuano' },
  { value: 'ilocano', label: 'Ilocano' },
  { value: 'hiligaynon', label: 'Hiligaynon' },
  { value: 'waray', label: 'Waray' },
  { value: 'kapampangan', label: 'Kapampangan' },
  { value: 'bikol', label: 'Bikol' },
  { value: 'pangasinan', label: 'Pangasinan' },
  { value: 'other', label: 'Other' },
];

export default function AttorneySignup() {
  const navigate = useNavigate();
  const { getAuthErrorMessage } = useAuth();
  const [active, setActive] = useState(0);
  const [isRegistering, setIsRegistering] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
    trigger,
    getValues,
  } = useForm({
    defaultValues: {
      email: '',
      username: '',
      password: '',
      confirmPassword: '',
      firstName: '',
      middleName: '',
      lastName: '',
      suffix: '',
      role: 'attorney',
      prcLicenseNumber: '',
      ibrNumber: '',
      barAdmissionDate: '',
      phoneNumber: '',
      officeAddress: {
        street: '',
        barangay: '',
        city: '',
        province: '',
        region: '',
        zipCode: '',
      },
      lawFirm: '',
      specializations: [],
      languages: [],
      consultationMode: [],
      biography: '',
    },
  });

  const watchPassword = watch('password');

  const nextStep = async () => {
    let fieldsToValidate = [];
    
    if (active === 0) {
      fieldsToValidate = ['email', 'username', 'password', 'confirmPassword', 'firstName', 'lastName'];
    } else if (active === 1) {
      fieldsToValidate = ['role', 'prcLicenseNumber', 'ibrNumber', 'barAdmissionDate', 'phoneNumber'];
    } else if (active === 2) {
      fieldsToValidate = ['officeAddress.city', 'officeAddress.province', 'officeAddress.region'];
    }
    
    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      setActive(active + 1);
    }
  };

  const prevStep = () => setActive(active - 1);

  const handleAttorneySignup = async (data) => {
    if (isRegistering) return;

    if (data.password !== data.confirmPassword) {
      notifications.show({
        title: 'Password Mismatch',
        message: 'Passwords do not match. Please try again.',
        color: 'red',
      });
      return;
    }

    setIsRegistering(true);
    try {
      await doCreateUserWithEmailAndPassword(data.email, data.password);
      await doSendEmailVerification();

      try {
        const attorneyData = {
          email: data.email,
          username: data.username,
          firstName: data.firstName,
          middleName: data.middleName || '',
          lastName: data.lastName,
          suffix: data.suffix || '',
          role: data.role,
          prcLicenseNumber: data.prcLicenseNumber,
          ibrNumber: data.ibrNumber,
          barAdmissionDate: data.barAdmissionDate,
          phoneNumber: data.phoneNumber,
          officeAddress: data.officeAddress,
          lawFirm: data.lawFirm || '',
          isPAOLawyer: data.role === 'pao_lawyer',
          specializations: data.specializations,
          languages: data.languages,
          consultationMode: data.consultationMode,
          biography: data.biography || '',
        };

        await apiClient.post('/auth/register-attorney', attorneyData);
      } catch (registerError) {
        console.error('Backend registration error:', registerError);
      }

      await doSignOut();
      await new Promise((resolve) => setTimeout(resolve, 500));

      notifications.show({
        title: 'Attorney Account Created Successfully!',
        message: 'A verification email has been sent. Please verify before logging in.',
        color: 'green',
      });

      navigate('/auth/attorneylogin');
    } catch (error) {
      console.error('Attorney signup error:', error);
      try {
        await doSignOut();
      } catch (signOutError) {
        console.log('Sign out error:', signOutError);
      }

      const errorMessage =
        getAuthErrorMessage?.(error.code) ||
        error.message ||
        'An error occurred during registration.';
      
      notifications.show({
        title: 'Registration Failed',
        message: errorMessage,
        color: 'red',
      });
    } finally {
      setIsRegistering(false);
    }
  };

  const inputStyles = {
    input: { 
      backgroundColor: 'white',
      borderColor: '#E5E0D8',
      fontSize: '15px',
      padding: '12px 16px',
      height: '48px',
      '&:focus': {
        borderColor: PRIMARY_GOLD,
      }
    },
    label: {
      fontSize: '14px',
      fontWeight: 500,
      color: CHARCOAL,
      marginBottom: '8px',
    },
    error: {
      fontSize: '13px',
    }
  };

  const renderBasicInfo = () => (
    <Stack spacing="lg">
      <Box>
        <Text size="xs" weight={600} color={PRIMARY_BROWN} mb="md" style={{ letterSpacing: '0.5px', textTransform: 'uppercase' }}>
          Account Information
        </Text>
        <Stack spacing="md">
          <Controller
            name="email"
            control={control}
            rules={{ required: 'Email is required', pattern: { value: /^\S+@\S+$/i, message: 'Invalid email' } }}
            render={({ field }) => (
              <TextInput
                {...field}
                label="Email Address"
                placeholder="your.email@example.com"
                required
                error={errors.email?.message}
                styles={inputStyles}
              />
            )}
          />

          <Controller
            name="username"
            control={control}
            rules={{ required: 'Username is required', minLength: { value: 3, message: 'Min 3 characters' } }}
            render={({ field }) => (
              <TextInput
                {...field}
                label="Username"
                placeholder="Choose a unique username"
                required
                error={errors.username?.message}
                styles={inputStyles}
              />
            )}
          />

          <Grid gutter="md">
            <Grid.Col span={6}>
              <Controller
                name="password"
                control={control}
                rules={{ required: 'Password is required', minLength: { value: 6, message: 'Min 6 characters' } }}
                render={({ field }) => (
                  <PasswordInput
                    {...field}
                    label="Password"
                    placeholder="••••••••"
                    required
                    error={errors.password?.message}
                    description="At least 6 characters"
                    styles={inputStyles}
                  />
                )}
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <Controller
                name="confirmPassword"
                control={control}
                rules={{ 
                  required: 'Please confirm password',
                  validate: value => value === watchPassword || 'Passwords do not match'
                }}
                render={({ field }) => (
                  <PasswordInput
                    {...field}
                    label="Confirm Password"
                    placeholder="••••••••"
                    required
                    error={errors.confirmPassword?.message}
                    styles={inputStyles}
                  />
                )}
              />
            </Grid.Col>
          </Grid>
        </Stack>
      </Box>

      <Divider style={{ borderColor: '#E5E0D8' }} />

      <Box>
        <Text size="xs" weight={600} color={PRIMARY_BROWN} mb="md" style={{ letterSpacing: '0.5px', textTransform: 'uppercase' }}>
          Personal Information
        </Text>
        <Stack spacing="md">
          <Grid gutter="md">
            <Grid.Col span={6}>
              <Controller
                name="firstName"
                control={control}
                rules={{ required: 'First name is required' }}
                render={({ field }) => (
                  <TextInput
                    {...field}
                    label="First Name"
                    placeholder="Juan"
                    required
                    error={errors.firstName?.message}
                    styles={inputStyles}
                  />
                )}
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <Controller
                name="middleName"
                control={control}
                render={({ field }) => (
                  <TextInput
                    {...field}
                    label="Middle Name"
                    placeholder="Santos (optional)"
                    styles={inputStyles}
                  />
                )}
              />
            </Grid.Col>
          </Grid>

          <Grid gutter="md">
            <Grid.Col span={8}>
              <Controller
                name="lastName"
                control={control}
                rules={{ required: 'Last name is required' }}
                render={({ field }) => (
                  <TextInput
                    {...field}
                    label="Last Name"
                    placeholder="Dela Cruz"
                    required
                    error={errors.lastName?.message}
                    styles={inputStyles}
                  />
                )}
              />
            </Grid.Col>
            <Grid.Col span={4}>
              <Controller
                name="suffix"
                control={control}
                render={({ field }) => (
                  <TextInput
                    {...field}
                    label="Suffix"
                    placeholder="Jr., Sr., III"
                    styles={inputStyles}
                  />
                )}
              />
            </Grid.Col>
          </Grid>
        </Stack>
      </Box>
    </Stack>
  );

  const renderProfessionalInfo = () => (
    <Stack spacing="lg">
      <Box>
        <Text size="xs" weight={600} color={PRIMARY_BROWN} mb="md" style={{ letterSpacing: '0.5px', textTransform: 'uppercase' }}>
          Professional Details
        </Text>
        <Stack spacing="md">
          <Controller
            name="role"
            control={control}
            rules={{ required: 'Role is required' }}
            render={({ field }) => (
              <Select
                {...field}
                label="Professional Role"
                placeholder="Select your role"
                required
                data={[
                  { value: 'attorney', label: 'Attorney' },
                  { value: 'pao_lawyer', label: 'Legal Aid Lawyer' },
                  { value: 'legal_volunteer', label: 'Legal Volunteer' },
                ]}
                error={errors.role?.message}
                styles={inputStyles}
              />
            )}
          />

          <Grid gutter="md">
            <Grid.Col span={6}>
              <Controller
                name="prcLicenseNumber"
                control={control}
                rules={{ required: 'PRC License is required' }}
                render={({ field }) => (
                  <TextInput
                    {...field}
                    label="PRC License Number"
                    placeholder="1234567"
                    required
                    error={errors.prcLicenseNumber?.message}
                    styles={inputStyles}
                  />
                )}
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <Controller
                name="ibrNumber"
                control={control}
                rules={{ required: 'IBR Number is required' }}
                render={({ field }) => (
                  <TextInput
                    {...field}
                    label="IBR Number"
                    placeholder="IBR-1234567"
                    required
                    error={errors.ibrNumber?.message}
                    styles={inputStyles}
                  />
                )}
              />
            </Grid.Col>
          </Grid>

          <Grid gutter="md">
            <Grid.Col span={6}>
              <Controller
                name="barAdmissionDate"
                control={control}
                rules={{ required: 'Bar admission date is required' }}
                render={({ field }) => (
                  <TextInput
                    {...field}
                    label="Bar Admission Date"
                    type="date"
                    required
                    error={errors.barAdmissionDate?.message}
                    styles={inputStyles}
                  />
                )}
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <Controller
                name="phoneNumber"
                control={control}
                rules={{ required: 'Phone number is required' }}
                render={({ field }) => (
                  <TextInput
                    {...field}
                    label="Phone Number"
                    placeholder="+639171234567"
                    required
                    error={errors.phoneNumber?.message}
                    styles={inputStyles}
                  />
                )}
              />
            </Grid.Col>
          </Grid>

          <Controller
            name="lawFirm"
            control={control}
            render={({ field }) => (
              <TextInput
                {...field}
                label="Law Firm / Organization"
                placeholder="Enter law firm or organization name (optional)"
                styles={inputStyles}
              />
            )}
          />
        </Stack>
      </Box>
    </Stack>
  );

  const renderAddressInfo = () => (
    <Stack spacing="lg">
      <Box>
        <Text size="xs" weight={600} color={PRIMARY_BROWN} mb="md" style={{ letterSpacing: '0.5px', textTransform: 'uppercase' }}>
          Office Location
        </Text>
        <Stack spacing="md">
          <Controller
            name="officeAddress.street"
            control={control}
            render={({ field }) => (
              <TextInput
                {...field}
                label="Street Address"
                placeholder="Building name, street number (optional)"
                styles={inputStyles}
              />
            )}
          />

          <Grid gutter="md">
            <Grid.Col span={6}>
              <Controller
                name="officeAddress.barangay"
                control={control}
                render={({ field }) => (
                  <TextInput
                    {...field}
                    label="Barangay"
                    placeholder="Barangay name (optional)"
                    styles={inputStyles}
                  />
                )}
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <Controller
                name="officeAddress.zipCode"
                control={control}
                render={({ field }) => (
                  <TextInput
                    {...field}
                    label="Zip Code"
                    placeholder="1000 (optional)"
                    styles={inputStyles}
                  />
                )}
              />
            </Grid.Col>
          </Grid>

          <Grid gutter="md">
            <Grid.Col span={6}>
              <Controller
                name="officeAddress.city"
                control={control}
                rules={{ required: 'City is required' }}
                render={({ field }) => (
                  <TextInput
                    {...field}
                    label="City / Municipality"
                    placeholder="e.g., Quezon City"
                    required
                    error={errors.officeAddress?.city?.message}
                    styles={inputStyles}
                  />
                )}
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <Controller
                name="officeAddress.province"
                control={control}
                rules={{ required: 'Province is required' }}
                render={({ field }) => (
                  <TextInput
                    {...field}
                    label="Province"
                    placeholder="e.g., Metro Manila"
                    required
                    error={errors.officeAddress?.province?.message}
                    styles={inputStyles}
                  />
                )}
              />
            </Grid.Col>
          </Grid>

          <Controller
            name="officeAddress.region"
            control={control}
            rules={{ required: 'Region is required' }}
            render={({ field }) => (
              <TextInput
                {...field}
                label="Region"
                placeholder="e.g., NCR, Region III"
                required
                error={errors.officeAddress?.region?.message}
                styles={inputStyles}
              />
            )}
          />
        </Stack>
      </Box>
    </Stack>
  );

  const renderAdditionalInfo = () => (
    <Stack spacing="lg">
      <Box>
        <Text size="xs" weight={600} color={PRIMARY_BROWN} mb="md" style={{ letterSpacing: '0.5px', textTransform: 'uppercase' }}>
          Practice Areas & Languages
        </Text>
        <Stack spacing="md">
          <Controller
            name="specializations"
            control={control}
            render={({ field }) => (
              <MultiSelect
                {...field}
                label="Areas of Legal Specialization"
                placeholder="Select your practice areas"
                data={SPECIALIZATIONS}
                searchable
                styles={inputStyles}
              />
            )}
          />

          <Controller
            name="languages"
            control={control}
            render={({ field }) => (
              <MultiSelect
                {...field}
                label="Languages"
                placeholder="Select languages you can communicate in"
                data={LANGUAGES}
                searchable
                styles={inputStyles}
              />
            )}
          />
        </Stack>
      </Box>

      <Divider style={{ borderColor: '#E5E0D8' }} />

      <Box>
        <Text size="xs" weight={600} color={PRIMARY_BROWN} mb="md" style={{ letterSpacing: '0.5px', textTransform: 'uppercase' }}>
          Service Preferences
        </Text>
        <Stack spacing="md">
          <Box>
            <Text size="sm" weight={500} mb="sm" style={{ color: CHARCOAL }}>
              Consultation Methods
            </Text>
            <Controller
              name="consultationMode"
              control={control}
              render={({ field: { value, onChange } }) => (
                <Stack spacing="xs">
                  <Checkbox
                    label="Online Consultation (Video/Phone)"
                    checked={value?.includes('online')}
                    onChange={(e) => {
                      const newValue = e.currentTarget.checked
                        ? [...(value || []), 'online']
                        : value?.filter((v) => v !== 'online');
                      onChange(newValue);
                    }}
                    styles={{
                      input: { cursor: 'pointer' },
                      label: { cursor: 'pointer', fontSize: '15px' }
                    }}
                  />
                  <Checkbox
                    label="In-Person Meeting at Office"
                    checked={value?.includes('in-person')}
                    onChange={(e) => {
                      const newValue = e.currentTarget.checked
                        ? [...(value || []), 'in-person']
                        : value?.filter((v) => v !== 'in-person');
                      onChange(newValue);
                    }}
                    styles={{
                      input: { cursor: 'pointer' },
                      label: { cursor: 'pointer', fontSize: '15px' }
                    }}
                  />
                </Stack>
              )}
            />
          </Box>

          <Controller
            name="biography"
            control={control}
            render={({ field }) => (
              <Textarea
                {...field}
                label="Professional Biography"
                placeholder="Share your legal background, years of experience, notable achievements, and what distinguishes your practice..."
                minRows={5}
                description="Help clients understand your expertise and approach"
                styles={{
                  ...inputStyles,
                  input: {
                    ...inputStyles.input,
                    height: 'auto',
                    minHeight: '140px',
                  }
                }}
              />
            )}
          />
        </Stack>
      </Box>
    </Stack>
  );

  return (
    <Box style={{ minHeight: '100vh', backgroundColor: THEMED_LIGHT_BG }}>
      <Container size="lg" py={40}>
        <Box mb={24}>
          <ActionIcon
            size="lg"
            variant="subtle"
            onClick={() => navigate('/auth/attorneylogin')}
            style={{ color: PRIMARY_BROWN }}
          >
            <IconArrowLeft size={20} />
          </ActionIcon>
        </Box>

        <Paper 
          p={0} 
          radius="md" 
          style={{ 
            backgroundColor: 'white',
            border: '1px solid #E5E0D8',
            overflow: 'hidden'
          }}
        >
          {/* Header Section */}
          <Box 
            style={{ 
              padding: '32px 40px',
              borderBottom: '1px solid #E5E0D8',
              backgroundColor: '#FEFDFB'
            }}
          >
            <Group spacing="md" mb={8}>
              <Box
                style={{
                  width: 56,
                  height: 56,
                  backgroundColor: PRIMARY_BROWN,
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <IconBriefcase size={32} color="white" strokeWidth={1.5} />
              </Box>
              <Box>
                <Title order={2} style={{ color: PRIMARY_BROWN, fontSize: '28px', fontWeight: 600, marginBottom: '4px' }}>
                  Attorney Registration
                </Title>
                <Text size="sm" style={{ color: MUTED_OLIVE, fontSize: '15px' }}>
                  Join our platform to provide legal services to those in need
                </Text>
              </Box>
            </Group>
          </Box>

          {/* Stepper Section */}
          <Box style={{ padding: '32px 40px', backgroundColor: 'white' }}>
            <Stepper 
              active={active} 
              color={PRIMARY_GOLD}
              styles={{
                stepIcon: {
                  borderWidth: 2,
                },
                separator: {
                  marginLeft: 8,
                  marginRight: 8,
                },
                stepLabel: {
                  fontSize: '14px',
                  fontWeight: 500,
                },
                stepDescription: {
                  fontSize: '13px',
                }
              }}
            >
              <Stepper.Step 
                label="Basic Information" 
                description="Account & personal details"
                icon={<IconUser size={18} />}
              />
              <Stepper.Step 
                label="Professional Details" 
                description="Credentials & experience"
                icon={<IconBriefcase size={18} />}
              />
              <Stepper.Step 
                label="Office Location" 
                description="Practice address"
                icon={<IconMapPin size={18} />}
              />
              <Stepper.Step 
                label="Additional Information" 
                description="Specializations & preferences"
                icon={<IconFileText size={18} />}
              />
            </Stepper>
          </Box>

          <Divider style={{ borderColor: '#E5E0D8' }} />

          {/* Form Content */}
          <Box style={{ padding: '40px 40px 32px' }}>
            {active === 0 && renderBasicInfo()}
            {active === 1 && renderProfessionalInfo()}
            {active === 2 && renderAddressInfo()}
            {active === 3 && renderAdditionalInfo()}
          </Box>

          {/* Footer Section */}
          <Box 
            style={{ 
              padding: '24px 40px',
              borderTop: '1px solid #E5E0D8',
              backgroundColor: '#FEFDFB'
            }}
          >
            <Group position="apart">
              <Box>
                {active > 0 && (
                  <Button 
                    variant="subtle" 
                    onClick={prevStep}
                    style={{ 
                      color: PRIMARY_BROWN,
                      fontWeight: 500,
                    }}
                    size="md"
                  >
                    Back
                  </Button>
                )}
              </Box>
              <Box>
                {active < 3 ? (
                  <Button 
                    onClick={nextStep}
                    size="md"
                    style={{ 
                      backgroundColor: PRIMARY_GOLD,
                      color: 'white',
                      fontWeight: 500,
                      paddingLeft: '32px',
                      paddingRight: '32px',
                    }}
                  >
                    Continue
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmit(handleAttorneySignup)}
                    loading={isRegistering}
                    leftIcon={<IconCheck size={18} />}
                    size="md"
                    style={{ 
                      backgroundColor: PRIMARY_BROWN,
                      color: 'white',
                      fontWeight: 500,
                      paddingLeft: '32px',
                      paddingRight: '32px',
                    }}
                  >
                    Create Attorney Account
                  </Button>
                )}
              </Box>
            </Group>

            {active === 3 && (
              <Text size="xs" align="center" mt="md" style={{ color: MUTED_OLIVE }}>
                By creating an account, you agree to our Terms of Service and Privacy Policy
              </Text>
            )}
          </Box>

          {/* Login Link */}
          <Box 
            style={{ 
              padding: '20px 40px',
              borderTop: '1px solid #E5E0D8',
              backgroundColor: 'white',
              textAlign: 'center'
            }}
          >
            <Text size="sm" style={{ color: MUTED_OLIVE }}>
              Already have an account?{' '}
              <Text
                component="span"
                style={{ 
                  color: PRIMARY_BROWN, 
                  cursor: 'pointer', 
                  fontWeight: 600,
                  textDecoration: 'none'
                }}
                onClick={() => navigate('/auth/attorneylogin')}
              >
                Sign in here
              </Text>
            </Text>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}