import React from 'react';
import { IconCurrencyDollar } from '@tabler/icons-react';
import { TextInput, Group, Title, Paper, Stack } from '@mantine/core';
import { PRIMARY_GOLD, PRIMARY_BROWN, THEMED_LIGHT_BG } from '@utils/constants';
import { validationRules } from '@utils/validation';

export default function FinancialDetailsForm({ register, errors }) {
  return (
    <Stack spacing="md">
      <Group align="center" spacing="sm">
        <IconCurrencyDollar size={28} color={PRIMARY_BROWN} />
        <Title order={2} style={{ color: PRIMARY_BROWN }}>Financial Details</Title>
      </Group>
      
      <TextInput
        label="Current Source of Income"
        placeholder="Employment, Business, etc."
        required
        {...register('currentSourceOfIncome', validationRules.currentSourceOfIncome)}
        error={errors.currentSourceOfIncome?.message}
        styles={{
          input: { backgroundColor: THEMED_LIGHT_BG }
        }}
      />
      
      <TextInput
        label="Income / Month"
        type="number"
        placeholder="15000"
        required
        {...register('monthlyIncome', validationRules.monthlyIncome)}
        error={errors.monthlyIncome?.message}
        styles={{
          input: { backgroundColor: THEMED_LIGHT_BG }
        }}
      />
      
      <TextInput
        label="Nature of Work / Business"
        placeholder="Sales, IT, Retail, etc."
        required
        {...register('natureOfWork', validationRules.natureOfWork)}
        error={errors.natureOfWork?.message}
        styles={{
          input: { backgroundColor: THEMED_LIGHT_BG }
        }}
      />
      
      <TextInput
        label="Employer / Business Owner's Name"
        placeholder="ABC Corporation"
        required
        {...register('employerName', validationRules.employerName)}
        error={errors.employerName?.message}
        styles={{
          input: { backgroundColor: THEMED_LIGHT_BG }
        }}
      />
      
      <TextInput
        label="Employer / Business Address"
        placeholder="456 Business St, City"
        required
        {...register('employerAddress', validationRules.employerAddress)}
        error={errors.employerAddress?.message}
        styles={{
          input: { backgroundColor: THEMED_LIGHT_BG }
        }}
      />
      
      <TextInput
        label="Telephone"
        placeholder="(02) 8765-4321"
        {...register('employerTelephone', validationRules.employerTelephone)}
        error={errors.employerTelephone?.message}
        styles={{
          input: { backgroundColor: THEMED_LIGHT_BG }
        }}
      />
      
      <Paper p="md" style={{ backgroundColor: THEMED_LIGHT_BG, borderLeft: `4px solid ${PRIMARY_GOLD}` }}>
        <Title order={4} mb="sm" style={{ color: PRIMARY_BROWN }}>
          Spouse's Information (If applicable):
        </Title>
        <Stack spacing="sm">
          <TextInput
            label="Spouse's Source of Income"
            placeholder="Employment, Business, etc."
            {...register('spouseSourceOfIncome', validationRules.spouseSourceOfIncome)}
            error={errors.spouseSourceOfIncome?.message}
            styles={{
              input: { backgroundColor: 'white' }
            }}
          />
          <TextInput
            label="Spouse's Income / Month"
            type="number"
            placeholder="15000"
            {...register('spouseMonthlyIncome', validationRules.spouseMonthlyIncome)}
            error={errors.spouseMonthlyIncome?.message}
            styles={{
              input: { backgroundColor: 'white' }
            }}
          />
          <TextInput
            label="Spouse's Employer / Business Address"
            placeholder="789 Work Ave, City"
            {...register('spouseEmployerAddress', validationRules.spouseEmployerAddress)}
            error={errors.spouseEmployerAddress?.message}
            styles={{
              input: { backgroundColor: 'white' }
            }}
          />
        </Stack>
      </Paper>
      
      <TextInput
        label="Total Combined Monthly Income"
        type="number"
        placeholder="30000"
        {...register('totalCombinedIncome', validationRules.totalCombinedIncome)}
        error={errors.totalCombinedIncome?.message}
        styles={{
          input: { backgroundColor: THEMED_LIGHT_BG }
        }}
      />
    </Stack>
  );
}