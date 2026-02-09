import React, { useState, useEffect } from 'react';
import { IconCircleCheck, IconInfoCircle, IconCalendar, IconClock, IconUser, IconCoin, IconBriefcase } from '@tabler/icons-react';
import { Text, Group, Title, Paper, Grid, Stack, Box, Divider, Alert, Select } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { PRIMARY_GOLD, PRIMARY_BROWN, CHARCOAL, MUTED_OLIVE, ACCENT_TAN } from '@utils/constants';

export default function ReviewForm({ formData, getValues, setValue }) {
  const allData = { ...formData, ...getValues() };
  const [appointmentDate, setAppointmentDate] = useState(allData.appointedDate ? new Date(allData.appointedDate) : null);
  const [appointmentTime, setAppointmentTime] = useState(allData.appointmentTime || '09:00');

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

  useEffect(() => {
    if (appointmentDate) {
      let dateToSave;
      if (appointmentDate instanceof Date) {
        dateToSave = appointmentDate.toISOString();
      } else if (typeof appointmentDate === 'string') {
        const dateObj = new Date(appointmentDate);
        if (!isNaN(dateObj.getTime())) dateToSave = dateObj.toISOString();
      }
      if (dateToSave) setValue('appointedDate', dateToSave);
    }
    if (appointmentTime) setValue('appointmentTime', appointmentTime);
  }, [appointmentDate, appointmentTime, setValue]);

  const ReviewField = ({ label, value, span = 6 }) => (
    <Grid.Col span={span}>
      <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} lts={0.3} mb={2}>{label}</Text>
      <Text size="sm" c={CHARCOAL} fw={500}>{value || 'N/A'}</Text>
    </Grid.Col>
  );

  return (
    <Stack gap="md" mt="md">
      {/* Personal Details */}
      <Paper p="lg" radius="lg" style={{ background: '#FAFAFA', border: '1px solid #F0F0F0' }}>
        <Group gap={8} mb="md">
          <Box style={{ width: 28, height: 28, borderRadius: 7, background: PRIMARY_BROWN, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IconUser size={14} color="white" stroke={2.5} />
          </Box>
          <Text size="sm" fw={600} c={CHARCOAL} tt="uppercase" lts={0.5}>Personal Details</Text>
        </Group>
        <Grid gutter="sm">
          <ReviewField label="Name" value={allData.name} />
          <ReviewField label="Age" value={allData.age} />
          <ReviewField label="Birthday" value={allData.birthday} />
          <ReviewField label="Sex" value={allData.sex} />
          <ReviewField label="Civil Status" value={allData.civilStatus} />
          <ReviewField label="Contact Number" value={allData.contactNumber} />
          <ReviewField label="Present Address" value={allData.presentAddress} span={12} />
          <ReviewField label="Permanent Address" value={allData.permanentAddress} span={12} />
        </Grid>
      </Paper>

      {/* Financial Details */}
      <Paper p="lg" radius="lg" style={{ background: '#FAFAFA', border: '1px solid #F0F0F0' }}>
        <Group gap={8} mb="md">
          <Box style={{ width: 28, height: 28, borderRadius: 7, background: '#40C057', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IconCoin size={14} color="white" stroke={2.5} />
          </Box>
          <Text size="sm" fw={600} c={CHARCOAL} tt="uppercase" lts={0.5}>Financial Details</Text>
        </Group>
        <Grid gutter="sm">
          <ReviewField label="Income Source" value={allData.currentSourceOfIncome} />
          <ReviewField label="Monthly Income" value={allData.monthlyIncome ? `₱${Number(allData.monthlyIncome).toLocaleString()}` : null} />
          <ReviewField label="Nature of Work" value={allData.natureOfWork} />
          <ReviewField label="Employer" value={allData.employerName} />
          <ReviewField label="Employer Address" value={allData.employerAddress} span={12} />
        </Grid>
      </Paper>

      {/* Case Details */}
      <Paper p="lg" radius="lg" style={{ background: '#FAFAFA', border: '1px solid #F0F0F0' }}>
        <Group gap={8} mb="md">
          <Box style={{ width: 28, height: 28, borderRadius: 7, background: '#4DABF7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IconBriefcase size={14} color="white" stroke={2.5} />
          </Box>
          <Text size="sm" fw={600} c={CHARCOAL} tt="uppercase" lts={0.5}>Case Details</Text>
        </Group>
        <Grid gutter="sm">
          <ReviewField label="Party Represented" value={allData.partyRepresented} />
          <ReviewField label="Case Number" value={allData.caseNumber} />
          <ReviewField label="Venue" value={allData.venue} />
          <ReviewField label="Present Stage" value={allData.presentStage} />
          <ReviewField label="Nature of Case" value={allData.caseNature} span={12} />
          <ReviewField label="Court Division" value={allData.courtDivision} />
          <ReviewField label="Presiding Officer" value={allData.presidingOfficer} />
          <ReviewField label="Court Address" value={allData.courtAddress} span={12} />
        </Grid>
      </Paper>

      {/* Appointment Date & Time */}
      <Paper p="lg" radius="lg" style={{ background: '#FAFAFA', border: '1px solid #F0F0F0' }}>
        <Group gap={8} mb="md">
          <Box style={{ width: 28, height: 28, borderRadius: 7, background: '#F59F00', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IconCalendar size={14} color="white" stroke={2.5} />
          </Box>
          <Text size="sm" fw={600} c={CHARCOAL} tt="uppercase" lts={0.5}>Preferred Appointment</Text>
        </Group>
        <Text size="xs" c={MUTED_OLIVE} mb="sm">
          Select your preferred date and time. The office will confirm availability and contact you.
        </Text>

        <Grid gutter="sm">
          <Grid.Col span={6}>
            <DateInput
              value={appointmentDate}
              onChange={setAppointmentDate}
              label="Date"
              placeholder="Select a date"
              size="sm"
              leftSection={<IconCalendar size={16} color={ACCENT_TAN} />}
              valueFormat="MMMM DD, YYYY"
              minDate={new Date()}
              clearable
              required
              styles={{
                input: { borderColor: '#E0E0E0' },
                label: { color: CHARCOAL, fontWeight: 600, fontSize: '13px', marginBottom: '4px' },
              }}
            />
          </Grid.Col>
          <Grid.Col span={6}>
            <Select
              value={appointmentTime}
              onChange={setAppointmentTime}
              label="Time"
              placeholder="Select a time"
              size="sm"
              data={timeOptions}
              leftSection={<IconClock size={16} color={ACCENT_TAN} />}
              clearable
              required
              styles={{
                input: { borderColor: '#E0E0E0' },
                label: { color: CHARCOAL, fontWeight: 600, fontSize: '13px', marginBottom: '4px' },
              }}
            />
          </Grid.Col>
        </Grid>

        {appointmentDate && appointmentDate instanceof Date && !isNaN(appointmentDate) && appointmentTime && (
          <Paper mt="sm" p="sm" radius="md" style={{ background: `${PRIMARY_GOLD}12`, border: `1px solid ${PRIMARY_GOLD}40` }}>
            <Group gap={6}>
              <IconCircleCheck size={16} color={ACCENT_TAN} />
              <Text size="sm" c={CHARCOAL} fw={500}>
                {appointmentDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} at {timeOptions.find(t => t.value === appointmentTime)?.label || appointmentTime}
              </Text>
            </Group>
          </Paper>
        )}
      </Paper>

      {/* Data Privacy Notice */}
      <Paper p="md" radius="lg" style={{ background: `${PRIMARY_GOLD}08`, border: `1px solid ${PRIMARY_GOLD}30` }}>
        <Group gap={8} mb={6}>
          <IconInfoCircle size={16} color={ACCENT_TAN} />
          <Text size="sm" fw={600} c={CHARCOAL}>Data Privacy Notice</Text>
        </Group>
        <Text size="xs" c={MUTED_OLIVE} lh={1.5}>
          Sebastinian Office of Legal Aid (SOLA), College of Law is committed to upholding the Philippine Data Privacy Act which implements the Constitutional right to informational privacy of data subjects. Your personal information is collected and processed in order for us to verify your identity, assess your application, and contact you about your case.
        </Text>
      </Paper>
    </Stack>
  );
}