import React from 'react';
import { IconBriefcase } from '@tabler/icons-react';
import { TextInput, Textarea, Group, Title, Paper, Grid, Stack, Text, Box } from '@mantine/core';
import { PRIMARY_GOLD, PRIMARY_BROWN, THEMED_LIGHT_BG, MUTED_OLIVE, CHARCOAL } from '@utils/constants';
import { validationRules } from '@utils/validation';

export default function CaseDetailsForm({ register, errors }) {
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
          <IconBriefcase size={18} color="white" />
        </Box>
        <Title order={3} c={CHARCOAL}>Case Details</Title>
      </Group>
      
      {/* Party Represented */}
      <Box>
        <Group gap={8} mb={8}>
          <Text size="sm" fw={600} c={CHARCOAL}>Party Represented</Text>
          <Text size="sm" c="red">*</Text>
        </Group>
        <TextInput
          placeholder="Plaintiff/Defendant"
          size="md"
          {...register('partyRepresented', validationRules.partyRepresented)}
          error={errors.partyRepresented?.message}
          styles={{
            input: {
              borderColor: errors.partyRepresented ? '#E74C3C' : '#E0E0E0',
              '&:focus': {
                borderColor: errors.partyRepresented ? '#E74C3C' : PRIMARY_BROWN,
              },
            },
          }}
        />
      </Box>
      
      {/* Venue and Case Number */}
      <Grid>
        <Grid.Col span={6}>
          <Box>
            <Group gap={8} mb={8}>
              <Text size="sm" fw={600} c={CHARCOAL}>Venue / City</Text>
              <Text size="sm" c="red">*</Text>
            </Group>
            <TextInput
              placeholder="Manila"
              size="md"
              {...register('venue', validationRules.venue)}
              error={errors.venue?.message}
              styles={{
                input: {
                  borderColor: errors.venue ? '#E74C3C' : '#E0E0E0',
                  '&:focus': {
                    borderColor: errors.venue ? '#E74C3C' : PRIMARY_BROWN,
                  },
                },
              }}
            />
          </Box>
        </Grid.Col>
        <Grid.Col span={6}>
          <Box>
            <Group gap={8} mb={8}>
              <Text size="sm" fw={600} c={CHARCOAL}>Case / Docket Number</Text>
              <Text size="sm" c="red">*</Text>
            </Group>
            <TextInput
              placeholder="Case No. 2024-123"
              size="md"
              {...register('caseNumber', validationRules.caseNumber)}
              error={errors.caseNumber?.message}
              styles={{
                input: {
                  borderColor: errors.caseNumber ? '#E74C3C' : '#E0E0E0',
                  '&:focus': {
                    borderColor: errors.caseNumber ? '#E74C3C' : PRIMARY_BROWN,
                  },
                },
              }}
            />
          </Box>
        </Grid.Col>
      </Grid>
      
      {/* Present Stage of the Case */}
      <Box>
        <Group gap={8} mb={8}>
          <Text size="sm" fw={600} c={CHARCOAL}>Present Stage of the Case</Text>
          <Text size="sm" c="red">*</Text>
        </Group>
        <TextInput
          placeholder="Pre-trial, Trial, etc."
          size="md"
          {...register('presentStage', validationRules.presentStage)}
          error={errors.presentStage?.message}
          styles={{
            input: {
              borderColor: errors.presentStage ? '#E74C3C' : '#E0E0E0',
              '&:focus': {
                borderColor: errors.presentStage ? '#E74C3C' : PRIMARY_BROWN,
              },
            },
          }}
        />
      </Box>
      
      {/* Nature of Case */}
      <Box>
        <Group gap={8} mb={8}>
          <Text size="sm" fw={600} c={CHARCOAL}>Nature of Case</Text>
          <Text size="sm" c="red">*</Text>
        </Group>
        <Textarea
          placeholder="Describe the nature of the case..."
          size="md"
          minRows={3}
          {...register('caseNature', validationRules.caseNature)}
          error={errors.caseNature?.message}
          styles={{
            input: {
              borderColor: errors.caseNature ? '#E74C3C' : '#E0E0E0',
              '&:focus': {
                borderColor: errors.caseNature ? '#E74C3C' : PRIMARY_BROWN,
              },
            },
          }}
        />
        <Text size="xs" c={MUTED_OLIVE} mt={4}>
          Provide a brief description of the legal matter
        </Text>
      </Box>
      
      {/* Court / Agency / Tribunal Division */}
      <Box>
        <Group gap={8} mb={8}>
          <Text size="sm" fw={600} c={CHARCOAL}>Court / Agency / Tribunal Division</Text>
          <Text size="sm" c="red">*</Text>
        </Group>
        <TextInput
          placeholder="RTC Branch 1"
          size="md"
          {...register('courtDivision', validationRules.courtDivision)}
          error={errors.courtDivision?.message}
          styles={{
            input: {
              borderColor: errors.courtDivision ? '#E74C3C' : '#E0E0E0',
              '&:focus': {
                borderColor: errors.courtDivision ? '#E74C3C' : PRIMARY_BROWN,
              },
            },
          }}
        />
      </Box>
      
      {/* Court / Agency / Tribunal Address */}
      <Box>
        <Group gap={8} mb={8}>
          <Text size="sm" fw={600} c={CHARCOAL}>Court / Agency / Tribunal Address</Text>
          <Text size="sm" c="red">*</Text>
        </Group>
        <TextInput
          placeholder="Justice Hall, City"
          size="md"
          {...register('courtAddress', validationRules.courtAddress)}
          error={errors.courtAddress?.message}
          styles={{
            input: {
              borderColor: errors.courtAddress ? '#E74C3C' : '#E0E0E0',
              '&:focus': {
                borderColor: errors.courtAddress ? '#E74C3C' : PRIMARY_BROWN,
              },
            },
          }}
        />
      </Box>
      
      {/* Phone Number */}
      <Box>
        <Text size="sm" fw={600} c={CHARCOAL} mb={8}>Phone Number</Text>
        <TextInput
          placeholder="(02) 1111-2222"
          size="md"
          {...register('courtPhoneNumber', validationRules.courtPhoneNumber)}
          error={errors.courtPhoneNumber?.message}
          styles={{
            input: {
              borderColor: errors.courtPhoneNumber ? '#E74C3C' : '#E0E0E0',
              '&:focus': {
                borderColor: errors.courtPhoneNumber ? '#E74C3C' : PRIMARY_BROWN,
              },
            },
          }}
        />
      </Box>
      
      {/* Presiding Officer */}
      <Box>
        <Group gap={8} mb={8}>
          <Text size="sm" fw={600} c={CHARCOAL}>Presiding Officer</Text>
          <Text size="sm" c="red">*</Text>
        </Group>
        <TextInput
          placeholder="Hon. Judge Name"
          size="md"
          {...register('presidingOfficer', validationRules.presidingOfficer)}
          error={errors.presidingOfficer?.message}
          styles={{
            input: {
              borderColor: errors.presidingOfficer ? '#E74C3C' : '#E0E0E0',
              '&:focus': {
                borderColor: errors.presidingOfficer ? '#E74C3C' : PRIMARY_BROWN,
              },
            },
          }}
        />
      </Box>
      
      {/* Adverse Party Information Section */}
      <Paper p="lg" style={{ backgroundColor: `${PRIMARY_GOLD}10`, border: `1px solid ${PRIMARY_GOLD}` }}>
        <Title order={4} mb="md" c={CHARCOAL}>
          Adverse Party Information
        </Title>
        <Stack gap="md">
          {/* Adverse Party(ies) */}
          <Box>
            <Text size="sm" fw={600} c={CHARCOAL} mb={8}>Adverse Party(ies)</Text>
            <TextInput
              placeholder="Name of opposing party"
              size="md"
              {...register('adverseParty', validationRules.adverseParty)}
              error={errors.adverseParty?.message}
              styles={{
                input: {
                  backgroundColor: 'white',
                  borderColor: errors.adverseParty ? '#E74C3C' : '#E0E0E0',
                  '&:focus': {
                    borderColor: errors.adverseParty ? '#E74C3C' : PRIMARY_BROWN,
                  },
                },
              }}
            />
          </Box>
          
          {/* Adverse Party(ies) Address */}
          <Box>
            <Text size="sm" fw={600} c={CHARCOAL} mb={8}>Adverse Party(ies) Address</Text>
            <TextInput
              placeholder="Address of opposing party"
              size="md"
              {...register('adversePartyAddress', validationRules.adversePartyAddress)}
              error={errors.adversePartyAddress?.message}
              styles={{
                input: {
                  backgroundColor: 'white',
                  borderColor: errors.adversePartyAddress ? '#E74C3C' : '#E0E0E0',
                  '&:focus': {
                    borderColor: errors.adversePartyAddress ? '#E74C3C' : PRIMARY_BROWN,
                  },
                },
              }}
            />
          </Box>
          
          {/* Adverse Party(ies) Counsel */}
          <Box>
            <Text size="sm" fw={600} c={CHARCOAL} mb={8}>Adverse Party(ies) Counsel</Text>
            <TextInput
              placeholder="Atty. Name"
              size="md"
              {...register('adversePartyCounsel', validationRules.adversePartyCounsel)}
              error={errors.adversePartyCounsel?.message}
              styles={{
                input: {
                  backgroundColor: 'white',
                  borderColor: errors.adversePartyCounsel ? '#E74C3C' : '#E0E0E0',
                  '&:focus': {
                    borderColor: errors.adversePartyCounsel ? '#E74C3C' : PRIMARY_BROWN,
                  },
                },
              }}
            />
          </Box>
          
          {/* Adverse Party(ies) Counsel Address */}
          <Box>
            <Text size="sm" fw={600} c={CHARCOAL} mb={8}>Adverse Party(ies) Counsel Address</Text>
            <TextInput
              placeholder="Law Office Address"
              size="md"
              {...register('adversePartyCounselAddress', validationRules.adversePartyCounselAddress)}
              error={errors.adversePartyCounselAddress?.message}
              styles={{
                input: {
                  backgroundColor: 'white',
                  borderColor: errors.adversePartyCounselAddress ? '#E74C3C' : '#E0E0E0',
                  '&:focus': {
                    borderColor: errors.adversePartyCounselAddress ? '#E74C3C' : PRIMARY_BROWN,
                  },
                },
              }}
            />
          </Box>
          
          {/* Adverse Party(ies) Counsel Phone Number */}
          <Box>
            <Text size="sm" fw={600} c={CHARCOAL} mb={8}>Adverse Party(ies) Counsel Phone Number</Text>
            <TextInput
              placeholder="(02) 3333-4444"
              size="md"
              {...register('adversePartyCounselPhone', validationRules.adversePartyCounselPhone)}
              error={errors.adversePartyCounselPhone?.message}
              styles={{
                input: {
                  backgroundColor: 'white',
                  borderColor: errors.adversePartyCounselPhone ? '#E74C3C' : '#E0E0E0',
                  '&:focus': {
                    borderColor: errors.adversePartyCounselPhone ? '#E74C3C' : PRIMARY_BROWN,
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