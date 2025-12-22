import React from 'react';
import { IconUser, IconInfoCircle, IconCheck, IconCalendar } from '@tabler/icons-react';
import { TextInput, Select, Group, Title, Paper, Grid, Stack, Checkbox, Tooltip, Alert, Text, Box } from '@mantine/core';
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
  const [showRelator, setShowRelator] = React.useState(false);

  // Auto-format phone number
  const formatPhoneNumber = (value) => {
    if (!value) return '';
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.startsWith('63')) {
      const number = cleaned.substring(2);
      if (number.length <= 10) {
        const match = number.match(/^(\d{0,3})(\d{0,3})(\d{0,4})$/);
        if (match) {
          return `+63 ${match[1]}${match[2] ? ' ' + match[2] : ''}${match[3] ? ' ' + match[3] : ''}`.trim();
        }
      }
    }
    return value;
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
          placeholder="+63 912 345 6789"
          type="tel"
          size="md"
          {...register('contactNumber', validationRules.contactNumber)}
          error={errors.contactNumber?.message}
          onChange={(e) => {
            const formatted = formatPhoneNumber(e.target.value);
            setValue('contactNumber', formatted);
          }}
          description="Format: +63 912 345 6789"
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
          onChange={(e) => {
            const formatted = formatPhoneNumber(e.target.value);
            setValue('cellphoneNumber', formatted);
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
      
      {/* Relator Checkbox */}
      <Checkbox
        label="I am filling this form on behalf of someone else"
        checked={showRelator}
        onChange={(event) => setShowRelator(event.currentTarget.checked)}
        styles={{
          label: { color: CHARCOAL, fontWeight: 500 }
        }}
      />
      
      {/* Relator Section */}
      {showRelator && (
        <Paper p="lg" style={{ backgroundColor: `${PRIMARY_GOLD}10`, border: `1px solid ${PRIMARY_GOLD}` }}>
          <Title order={4} mb="md" c={CHARCOAL}>
            Relator/Representative Information
          </Title>
          <Stack gap="md">
            <Box>
              <Group gap={8} mb={8}>
                <Text size="sm" fw={600} c={CHARCOAL}>Name of Relator/Representative</Text>
                <Text size="sm" c="red">*</Text>
              </Group>
              <TextInput
                placeholder="Maria Santos"
                size="md"
                {...register('relatorName', validationRules.relatorName)}
                error={errors.relatorName?.message}
                styles={{
                  input: {
                    backgroundColor: 'white',
                    borderColor: errors.relatorName ? '#E74C3C' : '#E0E0E0',
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
                <Text size="sm" c="red">*</Text>
              </Group>
              <TextInput
                placeholder="Sister, Brother, Parent, Attorney, etc."
                size="md"
                {...register('relationshipToClient', validationRules.relationshipToClient)}
                error={errors.relationshipToClient?.message}
                styles={{
                  input: {
                    backgroundColor: 'white',
                    borderColor: errors.relationshipToClient ? '#E74C3C' : '#E0E0E0',
                    '&:focus': {
                      borderColor: errors.relationshipToClient ? '#E74C3C' : PRIMARY_BROWN,
                    },
                  },
                }}
              />
            </Box>
          </Stack>
        </Paper>
      )}
    </Stack>
  );
}