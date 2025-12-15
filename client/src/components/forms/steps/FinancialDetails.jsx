import React from 'react';
import { IconCurrencyDollar } from '@tabler/icons-react';
import { TextInput, Group, Title, Paper, Stack, Text, Box } from '@mantine/core';
import { PRIMARY_GOLD, PRIMARY_BROWN, THEMED_LIGHT_BG, MUTED_OLIVE, CHARCOAL } from '@utils/constants';
import { validationRules } from '@utils/validation';

export default function FinancialDetailsForm({ register, errors }) {
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
          <IconCurrencyDollar size={18} color="white" />
        </Box>
        <Title order={3} c={CHARCOAL}>Financial Details</Title>
      </Group>
      
      {/* Current Source of Income */}
      <Box>
        <Group gap={8} mb={8}>
          <Text size="sm" fw={600} c={CHARCOAL}>Current Source of Income</Text>
          <Text size="sm" c="red">*</Text>
        </Group>
        <TextInput
          placeholder="Employment, Business, etc."
          size="md"
          {...register('currentSourceOfIncome', validationRules.currentSourceOfIncome)}
          error={errors.currentSourceOfIncome?.message}
          styles={{
            input: {
              borderColor: errors.currentSourceOfIncome ? '#E74C3C' : '#E0E0E0',
              '&:focus': {
                borderColor: errors.currentSourceOfIncome ? '#E74C3C' : PRIMARY_BROWN,
              },
            },
          }}
        />
      </Box>
      
      {/* Income / Month */}
      <Box>
        <Group gap={8} mb={8}>
          <Text size="sm" fw={600} c={CHARCOAL}>Income / Month</Text>
          <Text size="sm" c="red">*</Text>
        </Group>
        <TextInput
          type="number"
          placeholder="15000"
          size="md"
          {...register('monthlyIncome', validationRules.monthlyIncome)}
          error={errors.monthlyIncome?.message}
          styles={{
            input: {
              borderColor: errors.monthlyIncome ? '#E74C3C' : '#E0E0E0',
              '&:focus': {
                borderColor: errors.monthlyIncome ? '#E74C3C' : PRIMARY_BROWN,
              },
            },
          }}
        />
        <Text size="xs" c={MUTED_OLIVE} mt={4}>
          Enter your monthly income in Philippine Peso (₱)
        </Text>
      </Box>
      
      {/* Nature of Work / Business */}
      <Box>
        <Group gap={8} mb={8}>
          <Text size="sm" fw={600} c={CHARCOAL}>Nature of Work / Business</Text>
          <Text size="sm" c="red">*</Text>
        </Group>
        <TextInput
          placeholder="Sales, IT, Retail, etc."
          size="md"
          {...register('natureOfWork', validationRules.natureOfWork)}
          error={errors.natureOfWork?.message}
          styles={{
            input: {
              borderColor: errors.natureOfWork ? '#E74C3C' : '#E0E0E0',
              '&:focus': {
                borderColor: errors.natureOfWork ? '#E74C3C' : PRIMARY_BROWN,
              },
            },
          }}
        />
      </Box>
      
      {/* Employer / Business Owner's Name */}
      <Box>
        <Group gap={8} mb={8}>
          <Text size="sm" fw={600} c={CHARCOAL}>Employer / Business Owner's Name</Text>
          <Text size="sm" c="red">*</Text>
        </Group>
        <TextInput
          placeholder="ABC Corporation"
          size="md"
          {...register('employerName', validationRules.employerName)}
          error={errors.employerName?.message}
          styles={{
            input: {
              borderColor: errors.employerName ? '#E74C3C' : '#E0E0E0',
              '&:focus': {
                borderColor: errors.employerName ? '#E74C3C' : PRIMARY_BROWN,
              },
            },
          }}
        />
      </Box>
      
      {/* Employer / Business Address */}
      <Box>
        <Group gap={8} mb={8}>
          <Text size="sm" fw={600} c={CHARCOAL}>Employer / Business Address</Text>
          <Text size="sm" c="red">*</Text>
        </Group>
        <TextInput
          placeholder="456 Business St, City"
          size="md"
          {...register('employerAddress', validationRules.employerAddress)}
          error={errors.employerAddress?.message}
          styles={{
            input: {
              borderColor: errors.employerAddress ? '#E74C3C' : '#E0E0E0',
              '&:focus': {
                borderColor: errors.employerAddress ? '#E74C3C' : PRIMARY_BROWN,
              },
            },
          }}
        />
      </Box>
      
      {/* Telephone */}
      <Box>
        <Text size="sm" fw={600} c={CHARCOAL} mb={8}>Telephone</Text>
        <TextInput
          placeholder="(02) 8765-4321"
          size="md"
          {...register('employerTelephone', validationRules.employerTelephone)}
          error={errors.employerTelephone?.message}
          styles={{
            input: {
              borderColor: errors.employerTelephone ? '#E74C3C' : '#E0E0E0',
              '&:focus': {
                borderColor: errors.employerTelephone ? '#E74C3C' : PRIMARY_BROWN,
              },
            },
          }}
        />
      </Box>
      
      {/* Spouse's Information Section */}
      <Paper p="lg" style={{ backgroundColor: `${PRIMARY_GOLD}10`, border: `1px solid ${PRIMARY_GOLD}` }}>
        <Title order={4} mb="md" c={CHARCOAL}>
          Spouse's Information (If applicable)
        </Title>
        <Stack gap="md">
          {/* Spouse's Source of Income */}
          <Box>
            <Text size="sm" fw={600} c={CHARCOAL} mb={8}>Spouse's Source of Income</Text>
            <TextInput
              placeholder="Employment, Business, etc."
              size="md"
              {...register('spouseSourceOfIncome', validationRules.spouseSourceOfIncome)}
              error={errors.spouseSourceOfIncome?.message}
              styles={{
                input: {
                  backgroundColor: 'white',
                  borderColor: errors.spouseSourceOfIncome ? '#E74C3C' : '#E0E0E0',
                  '&:focus': {
                    borderColor: errors.spouseSourceOfIncome ? '#E74C3C' : PRIMARY_BROWN,
                  },
                },
              }}
            />
          </Box>
          
          {/* Spouse's Income / Month */}
          <Box>
            <Text size="sm" fw={600} c={CHARCOAL} mb={8}>Spouse's Income / Month</Text>
            <TextInput
              type="number"
              placeholder="15000"
              size="md"
              {...register('spouseMonthlyIncome', validationRules.spouseMonthlyIncome)}
              error={errors.spouseMonthlyIncome?.message}
              styles={{
                input: {
                  backgroundColor: 'white',
                  borderColor: errors.spouseMonthlyIncome ? '#E74C3C' : '#E0E0E0',
                  '&:focus': {
                    borderColor: errors.spouseMonthlyIncome ? '#E74C3C' : PRIMARY_BROWN,
                  },
                },
              }}
            />
          </Box>
          
          {/* Spouse's Employer / Business Address */}
          <Box>
            <Text size="sm" fw={600} c={CHARCOAL} mb={8}>Spouse's Employer / Business Address</Text>
            <TextInput
              placeholder="789 Work Ave, City"
              size="md"
              {...register('spouseEmployerAddress', validationRules.spouseEmployerAddress)}
              error={errors.spouseEmployerAddress?.message}
              styles={{
                input: {
                  backgroundColor: 'white',
                  borderColor: errors.spouseEmployerAddress ? '#E74C3C' : '#E0E0E0',
                  '&:focus': {
                    borderColor: errors.spouseEmployerAddress ? '#E74C3C' : PRIMARY_BROWN,
                  },
                },
              }}
            />
          </Box>
        </Stack>
      </Paper>
      
      {/* Total Combined Monthly Income */}
      <Box>
        <Text size="sm" fw={600} c={CHARCOAL} mb={8}>Total Combined Monthly Income</Text>
        <TextInput
          type="number"
          placeholder="30000"
          size="md"
          {...register('totalCombinedIncome', validationRules.totalCombinedIncome)}
          error={errors.totalCombinedIncome?.message}
          styles={{
            input: {
              borderColor: errors.totalCombinedIncome ? '#E74C3C' : '#E0E0E0',
              '&:focus': {
                borderColor: errors.totalCombinedIncome ? '#E74C3C' : PRIMARY_BROWN,
              },
            },
          }}
        />
        <Text size="xs" c={MUTED_OLIVE} mt={4}>
          Include your income and spouse's income if applicable
        </Text>
      </Box>
    </Stack>
  );
}