import React from 'react';
import { IconUser, IconInfoCircle, IconCheck, IconCalendar } from '@tabler/icons-react';
import { TextInput, Select, Group, Title, Paper, Grid, Stack, Checkbox, Tooltip, Alert, Text, Box, Radio } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { 
  PRIMARY_GOLD, 
  PRIMARY_BROWN, 
  THEMED_LIGHT_BG, 
  MUTED_OLIVE,
  CHARCOAL,
  GENDER_OPTIONS, 
  CIVIL_STATUS_OPTIONS,
  DEFAULT_COUNTRY_CODE,
  DEFAULT_CITIZENSHIP 
} from '@utils/constants';
import { validationRules } from '@utils/validation';

export default function PersonalDetailsForm({ register, errors, setValue, watch }) {
  const [calculatedAge, setCalculatedAge] = React.useState('');
  const [sameAsPresent, setSameAsPresent] = React.useState(false);
  const throughRelator = watch?.('throughRelator') || 'no';
  const isThroughRelator = throughRelator === 'yes';
  const relatorNameValue = watch?.('relatorName');
  const relationshipValue = watch?.('relationshipToClient');

  // Auto-format phone number with fixed +63
  const formatPhoneNumber = (value) => {
    if (!value) return '';
    // Remove all non-digits
    const cleaned = value.replace(/\D/g, '');
    // Remove leading 63 if present to avoid duplication
    const number = cleaned.startsWith('63') ? cleaned.substring(2) : cleaned;
    // Limit to 10 digits after +63
    const limited = number.substring(0, 10);
    // Format as +63 XXX XXX XXXX
    if (limited.length <= 3) {
      return `+63 ${limited}`;
    } else if (limited.length <= 6) {
      return `+63 ${limited.slice(0, 3)} ${limited.slice(3)}`;
    } else {
      return `+63 ${limited.slice(0, 3)} ${limited.slice(3, 6)} ${limited.slice(6)}`;
    }
  };

  // Auto-format Philippine landline as (0A) XXXX-XXXX
  const formatTelephoneNumber = (value) => {
    if (!value) return '';
    const digitsOnly = value.replace(/\D/g, '');
    const withLeadingZero = digitsOnly.startsWith('0') ? digitsOnly : `0${digitsOnly}`;
    const limited = withLeadingZero.slice(0, 10); // e.g., 0 + 1-2 digit area + 7-8 digit line

    if (limited.length <= 2) return `(${limited}`;
    if (limited.length <= 4) return `(${limited.slice(0, 2)}) ${limited.slice(2)}`;
    if (limited.length <= 8) return `(${limited.slice(0, 2)}) ${limited.slice(2, 6)}-${limited.slice(6)}`;
    return `(${limited.slice(0, 2)}) ${limited.slice(2, 6)}-${limited.slice(6, 10)}`;
  };

  // Calculate age from birthday
  const calculateAge = (birthday) => {
    if (!birthday) return '';
    const today = new Date();
    const birthDate = new Date(birthday);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  // Watch birthday, present address, and civil status
  const birthday = watch?.('birthday');
  const presentAddress = watch?.('presentAddress');
  const civilStatus = watch?.('civilStatus');
  
  // Update age when birthday changes
  React.useEffect(() => {
    if (birthday) {
      const age = calculateAge(birthday);
      if (age >= 0) {
        setCalculatedAge(String(age));
        setValue('age', age, { shouldValidate: true });
      }
    } else {
      setCalculatedAge('');
      setValue('age', '');
    }
  }, [birthday, setValue]);

  // Update permanent address when "same as present" is checked
  React.useEffect(() => {
    if (sameAsPresent && presentAddress) {
      setValue('permanentAddress', presentAddress, { shouldValidate: true });
    }
  }, [sameAsPresent, presentAddress, setValue]);

  // Set default citizenship on mount
  React.useEffect(() => {
    setValue('citizenship', DEFAULT_CITIZENSHIP);
  }, [setValue]);

  // Default relator toggle to "no" if unset
  React.useEffect(() => {
    if (!throughRelator) {
      setValue('throughRelator', 'no', { shouldValidate: false });
    }
  }, [throughRelator, setValue]);

  // Auto-enable relator toggle when prefilled relator details exist
  React.useEffect(() => {
    if (throughRelator === 'no' && (relatorNameValue || relationshipValue)) {
      setValue('throughRelator', 'yes', { shouldValidate: false });
    }
  }, [throughRelator, relatorNameValue, relationshipValue, setValue]);

  // Clear relator fields when user selects "No"
  React.useEffect(() => {
    if (throughRelator === 'no') {
      setValue('relatorName', '', { shouldValidate: false });
      setValue('relationshipToClient', '', { shouldValidate: false });
    }
  }, [throughRelator, setValue]);

  return (
    <Stack gap="lg" mt="lg">
      {/* Section Header */}
      <Group gap="xs">
        <Box
          style={{
            width: 32,
            height: 32,
            borderRadius: '8px',
            background: PRIMARY_BROWN,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <IconUser size={18} color="white" />
        </Box>
        <Title order={3} c={CHARCOAL}>Personal Details</Title>
      </Group>
      
      {/* Name */}
      <Box>
        <Group gap={8} mb={8}>
          <Text size="sm" fw={600} c={CHARCOAL}>Name</Text>
          <Text size="sm" c="red">*</Text>
        </Group>
        <TextInput
          placeholder="Juan Dela Cruz"
          size="md"
          {...register('name', validationRules.name)}
          error={errors.name?.message}
          onChange={(e) => {
            const capitalized = e.target.value
              .split(' ')
              .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
              .join(' ');
            setValue('name', capitalized);
          }}
          styles={{
            input: {
              borderColor: errors.name ? '#E74C3C' : '#E0E0E0',
              '&:focus': {
                borderColor: errors.name ? '#E74C3C' : PRIMARY_BROWN,
              },
            },
          }}
        />
      </Box>
      
      {/* Birthday and Age */}
      <Grid>
        <Grid.Col span={6}>
          <Box>
            <Group gap={8} mb={8}>
              <Text size="sm" fw={600} c={CHARCOAL}>Birthday</Text>
              <Text size="sm" c="red">*</Text>
            </Group>
            <DateInput
              placeholder="Pick your birthday"
              size="md"
              valueFormat="MMMM DD, YYYY"
              leftSection={<IconCalendar size={16} color={MUTED_OLIVE} />}
              maxDate={new Date()}
              {...register('birthday', validationRules.birthday)}
              onChange={(date) => setValue('birthday', date)}
              error={errors.birthday?.message}
              clearable
              styles={{
                input: {
                  borderColor: errors.birthday ? '#E74C3C' : '#E0E0E0',
                  '&:focus': {
                    borderColor: errors.birthday ? '#E74C3C' : PRIMARY_BROWN,
                  },
                },
              }}
            />
          </Box>
        </Grid.Col>
        <Grid.Col span={6}>
          <Box>
            <Group gap={4} mb={8}>
              <Text size="sm" fw={600} c={CHARCOAL}>Age</Text>
              <Text size="sm" c="red">*</Text>
              <Tooltip label="Your age is automatically calculated from your birthday">
                <IconInfoCircle size={14} color={MUTED_OLIVE} style={{ cursor: 'help' }} />
              </Tooltip>
            </Group>
            <TextInput
              placeholder="Auto-calculated"
              size="md"
              value={calculatedAge}
              readOnly
              error={errors.age?.message}
              styles={{
                input: {
                  backgroundColor: '#F5F5F5',
                  borderColor: '#E0E0E0',
                  cursor: 'not-allowed',
                },
              }}
            />
          </Box>
        </Grid.Col>
      </Grid>
      
      {/* Minor Alert */}
      {calculatedAge && parseInt(calculatedAge) < 18 && (
        <Alert 
          color="yellow"
          styles={{
            root: {
              backgroundColor: `${PRIMARY_GOLD}10`,
              border: `1px solid ${PRIMARY_GOLD}`,
            },
            icon: {
              color: PRIMARY_GOLD,
            },
          }}
        >
          <Text size="sm" c={CHARCOAL}>
            <strong>Minor Detected:</strong> Legal guardian or representative information may be required.
          </Text>
        </Alert>
      )}
      
      {/* Contact Number */}
      <Box>
        <Group gap={8} mb={8}>
          <Text size="sm" fw={600} c={CHARCOAL}>Contact Number</Text>
          <Text size="sm" c="red">*</Text>
        </Group>
        <TextInput
          placeholder="912 345 6789"
          type="tel"
          size="md"
          {...register('contactNumber', validationRules.contactNumber)}
          error={errors.contactNumber?.message}
          value={watch('contactNumber') || '+63 '}
          onChange={(e) => {
            const formatted = formatPhoneNumber(e.target.value);
            setValue('contactNumber', formatted);
          }}
          onFocus={(e) => {
            // Ensure +63 prefix is always present
            if (!e.target.value || e.target.value === '') {
              setValue('contactNumber', '+63 ');
            }
          }}
          description="Philippine mobile number (10 digits)"
          styles={{
            input: {
              borderColor: errors.contactNumber ? '#E74C3C' : '#E0E0E0',
              '&:focus': {
                borderColor: errors.contactNumber ? '#E74C3C' : PRIMARY_BROWN,
              },
            },
            description: {
              color: MUTED_OLIVE,
              fontSize: '12px',
            },
          }}
        />
      </Box>
      
      {/* Sex and Civil Status */}
      <Grid>
        <Grid.Col span={6}>
          <Box>
            <Group gap={8} mb={8}>
              <Text size="sm" fw={600} c={CHARCOAL}>Sex</Text>
              <Text size="sm" c="red">*</Text>
            </Group>
            <Select
              placeholder="Select Sex"
              size="md"
              data={GENDER_OPTIONS}
              {...register('sex', validationRules.sex)}
              onChange={(value) => setValue('sex', value)}
              error={errors.sex?.message}
              searchable
              styles={{
                input: {
                  borderColor: errors.sex ? '#E74C3C' : '#E0E0E0',
                  '&:focus': {
                    borderColor: errors.sex ? '#E74C3C' : PRIMARY_BROWN,
                  },
                },
              }}
            />
          </Box>
        </Grid.Col>
        <Grid.Col span={6}>
          <Box>
            <Group gap={8} mb={8}>
              <Text size="sm" fw={600} c={CHARCOAL}>Civil Status</Text>
              <Text size="sm" c="red">*</Text>
            </Group>
            <Select
              placeholder="Select Civil Status"
              size="md"
              data={CIVIL_STATUS_OPTIONS}
              {...register('civilStatus', validationRules.civilStatus)}
              onChange={(value) => setValue('civilStatus', value)}
              error={errors.civilStatus?.message}
              styles={{
                input: {
                  borderColor: errors.civilStatus ? '#E74C3C' : '#E0E0E0',
                  '&:focus': {
                    borderColor: errors.civilStatus ? '#E74C3C' : PRIMARY_BROWN,
                  },
                },
              }}
            />
          </Box>
        </Grid.Col>
      </Grid>
      
      {/* Citizenship */}
      <Box>
        <Group gap={8} mb={8}>
          <Text size="sm" fw={600} c={CHARCOAL}>Citizenship</Text>
          <Text size="sm" c="red">*</Text>
        </Group>
        <TextInput
          placeholder="Filipino"
          size="md"
          {...register('citizenship', validationRules.citizenship)}
          error={errors.citizenship?.message}
          rightSection={watch?.('citizenship') === DEFAULT_CITIZENSHIP ? <IconCheck size={16} color={PRIMARY_BROWN} /> : null}
          styles={{
            input: {
              borderColor: errors.citizenship ? '#E74C3C' : '#E0E0E0',
              '&:focus': {
                borderColor: errors.citizenship ? '#E74C3C' : PRIMARY_BROWN,
              },
            },
          }}
        />
      </Box>
      
      {/* Spouse Name (conditional) */}
      {(civilStatus === 'Married' || civilStatus === 'Widowed') && (
        <Box>
          <Group gap={8} mb={8}>
            <Text size="sm" fw={600} c={CHARCOAL}>Spouse Name</Text>
            {civilStatus === 'Married' && <Text size="sm" c="red">*</Text>}
          </Group>
          <TextInput
            placeholder="Enter spouse name"
            size="md"
            {...register('spouse', validationRules.spouse)}
            error={errors.spouse?.message}
            styles={{
              input: {
                borderColor: errors.spouse ? '#E74C3C' : '#E0E0E0',
                '&:focus': {
                  borderColor: errors.spouse ? '#E74C3C' : PRIMARY_BROWN,
                },
              },
            }}
          />
        </Box>
      )}
      
      {/* Cellphone Number */}
      <Box>
        <Text size="sm" fw={600} c={CHARCOAL} mb={8}>Cellphone Number</Text>
        <TextInput
          placeholder="+63 912 345 6789"
          type="tel"
          size="md"
          {...register('cellphoneNumber', validationRules.cellphoneNumber)}
          error={errors.cellphoneNumber?.message}
          value={watch('cellphoneNumber') || '+63 '}
          onChange={(e) => {
            const formatted = formatPhoneNumber(e.target.value);
            setValue('cellphoneNumber', formatted);
          }}
          onFocus={(e) => {
            // Keep +63 prefix consistent with primary contact number
            if (!e.target.value || e.target.value === '') {
              setValue('cellphoneNumber', '+63 ');
            }
          }}
          description="Optional alternate contact number"
          styles={{
            input: {
              borderColor: errors.cellphoneNumber ? '#E74C3C' : '#E0E0E0',
              '&:focus': {
                borderColor: errors.cellphoneNumber ? '#E74C3C' : PRIMARY_BROWN,
              },
            },
            description: {
              color: MUTED_OLIVE,
              fontSize: '12px',
            },
          }}
        />
      </Box>
      
      {/* Present Address */}
      <Box>
        <Group gap={8} mb={8}>
          <Text size="sm" fw={600} c={CHARCOAL}>Present Address</Text>
          <Text size="sm" c="red">*</Text>
        </Group>
        <TextInput
          placeholder="123 Street, Barangay, City"
          size="md"
          {...register('presentAddress', validationRules.presentAddress)}
          error={errors.presentAddress?.message}
          styles={{
            input: {
              borderColor: errors.presentAddress ? '#E74C3C' : '#E0E0E0',
              '&:focus': {
                borderColor: errors.presentAddress ? '#E74C3C' : PRIMARY_BROWN,
              },
            },
          }}
        />
      </Box>
      
      {/* Telephone Number */}
      <Box>
        <Text size="sm" fw={600} c={CHARCOAL} mb={8}>Telephone Number</Text>
        <TextInput
          placeholder="(02) 1234-5678"
          size="md"
          {...register('telephoneNumber', validationRules.telephoneNumber)}
          error={errors.telephoneNumber?.message}
          value={watch('telephoneNumber') || ''}
          onChange={(e) => {
            const formatted = formatTelephoneNumber(e.target.value);
            setValue('telephoneNumber', formatted);
          }}
          onFocus={(e) => {
            if (!e.target.value || e.target.value === '') {
              setValue('telephoneNumber', '(');
            }
          }}
          styles={{
            input: {
              borderColor: errors.telephoneNumber ? '#E74C3C' : '#E0E0E0',
              '&:focus': {
                borderColor: errors.telephoneNumber ? '#E74C3C' : PRIMARY_BROWN,
              },
            },
          }}
        />
      </Box>
      
      {/* Same Address Checkbox */}
      <Checkbox
        label="Permanent address is the same as present address"
        checked={sameAsPresent}
        onChange={(event) => setSameAsPresent(event.currentTarget.checked)}
        styles={{
          label: { color: CHARCOAL, fontWeight: 500 }
        }}
      />
      
      {/* Permanent Address */}
      <Box>
        <Group gap={8} mb={8}>
          <Text size="sm" fw={600} c={CHARCOAL}>Permanent Address</Text>
          <Text size="sm" c="red">*</Text>
        </Group>
        <TextInput
          placeholder="123 Street, Barangay, City"
          size="md"
          {...register('permanentAddress', validationRules.permanentAddress)}
          error={errors.permanentAddress?.message}
          disabled={sameAsPresent}
          styles={{
            input: { 
              backgroundColor: sameAsPresent ? '#F5F5F5' : 'white',
              borderColor: errors.permanentAddress ? '#E74C3C' : '#E0E0E0',
              cursor: sameAsPresent ? 'not-allowed' : 'text',
              '&:focus': {
                borderColor: errors.permanentAddress ? '#E74C3C' : PRIMARY_BROWN,
              },
            },
          }}
        />
      </Box>
      
      {/* Relator Section */}
      <Paper p="lg" style={{ backgroundColor: `${PRIMARY_GOLD}10`, border: `1px solid ${PRIMARY_GOLD}` }}>
        <Title order={4} mb="md" c={CHARCOAL}>
          Relator/Representative Information
        </Title>
        <Stack gap="md">
          <Box>
            <Text size="sm" fw={600} c={CHARCOAL} mb={6}>If through a Relator / Representative</Text>
            <Radio.Group
              value={throughRelator}
              onChange={(value) => setValue('throughRelator', value, { shouldValidate: true })}
            >
              <Group gap="lg">
                <Radio value="yes" label="Yes" color={PRIMARY_BROWN} />
                <Radio value="no" label="No" color={PRIMARY_BROWN} />
              </Group>
            </Radio.Group>
            {/* keep value in RHF state */}
            <input type="hidden" value={throughRelator} {...register('throughRelator')} readOnly />
          </Box>

          <Box>
            <Group gap={8} mb={8}>
              <Text size="sm" fw={600} c={CHARCOAL}>Name of Relator/Representative</Text>
              {isThroughRelator && <Text size="sm" c="red">*</Text>}
            </Group>
            <TextInput
              placeholder="Maria Santos"
              size="md"
              disabled={!isThroughRelator}
              {...register('relatorName', {
                validate: (value) => {
                  if (!isThroughRelator) return true;
                  if (!value || !value.trim()) return 'Relator name is required';
                  if (value.trim().length < 2) return 'Relator name must be at least 2 characters';
                  return true;
                },
              })}
              error={errors.relatorName?.message}
              styles={{
                input: {
                  backgroundColor: isThroughRelator ? 'white' : '#F5F5F5',
                  borderColor: errors.relatorName ? '#E74C3C' : '#E0E0E0',
                  cursor: isThroughRelator ? 'text' : 'not-allowed',
                  '&:focus': {
                    borderColor: errors.relatorName ? '#E74C3C' : PRIMARY_BROWN,
                  },
                },
              }}
            />
          </Box>

          <Box>
            <Group gap={8} mb={8}>
              <Text size="sm" fw={600} c={CHARCOAL}>Relationship to the Client</Text>
              {isThroughRelator && <Text size="sm" c="red">*</Text>}
            </Group>
            <TextInput
              placeholder="Sister, Brother, Parent, Attorney, etc."
              size="md"
              disabled={!isThroughRelator}
              {...register('relationshipToClient', {
                validate: (value) => {
                  if (!isThroughRelator) return true;
                  if (!value || !value.trim()) return 'Relationship is required';
                  if (value.trim().length < 2) return 'Relationship must be at least 2 characters';
                  return true;
                },
              })}
              error={errors.relationshipToClient?.message}
              styles={{
                input: {
                  backgroundColor: isThroughRelator ? 'white' : '#F5F5F5',
                  borderColor: errors.relationshipToClient ? '#E74C3C' : '#E0E0E0',
                  cursor: isThroughRelator ? 'text' : 'not-allowed',
                  '&:focus': {
                    borderColor: errors.relationshipToClient ? '#E74C3C' : PRIMARY_BROWN,
                  },
                },
              }}
            />
          </Box>
        </Stack>
      </Paper>
    </Stack>
  );
}