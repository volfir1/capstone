import React, { useState } from 'react';
import { Paper, Box, Group, Text, Button, Badge, Stack, UnstyledButton, SimpleGrid, Title, Modal, TextInput, Textarea, Select } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { IconChevronLeft, IconChevronRight, IconCalendarEvent, IconClock, IconPlus, IconCheck, IconMapPin } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import apiClient from '@config/api/apiClient';

const PRIMARY_GOLD = '#D4A574';
const PRIMARY_BROWN = '#6B4423';
const MUTED_OLIVE = '#8B8B5C';
const THEMED_LIGHT_BG = '#F5F3F0';
const CHARCOAL = '#333333';

export default function ClientFormStatusCalendar({ appointments = [], onEventCreated, onDateClick }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month'); // 'day', 'week', 'month'
  const [addEventModal, setAddEventModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    eventDate: null,
    eventType: 'appointment',
    location: '',
    clientName: '',
    assignedTo: '',
    priority: 'Medium',
  });

  // Handle event creation
  const handleCreateEvent = async () => {
    if (!eventForm.title || !eventForm.eventDate) {
      notifications.show({
        title: 'Error',
        message: 'Title and date are required',
        color: 'red',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await apiClient.post('/events', eventForm);
      notifications.show({
        title: 'Success',
        message: 'Event created successfully',
        color: 'green',
        icon: <IconCheck size={18} />,
      });
      setAddEventModal(false);
      setEventForm({
        title: '',
        description: '',
        eventDate: null,
        eventType: 'appointment',
        location: '',
        clientName: '',
        assignedTo: '',
        priority: 'Medium',
      });
      if (onEventCreated) onEventCreated();
    } catch (error) {
      console.error('Error creating event:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to create event',
        color: 'red',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get appointments for a specific date
  const getAppointmentsForDate = (date) => {
    return appointments.filter(apt => {
      return apt.date.toDateString() === date.toDateString();
    });
  };

  // Navigation functions
  const goToPrevious = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'day') {
      newDate.setDate(newDate.getDate() - 1);
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setMonth(newDate.getMonth() - 1);
    }
    setCurrentDate(newDate);
  };

  const goToNext = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'day') {
      newDate.setDate(newDate.getDate() + 1);
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Get calendar title
  const getCalendarTitle = () => {
    const options = { month: 'long', year: 'numeric' };
    if (viewMode === 'day') {
      return currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    } else if (viewMode === 'week') {
      const weekStart = getWeekStart(currentDate);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      return `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    }
    return currentDate.toLocaleDateString('en-US', options);
  };

  // Helper to get week start (Sunday)
  const getWeekStart = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff));
  };

  // Check if date is today
  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  // Check if date is in current month
  const isCurrentMonth = (date) => {
    return date.getMonth() === currentDate.getMonth();
  };

  // Render Day View
  const renderDayView = () => {
    const dayAppointments = getAppointmentsForDate(currentDate);
    
    return (
      <Box>
        <Paper p="md" radius="md" style={{ backgroundColor: 'white', border: '1px solid #F0F0F0' }}>
          {dayAppointments.length === 0 ? (
            <Box py="xl" style={{ textAlign: 'center' }}>
              <Text c={MUTED_OLIVE} size="sm">No appointments for this day</Text>
            </Box>
          ) : (
            <Stack gap="sm">
              {dayAppointments.map((apt, idx) => (
                <Paper
                  key={apt.id || idx}
                  p="md"
                  radius="md"
                  style={{
                    backgroundColor: THEMED_LIGHT_BG,
                    border: `2px solid ${PRIMARY_GOLD}`,
                  }}
                >
                  <Group justify="space-between" mb="xs">
                    <Text fw={600} size="sm" c={CHARCOAL}>{apt.purpose || apt.clientName}</Text>
                    <Badge size="sm" style={{ backgroundColor: PRIMARY_BROWN }}>
                      {apt.type}
                    </Badge>
                  </Group>
                  <Group gap="xs">
                    <IconClock size={14} color={MUTED_OLIVE} />
                    <Text size="xs" c={MUTED_OLIVE}>{apt.location}</Text>
                  </Group>
                </Paper>
              ))}
            </Stack>
          )}
        </Paper>
      </Box>
    );
  };

  // Render Week View
  const renderWeekView = () => {
    const weekStart = getWeekStart(currentDate);
    const weekDays = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(weekStart);
      date.setDate(date.getDate() + i);
      return date;
    });

    return (
      <SimpleGrid cols={7} spacing="xs">
        {weekDays.map((date, idx) => {
          const dayAppointments = getAppointmentsForDate(date);
          const isTodayDate = isToday(date);

          return (
            <UnstyledButton
              key={idx}
              onClick={() => onDateClick && onDateClick(date)}
              style={{ width: '100%' }}
            >
              <Paper
                p="sm"
                radius="md"
                style={{
                  backgroundColor: isTodayDate ? `${PRIMARY_GOLD}20` : 'white',
                  border: isTodayDate ? `2px solid ${PRIMARY_GOLD}` : '1px solid #F0F0F0',
                  height: '120px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                sx={{
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                  },
                }}
              >
              <Stack gap="xs" style={{ height: '100%' }}>
                <Box>
                  <Text size="xs" c={MUTED_OLIVE} fw={500}>
                    {date.toLocaleDateString('en-US', { weekday: 'short' })}
                  </Text>
                  <Text
                    size="lg"
                    fw={700}
                    c={isTodayDate ? PRIMARY_BROWN : CHARCOAL}
                  >
                    {date.getDate()}
                  </Text>
                </Box>
                {dayAppointments.length > 0 && (
                  <Box style={{ flex: 1 }}>
                    <Badge
                      size="xs"
                      style={{
                        backgroundColor: PRIMARY_BROWN,
                        marginBottom: '4px',
                      }}
                    >
                      {dayAppointments.length} apt{dayAppointments.length > 1 ? 's' : ''}
                    </Badge>
                    {dayAppointments.slice(0, 2).map((apt, i) => (
                      <Text
                        key={i}
                        size="xs"
                        c={CHARCOAL}
                        truncate
                        style={{ marginTop: '2px' }}
                      >
                        {apt.purpose || apt.clientName}
                      </Text>
                    ))}
                  </Box>
                )}
              </Stack>
            </Paper>
            </UnstyledButton>
          );
        })}
      </SimpleGrid>
    );
  };

  // Render Month View
  const renderMonthView = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const calendarDays = [];
    
    for (let i = 0; i < startingDayOfWeek; i++) {
      calendarDays.push(null);
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      calendarDays.push(new Date(year, month, day));
    }

    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
      <Box>
        <SimpleGrid cols={7} spacing="xs" mb="xs">
          {weekdays.map((day) => (
            <Box key={day} style={{ textAlign: 'center', padding: '8px' }}>
              <Text size="xs" fw={600} c={MUTED_OLIVE} tt="uppercase">
                {day}
              </Text>
            </Box>
          ))}
        </SimpleGrid>

        <SimpleGrid cols={7} spacing="xs">
          {calendarDays.map((date, idx) => {
            if (!date) {
              return <Box key={`empty-${idx}`} style={{ height: '80px' }} />;
            }

            const dayAppointments = getAppointmentsForDate(date);
            const isTodayDate = isToday(date);
            const inCurrentMonth = isCurrentMonth(date);

            return (
              <UnstyledButton
                key={idx}
                onClick={() => onDateClick && onDateClick(date)}
                style={{ width: '100%' }}
              >
                <Paper
                  p="xs"
                  radius="md"
                  style={{
                    backgroundColor: isTodayDate ? `${PRIMARY_GOLD}20` : 'white',
                    border: isTodayDate ? `2px solid ${PRIMARY_GOLD}` : '1px solid #F0F0F0',
                    height: '80px',
                    opacity: inCurrentMonth ? 1 : 0.4,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  sx={{
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                    },
                  }}
                >
                <Stack gap={4} style={{ height: '100%' }}>
                  <Text
                    size="sm"
                    fw={isTodayDate ? 700 : 500}
                    c={isTodayDate ? PRIMARY_BROWN : CHARCOAL}
                  >
                    {date.getDate()}
                  </Text>
                  {dayAppointments.length > 0 && (
                    <Box>
                      {dayAppointments.slice(0, 2).map((apt, i) => (
                        <Box
                          key={i}
                          style={{
                            backgroundColor: PRIMARY_BROWN,
                            borderRadius: '4px',
                            padding: '2px 4px',
                            marginBottom: '2px',
                          }}
                        >
                          <Text size="xs" c="white" truncate>
                            {apt.purpose || apt.clientName}
                          </Text>
                        </Box>
                      ))}
                      {dayAppointments.length > 2 && (
                        <Text size="xs" c={MUTED_OLIVE}>
                          +{dayAppointments.length - 2} more
                        </Text>
                      )}
                    </Box>
                  )}
                </Stack>
              </Paper>
              </UnstyledButton>
            );
          })}
        </SimpleGrid>
      </Box>
    );
  };

  return (
    <Box>
     

        {/* Calendar */}
        <Paper shadow="xs" p="lg" radius="lg" bg="white" style={{ border: '1px solid #F0F0F0' }}>
          {/* Calendar Header */}
          <Group justify="space-between" mb="lg">
            <Group gap="md">
              <Group gap="xs">
                <UnstyledButton onClick={goToPrevious}>
                  <Box
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '8px',
                      backgroundColor: THEMED_LIGHT_BG,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                    }}
                  >
                    <IconChevronLeft size={18} color={PRIMARY_BROWN} />
                  </Box>
                </UnstyledButton>
                <UnstyledButton onClick={goToNext}>
                  <Box
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '8px',
                      backgroundColor: THEMED_LIGHT_BG,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                    }}
                  >
                    <IconChevronRight size={18} color={PRIMARY_BROWN} />
                  </Box>
                </UnstyledButton>
              </Group>

              <Box>
                <Group gap="xs" mb={4}>
                  <IconCalendarEvent size={18} color={PRIMARY_BROWN} />
                  <Text size="lg" fw={700} c={CHARCOAL}>
                    {getCalendarTitle()}
                  </Text>
                </Group>
                <Text size="xs" c={MUTED_OLIVE}>
                  {appointments.length} total appointment{appointments.length !== 1 ? 's' : ''}
                </Text>
              </Box>
            </Group>

            <Group gap="xs">
              <Button
                size="sm"
                leftSection={<IconPlus size={16} />}
                onClick={() => setAddEventModal(true)}
                style={{ backgroundColor: PRIMARY_GOLD, color: 'white' }}
              >
                Add Event
              </Button>
              
              <Button
                size="sm"
                variant="subtle"
                onClick={goToToday}
                style={{ color: PRIMARY_BROWN }}
              >
                Today
              </Button>
              
              <Group gap={4}>
                <Button
                  size="sm"
                  variant={viewMode === 'day' ? 'filled' : 'subtle'}
                  onClick={() => setViewMode('day')}
                  style={{
                    backgroundColor: viewMode === 'day' ? PRIMARY_BROWN : 'transparent',
                    color: viewMode === 'day' ? 'white' : PRIMARY_BROWN,
                  }}
                >
                  Day
                </Button>
                <Button
                  size="sm"
                  variant={viewMode === 'week' ? 'filled' : 'subtle'}
                  onClick={() => setViewMode('week')}
                  style={{
                    backgroundColor: viewMode === 'week' ? PRIMARY_BROWN : 'transparent',
                    color: viewMode === 'week' ? 'white' : PRIMARY_BROWN,
                  }}
                >
                  Week
                </Button>
                <Button
                  size="sm"
                  variant={viewMode === 'month' ? 'filled' : 'subtle'}
                  onClick={() => setViewMode('month')}
                  style={{
                    backgroundColor: viewMode === 'month' ? PRIMARY_BROWN : 'transparent',
                    color: viewMode === 'month' ? 'white' : PRIMARY_BROWN,
                  }}
                >
                  Month
                </Button>
              </Group>
            </Group>
          </Group>

          {/* Calendar Body */}
          <Box>
            {viewMode === 'day' && renderDayView()}
            {viewMode === 'week' && renderWeekView()}
            {viewMode === 'month' && renderMonthView()}
          </Box>
        </Paper>

        {/* Add Event Modal */}
        <Modal
          opened={addEventModal}
          onClose={() => setAddEventModal(false)}
          title={<Title order={3} c={CHARCOAL}>Add New Event</Title>}
          size="lg"
          styles={{
            header: { borderBottom: '1px solid #F0F0F0', paddingBottom: '16px' },
            body: { padding: '24px' },
          }}
        >
          <Stack gap="md">
            <TextInput
              label="Event Title"
              placeholder="Enter event title"
              required
              value={eventForm.title}
              onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
              styles={{
                label: { color: CHARCOAL, fontWeight: 600, marginBottom: '8px' },
              }}
            />

            <Textarea
              label="Description"
              placeholder="Enter event description"
              minRows={3}
              value={eventForm.description}
              onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
              styles={{
                label: { color: CHARCOAL, fontWeight: 600, marginBottom: '8px' },
              }}
            />

            <DatePickerInput
              label="Event Date"
              placeholder="Select event date"
              required
              value={eventForm.eventDate}
              onChange={(date) => setEventForm({ ...eventForm, eventDate: date })}
              minDate={new Date()}
              styles={{
                label: { color: CHARCOAL, fontWeight: 600, marginBottom: '8px' },
              }}
            />

            <Select
              label="Event Type"
              placeholder="Select event type"
              data={[
                { value: 'appointment', label: 'Appointment' },
                { value: 'hearing', label: 'Court Hearing' },
                { value: 'consultation', label: 'Consultation' },
                { value: 'deadline', label: 'Deadline' },
                { value: 'other', label: 'Other' },
              ]}
              value={eventForm.eventType}
              onChange={(value) => setEventForm({ ...eventForm, eventType: value })}
              styles={{
                label: { color: CHARCOAL, fontWeight: 600, marginBottom: '8px' },
              }}
            />

            <TextInput
              label="Location"
              placeholder="Enter location"
              leftSection={<IconMapPin size={16} />}
              value={eventForm.location}
              onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
              styles={{
                label: { color: CHARCOAL, fontWeight: 600, marginBottom: '8px' },
              }}
            />

            <TextInput
              label="Client Name"
              placeholder="Enter client name (optional)"
              value={eventForm.clientName}
              onChange={(e) => setEventForm({ ...eventForm, clientName: e.target.value })}
              styles={{
                label: { color: CHARCOAL, fontWeight: 600, marginBottom: '8px' },
              }}
            />

            <TextInput
              label="Assigned To"
              placeholder="Enter assigned attorney"
              value={eventForm.assignedTo}
              onChange={(e) => setEventForm({ ...eventForm, assignedTo: e.target.value })}
              styles={{
                label: { color: CHARCOAL, fontWeight: 600, marginBottom: '8px' },
              }}
            />

            <Select
              label="Priority"
              placeholder="Select priority"
              data={[
                { value: 'Low', label: 'Low' },
                { value: 'Medium', label: 'Medium' },
                { value: 'High', label: 'High' },
              ]}
              value={eventForm.priority}
              onChange={(value) => setEventForm({ ...eventForm, priority: value })}
              styles={{
                label: { color: CHARCOAL, fontWeight: 600, marginBottom: '8px' },
              }}
            />

            <Group justify="flex-end" gap="md" mt="md">
              <Button
                variant="outline"
                size="md"
                onClick={() => setAddEventModal(false)}
                styles={{
                  root: { borderColor: '#E0E0E0', color: MUTED_OLIVE },
                }}
              >
                Cancel
              </Button>
              <Button
                size="md"
                onClick={handleCreateEvent}
                disabled={!eventForm.title || !eventForm.eventDate || isSubmitting}
                loading={isSubmitting}
                leftSection={<IconCheck size={18} />}
                style={{ backgroundColor: PRIMARY_BROWN }}
              >
                {isSubmitting ? 'Creating...' : 'Create Event'}
              </Button>
            </Group>
          </Stack>
        </Modal>
    </Box>
  );
}

/**
 * Generate a Google Calendar event URL with pre-filled details
 * @param {Object} event - Event details
 * @returns {string} Google Calendar URL
 */
export const generateGoogleCalendarUrl = (event) => {
  const baseUrl = 'https://calendar.google.com/calendar/render';
  
  // Format date and time for Google Calendar
  const formatDateTime = (date, time) => {
    const eventDate = new Date(date);
    if (time) {
      const [hours, minutes] = time.split(':');
      eventDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    }
    return eventDate.toISOString().replace(/-|:|\.\d+/g, '');
  };

  const startDateTime = formatDateTime(event.appointmentDate || event.eventDate, event.appointmentTime || event.time);
  
  // End time is 1 hour after start by default
  const endDate = new Date(event.appointmentDate || event.eventDate);
  if (event.appointmentTime || event.time) {
    const [hours, minutes] = (event.appointmentTime || event.time).split(':');
    endDate.setHours(parseInt(hours) + 1, parseInt(minutes), 0, 0);
  } else {
    endDate.setHours(endDate.getHours() + 1);
  }
  const endDateTime = endDate.toISOString().replace(/-|:|\.\d+/g, '');

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title || event.purpose || event.clientName || 'Appointment',
    dates: `${startDateTime}/${endDateTime}`,
    details: event.description || event.purpose || '',
    location: event.location || '',
    trp: 'false' // Don't show guests
  });

  return `${baseUrl}?${params.toString()}`;
};