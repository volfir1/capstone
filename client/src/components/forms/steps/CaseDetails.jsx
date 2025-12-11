import React from 'react';
import { IconBriefcase } from '@tabler/icons-react';
import { TextInput, Textarea, Group, Title, Paper, Grid, Stack } from '@mantine/core';
import { PRIMARY_GOLD, PRIMARY_BROWN, THEMED_LIGHT_BG } from '@utils/constants';
import { validationRules } from '@utils/validation';

export default function CaseDetailsForm({ register, errors }) {
  return (
    <Stack spacing="md">
      <Group align="center" spacing="sm">
        <IconBriefcase size={28} color={PRIMARY_BROWN} />
        <Title order={2} style={{ color: PRIMARY_BROWN }}>Case Details</Title>
      </Group>
      
      <TextInput
        label="Party Represented"
        placeholder="Plaintiff/Defendant"
        required
        {...register('partyRepresented', validationRules.partyRepresented)}
        error={errors.partyRepresented?.message}
        styles={{
          input: { backgroundColor: THEMED_LIGHT_BG }
        }}
      />
      
      <Grid>
        <Grid.Col span={6}>
          <TextInput
            label="Venue / City"
            placeholder="Manila"
            required
            {...register('venue', validationRules.venue)}
            error={errors.venue?.message}
            styles={{
              input: { backgroundColor: THEMED_LIGHT_BG }
            }}
          />
        </Grid.Col>
        <Grid.Col span={6}>
          <TextInput
            label="Case / Docket Number"
            placeholder="Case No. 2024-123"
            required
            {...register('caseNumber', validationRules.caseNumber)}
            error={errors.caseNumber?.message}
            styles={{
              input: { backgroundColor: THEMED_LIGHT_BG }
            }}
          />
        </Grid.Col>
      </Grid>
      
      <TextInput
        label="Present Stage of the Case"
        placeholder="Pre-trial, Trial, etc."
        required
        {...register('presentStage', validationRules.presentStage)}
        error={errors.presentStage?.message}
        styles={{
          input: { backgroundColor: THEMED_LIGHT_BG }
        }}
      />
      
      <Textarea
        label="Nature of Case"
        placeholder="Describe the nature of the case..."
        required
        minRows={3}
        {...register('caseNature', validationRules.caseNature)}
        error={errors.caseNature?.message}
        styles={{
          input: { backgroundColor: THEMED_LIGHT_BG }
        }}
      />
      
      <TextInput
        label="Court / Agency / Tribunal Division"
        placeholder="RTC Branch 1"
        required
        {...register('courtDivision', validationRules.courtDivision)}
        error={errors.courtDivision?.message}
        styles={{
          input: { backgroundColor: THEMED_LIGHT_BG }
        }}
      />
      
      <TextInput
        label="Court / Agency / Tribunal Address"
        placeholder="Justice Hall, City"
        required
        {...register('courtAddress', validationRules.courtAddress)}
        error={errors.courtAddress?.message}
        styles={{
          input: { backgroundColor: THEMED_LIGHT_BG }
        }}
      />
      
      <TextInput
        label="Phone Number"
        placeholder="(02) 1111-2222"
        {...register('courtPhoneNumber', validationRules.courtPhoneNumber)}
        error={errors.courtPhoneNumber?.message}
        styles={{
          input: { backgroundColor: THEMED_LIGHT_BG }
        }}
      />
      
      <TextInput
        label="Presiding Officer"
        placeholder="Hon. Judge Name"
        required
        {...register('presidingOfficer', validationRules.presidingOfficer)}
        error={errors.presidingOfficer?.message}
        styles={{
          input: { backgroundColor: THEMED_LIGHT_BG }
        }}
      />
      
      <Paper p="md" style={{ backgroundColor: THEMED_LIGHT_BG, borderLeft: `4px solid ${PRIMARY_GOLD}` }}>
        <Title order={4} mb="sm" style={{ color: PRIMARY_BROWN }}>
          Adverse Party Information:
        </Title>
        <Stack spacing="sm">
          <TextInput
            label="Adverse Party(ies)"
            placeholder="Name of opposing party"
            {...register('adverseParty', validationRules.adverseParty)}
            error={errors.adverseParty?.message}
            styles={{
              input: { backgroundColor: 'white' }
            }}
          />
          <TextInput
            label="Adverse Party(ies) Address"
            placeholder="Address of opposing party"
            {...register('adversePartyAddress', validationRules.adversePartyAddress)}
            error={errors.adversePartyAddress?.message}
            styles={{
              input: { backgroundColor: 'white' }
            }}
          />
          <TextInput
            label="Adverse Party(ies) Counsel"
            placeholder="Atty. Name"
            {...register('adversePartyCounsel', validationRules.adversePartyCounsel)}
            error={errors.adversePartyCounsel?.message}
            styles={{
              input: { backgroundColor: 'white' }
            }}
          />
          <TextInput
            label="Adverse Party(ies) Counsel Address"
            placeholder="Law Office Address"
            {...register('adversePartyCounselAddress', validationRules.adversePartyCounselAddress)}
            error={errors.adversePartyCounselAddress?.message}
            styles={{
              input: { backgroundColor: 'white' }
            }}
          />
          <TextInput
            label="Adverse Party(ies) Counsel Phone Number"
            placeholder="(02) 3333-4444"
            {...register('adversePartyCounselPhone', validationRules.adversePartyCounselPhone)}
            error={errors.adversePartyCounselPhone?.message}
            styles={{
              input: { backgroundColor: 'white' }
            }}
          />
        </Stack>
      </Paper>
    </Stack>
  );
}