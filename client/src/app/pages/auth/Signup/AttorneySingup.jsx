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

      navigate('/auth');
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

  const renderBasicInfo = () => (
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
            styles={{ input: { backgroundColor: THEMED_LIGHT_BG } }}
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
            styles={{ input: { backgroundColor: THEMED_LIGHT_BG } }}
          />
        )}
      />

      <Controller
        name="password"
        control={control}
        rules={{ required: 'Password is required', minLength: { value: 6, message: 'Min 6 characters' } }}
        render={({ field }) => (
          <PasswordInput
            {...field}
            label="Password"
            placeholder="Create a secure password"
            required
            error={errors.password?.message}
            description="Must be at least 6 characters"
            styles={{ input: { backgroundColor: THEMED_LIGHT_BG } }}
          />
        )}
      />

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
            placeholder="Re-enter your password"
            required
            error={errors.confirmPassword?.message}
            styles={{ input: { backgroundColor: THEMED_LIGHT_BG } }}
          />
        )}
      />

      <Grid>
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
                styles={{ input: { backgroundColor: THEMED_LIGHT_BG } }}
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
                placeholder="Santos"
                styles={{ input: { backgroundColor: THEMED_LIGHT_BG } }}
              />
            )}
          />
        </Grid.Col>
      </Grid>

      <Grid>
        <Grid.Col span={6}>
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
                styles={{ input: { backgroundColor: THEMED_LIGHT_BG } }}
              />
            )}
          />
        </Grid.Col>
        <Grid.Col span={6}>
          <Controller
            name="suffix"
            control={control}
            render={({ field }) => (
              <TextInput
                {...field}
                label="Suffix"
                placeholder="Jr., Sr., III"
                styles={{ input: { backgroundColor: THEMED_LIGHT_BG } }}
              />
            )}
          />
        </Grid.Col>
      </Grid>
    </Stack>
  );

  const renderProfessionalInfo = () => (
    <Stack spacing="md">
      <Controller
        name="role"
        control={control}
        rules={{ required: 'Role is required' }}
        render={({ field }) => (
          <Select
            {...field}
            label="Role"
            placeholder="Select your role"
            required
            data={[
              { value: 'attorney', label: 'Attorney' },
              { value: 'pao_lawyer', label: 'PAO Lawyer' },
              { value: 'legal_volunteer', label: 'Legal Volunteer' },
            ]}
            error={errors.role?.message}
            styles={{ input: { backgroundColor: THEMED_LIGHT_BG } }}
          />
        )}
      />

      <Grid>
        <Grid.Col span={6}>
          <Controller
            name="prcLicenseNumber"
            control={control}
            rules={{ required: 'PRC License is required' }}
            render={({ field }) => (
              <TextInput
                {...field}
                label="PRC License Number"
                placeholder="e.g., 1234567"
                required
                error={errors.prcLicenseNumber?.message}
                styles={{ input: { backgroundColor: THEMED_LIGHT_BG } }}
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
                placeholder="e.g., IBR-1234567"
                required
                error={errors.ibrNumber?.message}
                styles={{ input: { backgroundColor: THEMED_LIGHT_BG } }}
              />
            )}
          />
        </Grid.Col>
      </Grid>

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
            styles={{ input: { backgroundColor: THEMED_LIGHT_BG } }}
          />
        )}
      />

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
            styles={{ input: { backgroundColor: THEMED_LIGHT_BG } }}
          />
        )}
      />

      <Controller
        name="lawFirm"
        control={control}
        render={({ field }) => (
          <TextInput
            {...field}
            label="Law Firm / Organization"
            placeholder="Enter law firm or organization name"
            styles={{ input: { backgroundColor: THEMED_LIGHT_BG } }}
          />
        )}
      />
    </Stack>
  );

  const renderAddressInfo = () => (
    <Stack spacing="md">
      <Text size="lg" weight={600} style={{ color: PRIMARY_BROWN }}>
        Office Address
      </Text>

      <Controller
        name="officeAddress.street"
        control={control}
        render={({ field }) => (
          <TextInput
            {...field}
            label="Street Address"
            placeholder="Building name, street"
            styles={{ input: { backgroundColor: THEMED_LIGHT_BG } }}
          />
        )}
      />

      <Controller
        name="officeAddress.barangay"
        control={control}
        render={({ field }) => (
          <TextInput
            {...field}
            label="Barangay"
            placeholder="Barangay name"
            styles={{ input: { backgroundColor: THEMED_LIGHT_BG } }}
          />
        )}
      />

      <Grid>
        <Grid.Col span={6}>
          <Controller
            name="officeAddress.city"
            control={control}
            rules={{ required: 'City is required' }}
            render={({ field }) => (
              <TextInput
                {...field}
                label="City"
                placeholder="City"
                required
                error={errors.officeAddress?.city?.message}
                styles={{ input: { backgroundColor: THEMED_LIGHT_BG } }}
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
                placeholder="1000"
                styles={{ input: { backgroundColor: THEMED_LIGHT_BG } }}
              />
            )}
          />
        </Grid.Col>
      </Grid>

      <Controller
        name="officeAddress.province"
        control={control}
        rules={{ required: 'Province is required' }}
        render={({ field }) => (
          <TextInput
            {...field}
            label="Province"
            placeholder="Province name"
            required
            error={errors.officeAddress?.province?.message}
            styles={{ input: { backgroundColor: THEMED_LIGHT_BG } }}
          />
        )}
      />

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
            styles={{ input: { backgroundColor: THEMED_LIGHT_BG } }}
          />
        )}
      />
    </Stack>
  );

  const renderAdditionalInfo = () => (
    <Stack spacing="md">
      <Controller
        name="specializations"
        control={control}
        render={({ field }) => (
          <MultiSelect
            {...field}
            label="Areas of Specialization"
            placeholder="Select all areas where you practice"
            data={SPECIALIZATIONS}
            searchable
            styles={{ input: { backgroundColor: THEMED_LIGHT_BG } }}
          />
        )}
      />

      <Controller
        name="languages"
        control={control}
        render={({ field }) => (
          <MultiSelect
            {...field}
            label="Languages Spoken"
            placeholder="Select all languages you can communicate in"
            data={LANGUAGES}
            searchable
            styles={{ input: { backgroundColor: THEMED_LIGHT_BG } }}
          />
        )}
      />

      <Box>
        <Text size="sm" weight={500} mb="xs">Consultation Preferences</Text>
        <Controller
          name="consultationMode"
          control={control}
          render={({ field: { value, onChange } }) => (
            <Stack spacing="xs">
              <Checkbox
                label="Online Consultation"
                checked={value?.includes('online')}
                onChange={(e) => {
                  const newValue = e.currentTarget.checked
                    ? [...(value || []), 'online']
                    : value?.filter((v) => v !== 'online');
                  onChange(newValue);
                }}
              />
              <Checkbox
                label="In-Person Meeting"
                checked={value?.includes('in-person')}
                onChange={(e) => {
                  const newValue = e.currentTarget.checked
                    ? [...(value || []), 'in-person']
                    : value?.filter((v) => v !== 'in-person');
                  onChange(newValue);
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
            placeholder="Describe your legal background, years of experience, notable cases, and what makes you unique as an attorney..."
            minRows={4}
            description="Tell clients about your experience and expertise"
            styles={{ input: { backgroundColor: THEMED_LIGHT_BG } }}
          />
        )}
      />
    </Stack>
  );

  return (
    <Box style={{ minHeight: '100vh', backgroundColor: '#F9F6F1', padding: '2rem' }}>
      <Container size="md">
        <Paper p="xl" radius="lg" shadow="sm" style={{ backgroundColor: 'white' }}>
          <Stack spacing="xl">
            {/* Header */}
            <Box>
              <ActionIcon
                size="lg"
                variant="subtle"
                onClick={() => navigate('/auth')}
                style={{ color: PRIMARY_BROWN, marginBottom: '1rem' }}
              >
                <IconArrowLeft size={24} />
              </ActionIcon>
              
              <Group spacing="sm" mb="xs">
                <Box
                  style={{
                    width: 48,
                    height: 48,
                    backgroundColor: PRIMARY_BROWN,
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <IconBriefcase size={28} color="white" />
                </Box>
                <Title order={1} style={{ color: PRIMARY_BROWN }}>
                  Attorney Registration
                </Title>
              </Group>
              <Text size="sm" color="dimmed">
                Create your attorney account to start providing legal services
              </Text>
            </Box>

            <Divider />

            {/* Stepper */}
            <Stepper active={active} color={PRIMARY_GOLD}>
              <Stepper.Step label="Basic Info" icon={<IconUser size={18} />}>
                {renderBasicInfo()}
              </Stepper.Step>
              <Stepper.Step label="Professional" icon={<IconBriefcase size={18} />}>
                {renderProfessionalInfo()}
              </Stepper.Step>
              <Stepper.Step label="Address" icon={<IconMapPin size={18} />}>
                {renderAddressInfo()}
              </Stepper.Step>
              <Stepper.Step label="Additional" icon={<IconFileText size={18} />}>
                {renderAdditionalInfo()}
              </Stepper.Step>
            </Stepper>

            {/* Navigation Buttons */}
            <Group position="apart" mt="xl">
              {active > 0 && (
                <Button variant="outline" onClick={prevStep} style={{ borderColor: PRIMARY_GOLD, color: PRIMARY_BROWN }}>
                  Back
                </Button>
              )}
              {active < 3 ? (
                <Button onClick={nextStep} style={{ backgroundColor: PRIMARY_GOLD, marginLeft: active === 0 ? 'auto' : 0 }}>
                  Next
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit(handleAttorneySignup)}
                  loading={isRegistering}
                  leftIcon={<IconCheck size={18} />}
                  style={{ backgroundColor: PRIMARY_BROWN, marginLeft: 'auto' }}
                >
                  Create Attorney Account
                </Button>
              )}
            </Group>

            {/* Login Link */}
            <Text size="sm" align="center" color="dimmed">
              Already have an account?{' '}
              <Text
                component="span"
                style={{ color: PRIMARY_BROWN, cursor: 'pointer', fontWeight: 600 }}
                onClick={() => navigate('/auth')}
              >
                Login here
              </Text>
            </Text>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}