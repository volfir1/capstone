import React from 'react';
import { IconUser, IconInfoCircle, IconCheck } from '@tabler/icons-react';
import { TextInput, Select, Group, Title, Paper, Grid, Stack, Checkbox, Tooltip, Alert, Text } from '@mantine/core';
import { 
  PRIMARY_GOLD, 
  PRIMARY_BROWN, 
  THEMED_LIGHT_BG, 
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
    <Stack spacing="md">
      <Group align="center" spacing="sm">
        <IconUser size={28} color={PRIMARY_BROWN} />
        <Title order={2} style={{ color: PRIMARY_BROWN }}>Personal Details</Title>
      </Group>
      
      <TextInput
        label="Name"
        placeholder="Juan Dela Cruz"
        required
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
          input: { backgroundColor: THEMED_LIGHT_BG }
        }}
      />
      
      <Grid>
        <Grid.Col span={6}>
          <TextInput
            label="Birthday"
            type="date"
            required
            {...register('birthday', validationRules.birthday)}
            error={errors.birthday?.message}
            styles={{
              input: { backgroundColor: THEMED_LIGHT_BG }
            }}
          />
        </Grid.Col>
        <Grid.Col span={6}>
          <Group spacing={4} mb={4}>
            <Text size="sm" weight={500}>Age *</Text>
            <Tooltip label="Your age is automatically calculated from your birthday">
              <IconInfoCircle size={14} color={PRIMARY_BROWN} style={{ cursor: 'help' }} />
            </Tooltip>
          </Group>
          <TextInput
            placeholder="Auto-calculated"
            required
            value={calculatedAge}
            readOnly
            error={errors.age?.message}
            styles={{
              input: { backgroundColor: THEMED_LIGHT_BG, cursor: 'not-allowed' }
            }}
          />
        </Grid.Col>
      </Grid>
      
      {calculatedAge && parseInt(calculatedAge) < 18 && (
        <Alert color="yellow" icon={<IconInfoCircle size={16} />}>
          <Text size="sm">
            <strong>Minor Detected:</strong> Legal guardian or representative information may be required.
          </Text>
        </Alert>
      )}
      
      <TextInput
        label="Contact Number"
        placeholder="+63 912 345 6789"
        type="tel"
        required
        {...register('contactNumber', validationRules.contactNumber)}
        error={errors.contactNumber?.message}
        onChange={(e) => {
          const formatted = formatPhoneNumber(e.target.value);
          setValue('contactNumber', formatted);
        }}
        description="Format: +63 912 345 6789"
        styles={{
          input: { backgroundColor: THEMED_LIGHT_BG }
        }}
      />
      
      <Grid>
        <Grid.Col span={6}>
          <Select
            label="Sex"
            placeholder="Select Sex"
            required
            data={GENDER_OPTIONS}
            {...register('sex', validationRules.sex)}
            onChange={(value) => setValue('sex', value)}
            error={errors.sex?.message}
            searchable
            styles={{
              input: { backgroundColor: THEMED_LIGHT_BG }
            }}
          />
        </Grid.Col>
        <Grid.Col span={6}>
          <Select
            label="Civil Status"
            placeholder="Select Civil Status"
            required
            data={CIVIL_STATUS_OPTIONS}
            {...register('civilStatus', validationRules.civilStatus)}
            onChange={(value) => setValue('civilStatus', value)}
            error={errors.civilStatus?.message}
            styles={{
              input: { backgroundColor: THEMED_LIGHT_BG }
            }}
          />
        </Grid.Col>
      </Grid>
      
      <TextInput
        label="Citizenship"
        placeholder="Filipino"
        required
        {...register('citizenship', validationRules.citizenship)}
        error={errors.citizenship?.message}
        rightSection={watch?.('citizenship') === DEFAULT_CITIZENSHIP ? <IconCheck size={16} color="green" /> : null}
        styles={{
          input: { backgroundColor: THEMED_LIGHT_BG }
        }}
      />
      
      {(civilStatus === 'Married' || civilStatus === 'Widowed') && (
        <TextInput
          label="Spouse Name"
          placeholder="Enter spouse name"
          required={civilStatus === 'Married'}
          {...register('spouse', validationRules.spouse)}
          error={errors.spouse?.message}
          styles={{
            input: { backgroundColor: THEMED_LIGHT_BG }
          }}
        />
      )}
      
      <TextInput
        label="Cellphone Number"
        placeholder="+63 912 345 6789"
        type="tel"
        {...register('cellphoneNumber', validationRules.cellphoneNumber)}
        error={errors.cellphoneNumber?.message}
        onChange={(e) => {
          const formatted = formatPhoneNumber(e.target.value);
          setValue('cellphoneNumber', formatted);
        }}
        description="Optional alternate contact number"
        styles={{
          input: { backgroundColor: THEMED_LIGHT_BG }
        }}
      />
      
      <TextInput
        label="Present Address"
        placeholder="123 Street, Barangay, City"
        required
        {...register('presentAddress', validationRules.presentAddress)}
        error={errors.presentAddress?.message}
        styles={{
          input: { backgroundColor: THEMED_LIGHT_BG }
        }}
      />
      
      <TextInput
        label="Telephone Number"
        placeholder="(02) 1234-5678"
        {...register('telephoneNumber', validationRules.telephoneNumber)}
        error={errors.telephoneNumber?.message}
        styles={{
          input: { backgroundColor: THEMED_LIGHT_BG }
        }}
      />
      
      <Checkbox
        label="Permanent address is the same as present address"
        checked={sameAsPresent}
        onChange={(event) => setSameAsPresent(event.currentTarget.checked)}
        styles={{
          label: { color: PRIMARY_BROWN, fontWeight: 500 }
        }}
      />
      
      <TextInput
        label="Permanent Address"
        placeholder="123 Street, Barangay, City"
        required
        {...register('permanentAddress', validationRules.permanentAddress)}
        error={errors.permanentAddress?.message}
        disabled={sameAsPresent}
        styles={{
          input: { 
            backgroundColor: sameAsPresent ? '#f0f0f0' : THEMED_LIGHT_BG,
            cursor: sameAsPresent ? 'not-allowed' : 'text'
          }
        }}
      />
      
      <Checkbox
        label="I am filling this form on behalf of someone else"
        checked={showRelator}
        onChange={(event) => setShowRelator(event.currentTarget.checked)}
        styles={{
          label: { color: PRIMARY_BROWN, fontWeight: 500 }
        }}
      />
      
      {showRelator && (
        <Paper p="md" style={{ backgroundColor: THEMED_LIGHT_BG, borderLeft: `4px solid ${PRIMARY_GOLD}` }}>
          <Title order={4} mb="sm" style={{ color: PRIMARY_BROWN }}>
            Relator/Representative Information
          </Title>
          <Stack spacing="sm">
            <TextInput
              label="Name of Relator/Representative"
              placeholder="Maria Santos"
              required
              {...register('relatorName', validationRules.relatorName)}
              error={errors.relatorName?.message}
              styles={{
                input: { backgroundColor: 'white' }
              }}
            />
            <TextInput
              label="Relationship to the Client"
              placeholder="Sister, Brother, Parent, Attorney, etc."
              required
              {...register('relationshipToClient', validationRules.relationshipToClient)}
              error={errors.relationshipToClient?.message}
              styles={{
                input: { backgroundColor: 'white' }
              }}
            />
          </Stack>
        </Paper>
      )}
    </Stack>
  );
}