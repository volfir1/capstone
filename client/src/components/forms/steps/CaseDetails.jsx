import React from 'react';
import { IconBriefcase, IconGavel, IconScale } from '@tabler/icons-react';
import { TextInput, Textarea, Group, Title, Paper, Grid, Stack, Text, Box } from '@mantine/core';
import { PRIMARY_GOLD, PRIMARY_BROWN, MUTED_OLIVE, CHARCOAL } from '@utils/constants';
import { validationRules } from '@utils/validation';

export default function CaseDetailsForm({ register, errors, watch, setValue }) {
  // Auto-format phone number with fixed +63
  const formatPhoneNumber = (value) => {
    if (!value) return '';
    const cleaned = value.replace(/\D/g, '');
    const number = cleaned.startsWith('63') ? cleaned.substring(2) : cleaned;
    const limited = number.substring(0, 10);
    if (limited.length <= 3) {
      return `+63 ${limited}`;
    } else if (limited.length <= 6) {
      return `+63 ${limited.slice(0, 3)} ${limited.slice(3)}`;
    } else {
      return `+63 ${limited.slice(0, 3)} ${limited.slice(3, 6)} ${limited.slice(6)}`;
    }
  };

  return (
    <Stack gap="md" mt="md">
      {/* Case Information */}
      <Paper p="lg" radius="lg" style={{ background: '#FAFAFA', border: '1px solid #F0F0F0' }}>
        <Group gap={8} mb="md">
          <Box style={{ width: 28, height: 28, borderRadius: 7, background: PRIMARY_BROWN, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IconBriefcase size={14} color="white" stroke={2.5} />
          </Box>
          <Text size="sm" fw={600} c={CHARCOAL} tt="uppercase" lts={0.5}>Case Information</Text>
        </Group>

        <Stack gap="sm">
          <Grid gutter="sm">
            <Grid.Col span={6}>
              <Group gap={4} mb={6}>
                <Text size="sm" fw={600} c={CHARCOAL}>Party Represented</Text>
              </Group>
              <TextInput
                placeholder="Plaintiff/Defendant"
                size="sm"
                {...register('partyRepresented', validationRules.partyRepresented)}
                error={errors.partyRepresented?.message}
                styles={{ input: { borderColor: errors.partyRepresented ? '#E74C3C' : '#E0E0E0' } }}
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <Group gap={4} mb={6}>
                <Text size="sm" fw={600} c={CHARCOAL}>Case / Docket Number</Text>
              </Group>
              <TextInput
                placeholder="Case No. 2024-123"
                size="sm"
                {...register('caseNumber', validationRules.caseNumber)}
                error={errors.caseNumber?.message}
                styles={{ input: { borderColor: errors.caseNumber ? '#E74C3C' : '#E0E0E0' } }}
              />
            </Grid.Col>
          </Grid>

          <Grid gutter="sm">
            <Grid.Col span={6}>
              <Group gap={4} mb={6}>
                <Text size="sm" fw={600} c={CHARCOAL}>Venue / City</Text>
              </Group>
              <TextInput
                placeholder="Manila"
                size="sm"
                {...register('venue', validationRules.venue)}
                error={errors.venue?.message}
                styles={{ input: { borderColor: errors.venue ? '#E74C3C' : '#E0E0E0' } }}
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <Group gap={4} mb={6}>
                <Text size="sm" fw={600} c={CHARCOAL}>Present Stage</Text>
              </Group>
              <TextInput
                placeholder="Pre-trial, Trial, etc."
                size="sm"
                {...register('presentStage', validationRules.presentStage)}
                error={errors.presentStage?.message}
                styles={{ input: { borderColor: errors.presentStage ? '#E74C3C' : '#E0E0E0' } }}
              />
            </Grid.Col>
          </Grid>

          <Box>
            <Group gap={4} mb={6}>
              <Text size="sm" fw={600} c={CHARCOAL}>Nature of Case</Text>
            </Group>
            <Textarea
              placeholder="Describe the nature of the case..."
              size="sm"
              minRows={3}
              {...register('caseNature', validationRules.caseNature)}
              error={errors.caseNature?.message}
              styles={{ input: { borderColor: errors.caseNature ? '#E74C3C' : '#E0E0E0' } }}
            />
            <Text size="xs" c={MUTED_OLIVE} mt={4}>Provide a brief description of the legal matter</Text>
          </Box>
        </Stack>
      </Paper>

      {/* Court / Tribunal Information */}
      <Paper p="lg" radius="lg" style={{ background: '#FAFAFA', border: '1px solid #F0F0F0' }}>
        <Group gap={8} mb="md">
          <Box style={{ width: 28, height: 28, borderRadius: 7, background: '#4DABF7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IconGavel size={14} color="white" stroke={2.5} />
          </Box>
          <Text size="sm" fw={600} c={CHARCOAL} tt="uppercase" lts={0.5}>Court / Tribunal</Text>
        </Group>

        <Stack gap="sm">
          <Grid gutter="sm">
            <Grid.Col span={6}>
              <Group gap={4} mb={6}>
                <Text size="sm" fw={600} c={CHARCOAL}>Division</Text>
              </Group>
              <TextInput
                placeholder="RTC Branch 1"
                size="sm"
                {...register('courtDivision', validationRules.courtDivision)}
                error={errors.courtDivision?.message}
                styles={{ input: { borderColor: errors.courtDivision ? '#E74C3C' : '#E0E0E0' } }}
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <Group gap={4} mb={6}>
                <Text size="sm" fw={600} c={CHARCOAL}>Presiding Officer</Text>
              </Group>
              <TextInput
                placeholder="Hon. Judge Name"
                size="sm"
                {...register('presidingOfficer', validationRules.presidingOfficer)}
                error={errors.presidingOfficer?.message}
                styles={{ input: { borderColor: errors.presidingOfficer ? '#E74C3C' : '#E0E0E0' } }}
              />
            </Grid.Col>
          </Grid>

          <Grid gutter="sm">
            <Grid.Col span={8}>
              <Group gap={4} mb={6}>
                <Text size="sm" fw={600} c={CHARCOAL}>Court Address</Text>
              </Group>
              <TextInput
                placeholder="Justice Hall, City"
                size="sm"
                {...register('courtAddress', validationRules.courtAddress)}
                error={errors.courtAddress?.message}
                styles={{ input: { borderColor: errors.courtAddress ? '#E74C3C' : '#E0E0E0' } }}
              />
            </Grid.Col>
            <Grid.Col span={4}>
              <Text size="sm" fw={600} c={CHARCOAL} mb={6}>Phone Number</Text>
              <TextInput
                placeholder="+63 XXX XXX XXXX"
                size="sm"
                {...register('courtPhoneNumber', validationRules.courtPhoneNumber)}
                error={errors.courtPhoneNumber?.message}
                value={watch('courtPhoneNumber') || '+63 '}
                onChange={(e) => {
                  const formatted = formatPhoneNumber(e.target.value);
                  setValue('courtPhoneNumber', formatted);
                }}
                onFocus={(e) => {
                  if (!e.target.value || e.target.value === '') setValue('courtPhoneNumber', '+63 ');
                }}
                styles={{ input: { borderColor: errors.courtPhoneNumber ? '#E74C3C' : '#E0E0E0' } }}
              />
            </Grid.Col>
          </Grid>
        </Stack>
      </Paper>

      {/* Adverse Party Information */}
      <Paper p="lg" radius="lg" style={{ background: '#FAFAFA', border: '1px solid #F0F0F0' }}>
        <Group gap={8} mb="md">
          <Box style={{ width: 28, height: 28, borderRadius: 7, background: '#FA5252', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IconScale size={14} color="white" stroke={2.5} />
          </Box>
          <Text size="sm" fw={600} c={CHARCOAL} tt="uppercase" lts={0.5}>Adverse Party</Text>
        </Group>

        <Stack gap="sm">
          <Grid gutter="sm">
            <Grid.Col span={6}>
              <Text size="sm" fw={600} c={CHARCOAL} mb={6}>Adverse Party(ies)</Text>
              <TextInput
                placeholder="Name of opposing party"
                size="sm"
                {...register('adverseParty', validationRules.adverseParty)}
                error={errors.adverseParty?.message}
                styles={{ input: { borderColor: errors.adverseParty ? '#E74C3C' : '#E0E0E0' } }}
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <Text size="sm" fw={600} c={CHARCOAL} mb={6}>Address</Text>
              <TextInput
                placeholder="Address of opposing party"
                size="sm"
                {...register('adversePartyAddress', validationRules.adversePartyAddress)}
                error={errors.adversePartyAddress?.message}
                styles={{ input: { borderColor: errors.adversePartyAddress ? '#E74C3C' : '#E0E0E0' } }}
              />
            </Grid.Col>
          </Grid>

          <Grid gutter="sm">
            <Grid.Col span={6}>
              <Text size="sm" fw={600} c={CHARCOAL} mb={6}>Phone Number</Text>
              <TextInput
                placeholder="+63 XXX XXX XXXX"
                size="sm"
                {...register('adversePartyPhone', validationRules.adversePartyPhone)}
                error={errors.adversePartyPhone?.message}
                value={watch('adversePartyPhone') || '+63 '}
                onChange={(e) => {
                  const formatted = formatPhoneNumber(e.target.value);
                  setValue('adversePartyPhone', formatted);
                }}
                onFocus={(e) => {
                  if (!e.target.value || e.target.value === '') setValue('adversePartyPhone', '+63 ');
                }}
                styles={{ input: { borderColor: errors.adversePartyPhone ? '#E74C3C' : '#E0E0E0' } }}
              />
            </Grid.Col>
          </Grid>

          <Grid gutter="sm">
            <Grid.Col span={4}>
              <Text size="sm" fw={600} c={CHARCOAL} mb={6}>Counsel</Text>
              <TextInput
                placeholder="Atty. Name"
                size="sm"
                {...register('adversePartyCounsel', validationRules.adversePartyCounsel)}
                error={errors.adversePartyCounsel?.message}
                styles={{ input: { borderColor: errors.adversePartyCounsel ? '#E74C3C' : '#E0E0E0' } }}
              />
            </Grid.Col>
            <Grid.Col span={4}>
              <Text size="sm" fw={600} c={CHARCOAL} mb={6}>Counsel Address</Text>
              <TextInput
                placeholder="Law Office Address"
                size="sm"
                {...register('adversePartyCounselAddress', validationRules.adversePartyCounselAddress)}
                error={errors.adversePartyCounselAddress?.message}
                styles={{ input: { borderColor: errors.adversePartyCounselAddress ? '#E74C3C' : '#E0E0E0' } }}
              />
            </Grid.Col>
            <Grid.Col span={4}>
              <Text size="sm" fw={600} c={CHARCOAL} mb={6}>Counsel Phone</Text>
              <TextInput
                placeholder="+63 XXX XXX XXXX"
                size="sm"
                {...register('adversePartyCounselPhone', validationRules.adversePartyCounselPhone)}
                error={errors.adversePartyCounselPhone?.message}
                value={watch('adversePartyCounselPhone') || '+63 '}
                onChange={(e) => {
                  const formatted = formatPhoneNumber(e.target.value);
                  setValue('adversePartyCounselPhone', formatted);
                }}
                onFocus={(e) => {
                  if (!e.target.value || e.target.value === '') setValue('adversePartyCounselPhone', '+63 ');
                }}
                styles={{ input: { borderColor: errors.adversePartyCounselPhone ? '#E74C3C' : '#E0E0E0' } }}
              />
            </Grid.Col>
          </Grid>
        </Stack>
      </Paper>
    </Stack>
  );
}