import React from 'react';
import { IconCircleCheck } from '@tabler/icons-react';
import { Text, Group, Title, Paper, Grid, Stack } from '@mantine/core';
import { PRIMARY_GOLD, PRIMARY_BROWN, THEMED_LIGHT_BG, CHARCOAL } from '@utils/constants';

export default function ReviewForm({ formData, getValues }) {
  const allData = { ...formData, ...getValues() };
  
  return (
    <Stack spacing="lg">
      <Group align="center" spacing="sm">
        <IconCircleCheck size={28} color={PRIMARY_BROWN} />
        <Title order={2} style={{ color: PRIMARY_BROWN }}>Review Your Information</Title>
      </Group>
      
      <Paper p="lg" style={{ backgroundColor: THEMED_LIGHT_BG }}>
        <Title order={3} mb="md" style={{ color: PRIMARY_BROWN }}>Personal Details</Title>
        <Grid gutter="xs">
          <Grid.Col span={6}>
            <Text size="sm"><strong>Name:</strong> {allData.name}</Text>
          </Grid.Col>
          <Grid.Col span={6}>
            <Text size="sm"><strong>Age:</strong> {allData.age}</Text>
          </Grid.Col>
          <Grid.Col span={6}>
            <Text size="sm"><strong>Birthday:</strong> {allData.birthday}</Text>
          </Grid.Col>
          <Grid.Col span={6}>
            <Text size="sm"><strong>Sex:</strong> {allData.sex}</Text>
          </Grid.Col>
          <Grid.Col span={6}>
            <Text size="sm"><strong>Civil Status:</strong> {allData.civilStatus}</Text>
          </Grid.Col>
          <Grid.Col span={6}>
            <Text size="sm"><strong>Contact:</strong> {allData.contactNumber}</Text>
          </Grid.Col>
          <Grid.Col span={12}>
            <Text size="sm"><strong>Present Address:</strong> {allData.presentAddress}</Text>
          </Grid.Col>
        </Grid>
      </Paper>
      
      <Paper p="lg" style={{ backgroundColor: THEMED_LIGHT_BG }}>
        <Title order={3} mb="md" style={{ color: PRIMARY_BROWN }}>Financial Details</Title>
        <Grid gutter="xs">
          <Grid.Col span={6}>
            <Text size="sm"><strong>Income Source:</strong> {allData.currentSourceOfIncome}</Text>
          </Grid.Col>
          <Grid.Col span={6}>
            <Text size="sm"><strong>Monthly Income:</strong> ₱{allData.monthlyIncome}</Text>
          </Grid.Col>
          <Grid.Col span={6}>
            <Text size="sm"><strong>Nature of Work:</strong> {allData.natureOfWork}</Text>
          </Grid.Col>
          <Grid.Col span={6}>
            <Text size="sm"><strong>Employer:</strong> {allData.employerName}</Text>
          </Grid.Col>
        </Grid>
      </Paper>
      
      <Paper p="lg" style={{ backgroundColor: THEMED_LIGHT_BG }}>
        <Title order={3} mb="md" style={{ color: PRIMARY_BROWN }}>Case Details</Title>
        <Grid gutter="xs">
          <Grid.Col span={6}>
            <Text size="sm"><strong>Party Represented:</strong> {allData.partyRepresented}</Text>
          </Grid.Col>
          <Grid.Col span={6}>
            <Text size="sm"><strong>Case Number:</strong> {allData.caseNumber}</Text>
          </Grid.Col>
          <Grid.Col span={6}>
            <Text size="sm"><strong>Venue:</strong> {allData.venue}</Text>
          </Grid.Col>
          <Grid.Col span={6}>
            <Text size="sm"><strong>Present Stage:</strong> {allData.presentStage}</Text>
          </Grid.Col>
          <Grid.Col span={12}>
            <Text size="sm"><strong>Court:</strong> {allData.courtDivision}</Text>
          </Grid.Col>
        </Grid>
      </Paper>
      
      <Paper p="md" withBorder style={{ borderColor: PRIMARY_GOLD, backgroundColor: '#FFFBF0', borderWidth: 2 }}>
        <Text size="xs" style={{ color: CHARCOAL }}>
          <strong>DATA PRIVACY:</strong> Sebastinian Office of Legal Aid (SOLA), College of Law is committed to upholding the Philippine Data Privacy Act which implements the Constitutional right to informational privacy of data subjects. Your personal information is collected and processed in order for us to verify your identity, assess your application, and contact you about your case.
        </Text>
      </Paper>
    </Stack>
  );
}