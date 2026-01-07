import React, { useState, useEffect } from 'react';
import { IconCircleCheck, IconInfoCircle, IconCalendar, IconClock } from '@tabler/icons-react';
import { Text, Group, Title, Paper, Grid, Stack, Box, Divider, Alert, Select } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { PRIMARY_GOLD, PRIMARY_BROWN, THEMED_LIGHT_BG, CHARCOAL, MUTED_OLIVE } from '@utils/constants';

export default function ReviewForm({ formData, getValues, setValue }) {
  const allData = { ...formData, ...getValues() };
  const [appointmentDate, setAppointmentDate] = useState(allData.appointedDate ? new Date(allData.appointedDate) : null);
  const [appointmentTime, setAppointmentTime] = useState(allData.appointmentTime || '09:00');
  
  // Generate time options (9 AM to 5 PM)
  const timeOptions = [
    { value: '09:00', label: '9:00 AM' },
    { value: '09:30', label: '9:30 AM' },
    { value: '10:00', label: '10:00 AM' },
    { value: '10:30', label: '10:30 AM' },
    { value: '11:00', label: '11:00 AM' },
    { value: '11:30', label: '11:30 AM' },
    { value: '13:00', label: '1:00 PM' },
    { value: '13:30', label: '1:30 PM' },
    { value: '14:00', label: '2:00 PM' },
    { value: '14:30', label: '2:30 PM' },
    { value: '15:00', label: '3:00 PM' },
    { value: '15:30', label: '3:30 PM' },
    { value: '16:00', label: '4:00 PM' },
    { value: '16:30', label: '4:30 PM' },
    { value: '17:00', label: '5:00 PM' },
  ];
  
  // Update parent form when appointment date or time changes
  useEffect(() => {
    console.log('ReviewForm useEffect - appointmentDate:', appointmentDate);
    console.log('ReviewForm useEffect - typeof:', typeof appointmentDate);
    
    if (appointmentDate) {
      // Handle both Date objects and strings
      let dateToSave;
      if (appointmentDate instanceof Date) {
        dateToSave = appointmentDate.toISOString();
      } else if (typeof appointmentDate === 'string') {
        // If it's already a string (like "2026-01-08"), convert to Date then to ISO
        const dateObj = new Date(appointmentDate);
        if (!isNaN(dateObj.getTime())) {
          dateToSave = dateObj.toISOString();
        }
      }
      
      if (dateToSave) {
        console.log('ReviewForm - Setting appointedDate to:', dateToSave);
        setValue('appointedDate', dateToSave);
      }
    }
    
    if (appointmentTime) {
      console.log('ReviewForm - Setting appointmentTime to:', appointmentTime);
      setValue('appointmentTime', appointmentTime);
    }
  }, [appointmentDate, appointmentTime, setValue]);
  
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
      
      {/* Appointment Date & Time */}
      <Paper shadow="xs" p="lg" radius="lg" style={{ backgroundColor: 'white', border: '1px solid #F0F0F0' }}>
        <Title order={4} mb="md" c={CHARCOAL}>Preferred Appointment Date & Time</Title>
        <Divider mb="md" color="#F0F0F0" />
        <Text size="sm" c={MUTED_OLIVE} mb="md">
          Select your preferred date and time for the consultation appointment. The office will confirm availability and contact you.
        </Text>
        
        <Grid gutter="md">
          <Grid.Col span={6}>
            <DateInput
              value={appointmentDate}
              onChange={setAppointmentDate}
              label="Appointment Date"
              placeholder="Select a date"
              leftSection={<IconCalendar size={18} color={PRIMARY_BROWN} />}
              valueFormat="MMMM DD, YYYY"
              minDate={new Date()}
              clearable
              required
              styles={{
                input: {
                  borderColor: '#E0E0E0',
                  '&:focus': {
                    borderColor: PRIMARY_BROWN,
                  },
                },
                label: {
                  color: CHARCOAL,
                  fontWeight: 600,
                  marginBottom: '8px',
                },
              }}
            />
          </Grid.Col>
          
          <Grid.Col span={6}>
            <Select
              value={appointmentTime}
              onChange={setAppointmentTime}
              label="Appointment Time"
              placeholder="Select a time"
              data={timeOptions}
              leftSection={<IconClock size={18} color={PRIMARY_BROWN} />}
              clearable
              required
              styles={{
                input: {
                  borderColor: '#E0E0E0',
                  '&:focus': {
                    borderColor: PRIMARY_BROWN,
                  },
                },
                label: {
                  color: CHARCOAL,
                  fontWeight: 600,
                  marginBottom: '8px',
                },
              }}
            />
          </Grid.Col>
        </Grid>
        
        {appointmentDate && appointmentDate instanceof Date && !isNaN(appointmentDate) && appointmentTime && (
          <Alert
            mt="md"
            icon={<IconInfoCircle size={18} />}
            styles={{
              root: {
                backgroundColor: `${PRIMARY_BROWN}10`,
                border: `1px solid ${PRIMARY_BROWN}`,
              },
              icon: {
                color: PRIMARY_BROWN,
              },
            }}
          >
            <Text size="sm" c={CHARCOAL}>
              <strong>Selected Date & Time:</strong> {appointmentDate.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })} at {timeOptions.find(t => t.value === appointmentTime)?.label || appointmentTime}
            </Text>
          </Alert>
        )}
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