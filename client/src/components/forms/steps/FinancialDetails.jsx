import React from 'react';
import { IconCurrencyDollar, IconBuildingBank, IconUsers } from '@tabler/icons-react';
import { TextInput, Group, Title, Paper, Grid, Stack, Text, Box, Divider } from '@mantine/core';
import { PRIMARY_GOLD, PRIMARY_BROWN, MUTED_OLIVE, CHARCOAL } from '@utils/constants';
import { validationRules } from '@utils/validation';

export default function FinancialDetailsForm({ register, errors, watch, setValue }) {
  // Auto-format Philippine landline as (0A) XXXX-XXXX
  const formatTelephoneNumber = (value) => {
    if (!value) return '';
    const digitsOnly = value.replace(/\D/g, '');
    const withLeadingZero = digitsOnly.startsWith('0') ? digitsOnly : `0${digitsOnly}`;
    const limited = withLeadingZero.slice(0, 10);

    if (limited.length <= 2) return `(${limited}`;
    if (limited.length <= 4) return `(${limited.slice(0, 2)}) ${limited.slice(2)}`;
    if (limited.length <= 8) return `(${limited.slice(0, 2)}) ${limited.slice(2, 6)}-${limited.slice(6)}`;
    return `(${limited.slice(0, 2)}) ${limited.slice(2, 6)}-${limited.slice(6, 10)}`;
  };

  const parseIncome = (value) => {
    if (value === undefined || value === null || value === '') return 0;
    const cleaned = value.toString().replace(/,/g, '');
    const parsed = parseFloat(cleaned);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const monthlyIncome = watch?.('monthlyIncome');
  const spouseMonthlyIncome = watch?.('spouseMonthlyIncome');
  const currentTotal = watch?.('totalCombinedIncome');

  React.useEffect(() => {
    const total = parseIncome(monthlyIncome) + parseIncome(spouseMonthlyIncome);
    const existing = parseIncome(currentTotal);

    if (Number.isFinite(total) && total !== existing) {
      setValue?.('totalCombinedIncome', total ? total.toString() : '');
    }
  }, [monthlyIncome, spouseMonthlyIncome, currentTotal, setValue]);

  return (
    <Stack gap="md" mt="md">
      {/* Employment & Income */}
      <Paper p="lg" radius="lg" style={{ background: '#FAFAFA', border: '1px solid #F0F0F0' }}>
        <Group gap={8} mb="md">
          <Box style={{ width: 28, height: 28, borderRadius: 7, background: '#40C057', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IconCurrencyDollar size={14} color="white" stroke={2.5} />
          </Box>
          <Text size="sm" fw={600} c={CHARCOAL} tt="uppercase" lts={0.5}>Employment & Income</Text>
        </Group>

        <Stack gap="sm">
          <Grid gutter="sm">
            <Grid.Col span={6}>
              <Group gap={4} mb={6}>
                <Text size="sm" fw={600} c={CHARCOAL}>Source of Income</Text>
              </Group>
              <TextInput
                placeholder="Employment, Business, etc."
                size="sm"
                {...register('currentSourceOfIncome', validationRules.currentSourceOfIncome)}
                error={errors.currentSourceOfIncome?.message}
                styles={{ input: { borderColor: errors.currentSourceOfIncome ? '#E74C3C' : '#E0E0E0' } }}
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <Group gap={4} mb={6}>
                <Text size="sm" fw={600} c={CHARCOAL}>Income / Month (₱)</Text>
              </Group>
              <TextInput
                type="number"
                placeholder="15000"
                size="sm"
                {...register('monthlyIncome', validationRules.monthlyIncome)}
                error={errors.monthlyIncome?.message}
                styles={{ input: { borderColor: errors.monthlyIncome ? '#E74C3C' : '#E0E0E0' } }}
              />
            </Grid.Col>
          </Grid>

          <Grid gutter="sm">
            <Grid.Col span={6}>
              <Group gap={4} mb={6}>
                <Text size="sm" fw={600} c={CHARCOAL}>Nature of Work / Business</Text>
              </Group>
              <TextInput
                placeholder="Sales, IT, Retail, etc."
                size="sm"
                {...register('natureOfWork', validationRules.natureOfWork)}
                error={errors.natureOfWork?.message}
                styles={{ input: { borderColor: errors.natureOfWork ? '#E74C3C' : '#E0E0E0' } }}
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <Group gap={4} mb={6}>
                <Text size="sm" fw={600} c={CHARCOAL}>Employer Name</Text>
              </Group>
              <TextInput
                placeholder="ABC Corporation"
                size="sm"
                {...register('employerName', validationRules.employerName)}
                error={errors.employerName?.message}
                styles={{ input: { borderColor: errors.employerName ? '#E74C3C' : '#E0E0E0' } }}
              />
            </Grid.Col>
          </Grid>

          <Grid gutter="sm">
            <Grid.Col span={8}>
              <Group gap={4} mb={6}>
                <Text size="sm" fw={600} c={CHARCOAL}>Employer / Business Address</Text>
              </Group>
              <TextInput
                placeholder="456 Business St, City"
                size="sm"
                {...register('employerAddress', validationRules.employerAddress)}
                error={errors.employerAddress?.message}
                styles={{ input: { borderColor: errors.employerAddress ? '#E74C3C' : '#E0E0E0' } }}
              />
            </Grid.Col>
            <Grid.Col span={4}>
              <Text size="sm" fw={600} c={CHARCOAL} mb={6}>Telephone</Text>
              <TextInput
                placeholder="(02) 8765-4321"
                size="sm"
                {...register('employerTelephone', validationRules.employerTelephone)}
                error={errors.employerTelephone?.message}
                value={watch('employerTelephone') || ''}
                onChange={(e) => {
                  const formatted = formatTelephoneNumber(e.target.value);
                  setValue('employerTelephone', formatted);
                }}
                onFocus={(e) => {
                  if (!e.target.value || e.target.value === '') setValue('employerTelephone', '(');
                }}
                styles={{ input: { borderColor: errors.employerTelephone ? '#E74C3C' : '#E0E0E0' } }}
              />
            </Grid.Col>
          </Grid>
        </Stack>
      </Paper>

      {/* Spouse's Information */}
      <Paper p="lg" radius="lg" style={{ background: '#FAFAFA', border: '1px solid #F0F0F0' }}>
        <Group gap={8} mb="md">
          <Box style={{ width: 28, height: 28, borderRadius: 7, background: '#7950F2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IconUsers size={14} color="white" stroke={2.5} />
          </Box>
          <Text size="sm" fw={600} c={CHARCOAL} tt="uppercase" lts={0.5}>Spouse's Information</Text>
          <Text size="xs" c={MUTED_OLIVE}>(if applicable)</Text>
        </Group>

        <Stack gap="sm">
          <Grid gutter="sm">
            <Grid.Col span={6}>
              <Text size="sm" fw={600} c={CHARCOAL} mb={6}>Spouse's Source of Income</Text>
              <TextInput
                placeholder="Employment, Business, etc."
                size="sm"
                {...register('spouseSourceOfIncome', validationRules.spouseSourceOfIncome)}
                error={errors.spouseSourceOfIncome?.message}
                styles={{ input: { borderColor: errors.spouseSourceOfIncome ? '#E74C3C' : '#E0E0E0' } }}
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <Text size="sm" fw={600} c={CHARCOAL} mb={6}>Spouse's Income / Month (₱)</Text>
              <TextInput
                type="number"
                placeholder="15000"
                size="sm"
                {...register('spouseMonthlyIncome', validationRules.spouseMonthlyIncome)}
                error={errors.spouseMonthlyIncome?.message}
                styles={{ input: { borderColor: errors.spouseMonthlyIncome ? '#E74C3C' : '#E0E0E0' } }}
              />
            </Grid.Col>
          </Grid>

          <Box>
            <Text size="sm" fw={600} c={CHARCOAL} mb={6}>Spouse's Employer / Business Address</Text>
            <TextInput
              placeholder="789 Work Ave, City"
              size="sm"
              {...register('spouseEmployerAddress', validationRules.spouseEmployerAddress)}
              error={errors.spouseEmployerAddress?.message}
              styles={{ input: { borderColor: errors.spouseEmployerAddress ? '#E74C3C' : '#E0E0E0' } }}
            />
          </Box>
        </Stack>
      </Paper>

      {/* Total Combined Income */}
      <Paper p="lg" radius="lg" style={{ background: '#FAFAFA', border: '1px solid #F0F0F0' }}>
        <Group gap={8} mb="md">
          <Box style={{ width: 28, height: 28, borderRadius: 7, background: '#F59F00', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IconBuildingBank size={14} color="white" stroke={2.5} />
          </Box>
          <Text size="sm" fw={600} c={CHARCOAL} tt="uppercase" lts={0.5}>Total Income</Text>
        </Group>

        <Box>
          <Text size="sm" fw={600} c={CHARCOAL} mb={6}>Total Combined Monthly Income (₱)</Text>
          <TextInput
            type="number"
            placeholder="Auto-calculated"
            size="sm"
            readOnly
            {...register('totalCombinedIncome', validationRules.totalCombinedIncome)}
            error={errors.totalCombinedIncome?.message}
            styles={{ input: { borderColor: errors.totalCombinedIncome ? '#E74C3C' : '#E0E0E0', backgroundColor: '#F0F0F0', cursor: 'not-allowed' } }}
          />
          <Text size="xs" c={MUTED_OLIVE} mt={4}>
            Automatically calculated from your income and spouse's income
          </Text>
        </Box>
      </Paper>
    </Stack>
  );
}