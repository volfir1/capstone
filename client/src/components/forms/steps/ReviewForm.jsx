import React from 'react';
import { IconCircleCheck, IconInfoCircle } from '@tabler/icons-react';
import { Text, Group, Title, Paper, Grid, Stack, Box, Divider, Alert } from '@mantine/core';
import { PRIMARY_GOLD, PRIMARY_BROWN, THEMED_LIGHT_BG, CHARCOAL, MUTED_OLIVE } from '@utils/constants';

export default function ReviewForm({ formData, getValues }) {
  const allData = { ...formData, ...getValues() };
  
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
          <IconCircleCheck size={18} color="white" />
        </Box>
        <Title order={3} c={CHARCOAL}>Review Your Information</Title>
      </Group>
      
      <Text size="sm" c={MUTED_OLIVE}>
        Please review all the information you've provided before submitting your application.
      </Text>
      
      {/* Personal Details */}
      <Paper shadow="xs" p="lg" radius="lg" style={{ backgroundColor: 'white', border: '1px solid #F0F0F0' }}>
        <Title order={4} mb="md" c={CHARCOAL}>Personal Details</Title>
        <Divider mb="md" color="#F0F0F0" />
        <Grid gutter="md">
          <Grid.Col span={6}>
            <Box>
              <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} mb={4}>Name</Text>
              <Text size="sm" c={CHARCOAL} fw={500}>{allData.name || 'N/A'}</Text>
            </Box>
          </Grid.Col>
          <Grid.Col span={6}>
            <Box>
              <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} mb={4}>Age</Text>
              <Text size="sm" c={CHARCOAL} fw={500}>{allData.age || 'N/A'}</Text>
            </Box>
          </Grid.Col>
          <Grid.Col span={6}>
            <Box>
              <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} mb={4}>Birthday</Text>
              <Text size="sm" c={CHARCOAL} fw={500}>{allData.birthday || 'N/A'}</Text>
            </Box>
          </Grid.Col>
          <Grid.Col span={6}>
            <Box>
              <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} mb={4}>Sex</Text>
              <Text size="sm" c={CHARCOAL} fw={500}>{allData.sex || 'N/A'}</Text>
            </Box>
          </Grid.Col>
          <Grid.Col span={6}>
            <Box>
              <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} mb={4}>Civil Status</Text>
              <Text size="sm" c={CHARCOAL} fw={500}>{allData.civilStatus || 'N/A'}</Text>
            </Box>
          </Grid.Col>
          <Grid.Col span={6}>
            <Box>
              <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} mb={4}>Contact Number</Text>
              <Text size="sm" c={CHARCOAL} fw={500}>{allData.contactNumber || 'N/A'}</Text>
            </Box>
          </Grid.Col>
          <Grid.Col span={12}>
            <Box>
              <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} mb={4}>Present Address</Text>
              <Text size="sm" c={CHARCOAL} fw={500}>{allData.presentAddress || 'N/A'}</Text>
            </Box>
          </Grid.Col>
          <Grid.Col span={12}>
            <Box>
              <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} mb={4}>Permanent Address</Text>
              <Text size="sm" c={CHARCOAL} fw={500}>{allData.permanentAddress || 'N/A'}</Text>
            </Box>
          </Grid.Col>
        </Grid>
      </Paper>
      
      {/* Financial Details */}
      <Paper shadow="xs" p="lg" radius="lg" style={{ backgroundColor: 'white', border: '1px solid #F0F0F0' }}>
        <Title order={4} mb="md" c={CHARCOAL}>Financial Details</Title>
        <Divider mb="md" color="#F0F0F0" />
        <Grid gutter="md">
          <Grid.Col span={6}>
            <Box>
              <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} mb={4}>Income Source</Text>
              <Text size="sm" c={CHARCOAL} fw={500}>{allData.currentSourceOfIncome || 'N/A'}</Text>
            </Box>
          </Grid.Col>
          <Grid.Col span={6}>
            <Box>
              <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} mb={4}>Monthly Income</Text>
              <Text size="sm" c={CHARCOAL} fw={500}>
                {allData.monthlyIncome ? `₱${Number(allData.monthlyIncome).toLocaleString()}` : 'N/A'}
              </Text>
            </Box>
          </Grid.Col>
          <Grid.Col span={6}>
            <Box>
              <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} mb={4}>Nature of Work</Text>
              <Text size="sm" c={CHARCOAL} fw={500}>{allData.natureOfWork || 'N/A'}</Text>
            </Box>
          </Grid.Col>
          <Grid.Col span={6}>
            <Box>
              <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} mb={4}>Employer</Text>
              <Text size="sm" c={CHARCOAL} fw={500}>{allData.employerName || 'N/A'}</Text>
            </Box>
          </Grid.Col>
          <Grid.Col span={12}>
            <Box>
              <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} mb={4}>Employer Address</Text>
              <Text size="sm" c={CHARCOAL} fw={500}>{allData.employerAddress || 'N/A'}</Text>
            </Box>
          </Grid.Col>
        </Grid>
      </Paper>
      
      {/* Case Details */}
      <Paper shadow="xs" p="lg" radius="lg" style={{ backgroundColor: 'white', border: '1px solid #F0F0F0' }}>
        <Title order={4} mb="md" c={CHARCOAL}>Case Details</Title>
        <Divider mb="md" color="#F0F0F0" />
        <Grid gutter="md">
          <Grid.Col span={6}>
            <Box>
              <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} mb={4}>Party Represented</Text>
              <Text size="sm" c={CHARCOAL} fw={500}>{allData.partyRepresented || 'N/A'}</Text>
            </Box>
          </Grid.Col>
          <Grid.Col span={6}>
            <Box>
              <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} mb={4}>Case Number</Text>
              <Text size="sm" c={CHARCOAL} fw={500}>{allData.caseNumber || 'N/A'}</Text>
            </Box>
          </Grid.Col>
          <Grid.Col span={6}>
            <Box>
              <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} mb={4}>Venue</Text>
              <Text size="sm" c={CHARCOAL} fw={500}>{allData.venue || 'N/A'}</Text>
            </Box>
          </Grid.Col>
          <Grid.Col span={6}>
            <Box>
              <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} mb={4}>Present Stage</Text>
              <Text size="sm" c={CHARCOAL} fw={500}>{allData.presentStage || 'N/A'}</Text>
            </Box>
          </Grid.Col>
          <Grid.Col span={12}>
            <Box>
              <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} mb={4}>Court Division</Text>
              <Text size="sm" c={CHARCOAL} fw={500}>{allData.courtDivision || 'N/A'}</Text>
            </Box>
          </Grid.Col>
          <Grid.Col span={12}>
            <Box>
              <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} mb={4}>Court Address</Text>
              <Text size="sm" c={CHARCOAL} fw={500}>{allData.courtAddress || 'N/A'}</Text>
            </Box>
          </Grid.Col>
          <Grid.Col span={12}>
            <Box>
              <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} mb={4}>Presiding Officer</Text>
              <Text size="sm" c={CHARCOAL} fw={500}>{allData.presidingOfficer || 'N/A'}</Text>
            </Box>
          </Grid.Col>
        </Grid>
      </Paper>
      
      {/* Data Privacy Notice */}
      <Alert
        icon={<IconInfoCircle size={20} />}
        styles={{
          root: {
            backgroundColor: `${PRIMARY_GOLD}10`,
            border: `1px solid ${PRIMARY_GOLD}`,
          },
          icon: {
            color: PRIMARY_BROWN,
          },
        }}
      >
        <Text size="sm" fw={600} c={CHARCOAL} mb={4}>Data Privacy Notice</Text>
        <Text size="xs" c={CHARCOAL}>
          Sebastinian Office of Legal Aid (SOLA), College of Law is committed to upholding the Philippine Data Privacy Act which implements the Constitutional right to informational privacy of data subjects. Your personal information is collected and processed in order for us to verify your identity, assess your application, and contact you about your case.
        </Text>
      </Alert>
    </Stack>
  );
}