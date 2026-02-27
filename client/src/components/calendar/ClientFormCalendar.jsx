import React, { useState } from 'react';
import { 
  Paper, Box, Group, Text, Button, Badge, Stack, UnstyledButton, 
  SimpleGrid, Title, Modal, TextInput, Textarea, Select, Tooltip,
  ActionIcon, Divider, ScrollArea, Center, HoverCard
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { 
  IconChevronLeft, IconChevronRight, IconCalendarEvent, IconClock, 
  IconPlus, IconCheck, IconMapPin, IconGavel, IconMessage2, 
  IconAlertCircle, IconDots, IconCalendar, IconArrowRight, IconUser,
  IconFilter, IconInfoCircle
} from '@tabler/icons-react';
import { useMediaQuery } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import apiClient from '@config/api/apiClient';
import { 
  PRIMARY_GOLD, 
  PRIMARY_BROWN, 
  MUTED_OLIVE, 
  CHARCOAL,
  ACCENT_TAN
} from '@utils/constants';

const EVENT_TYPE_CONFIG = {
  'Initial Interview': { color: '#3B82F6', icon: <IconUser size={12} /> },
  'appointment': { color: '#3B82F6', icon: <IconCalendarEvent size={12} /> },
  'hearing': { color: '#EF4444', icon: <IconGavel size={12} /> },
  'consultation': { color: '#8B5CF6', icon: <IconMessage2 size={12} /> },
  'deadline': { color: '#F59E0B', icon: <IconAlertCircle size={12} /> },
  'other': { color: PRIMARY_BROWN, icon: <IconDots size={12} /> },
};

const getEventConfig = (type) => EVENT_TYPE_CONFIG[type] || EVENT_TYPE_CONFIG['other'];

export default function ClientFormStatusCalendar({ 
  appointments = [], 
  onEventCreated, 
  onDateClick,
  filterValue,
  onFilterChange,
  onAddEvent
}) {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const getAppointmentsForDate = (date) => {
    if (!date) return [];
    return appointments.filter(apt => apt.date && apt.date.toDateString() === date.toDateString());
  };

  const goToPrevious = () => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    setCurrentDate(newDate);
  };

  const goToNext = () => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    if (onDateClick) onDateClick(today);
  };

  const renderMonthView = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const calendarDays = [];
    for (let i = 0; i < startingDayOfWeek; i++) calendarDays.push(null);
    for (let day = 1; day <= daysInMonth; day++) calendarDays.push(new Date(year, month, day));

    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
      <Box style={{ border: '1px solid #E5E7EB', borderRadius: '16px', overflow: 'hidden', backgroundColor: 'white', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
        {/* Weekday Header */}
        <SimpleGrid cols={7} spacing={0} style={{ backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
          {weekdays.map((day) => (
            <Box key={day} py={14} ta="center" style={{ borderRight: day !== 'Sat' ? '1px solid #E5E7EB' : 'none' }}>
              <Text size="xs" fw={600} c={MUTED_OLIVE} tt="uppercase" lts={1.5}>
                {isMobile ? day[0] : day}
              </Text>
            </Box>
          ))}
        </SimpleGrid>

        {/* Days Grid */}
        <SimpleGrid cols={7} spacing={0}>
          {calendarDays.map((date, idx) => {
            const isLastInRow = (idx + 1) % 7 === 0;
            if (!date) return (
              <Box 
                key={`empty-${idx}`} 
                style={{ 
                  height: isMobile ? 70 : 100, 
                  backgroundColor: '#FDFDFD',
                  borderRight: isLastInRow ? 'none' : '1px solid #F3F4F6',
                  borderBottom: '1px solid #F3F4F6'
                }} 
              />
            );

            const dayApts = getAppointmentsForDate(date);
            const isToday = date.toDateString() === new Date().toDateString();
            
            return (
              <HoverCard width={260} shadow="xl" position="right-start" withArrow radius="lg" openDelay={100} key={idx}>
                <HoverCard.Target>
                  <UnstyledButton 
                    onClick={() => onDateClick && onDateClick(date)}
                    style={{
                      height: isMobile ? 70 : 100,
                      borderRight: isLastInRow ? 'none' : '1px solid #F3F4F6',
                      borderBottom: '1px solid #F3F4F6',
                      backgroundColor: isToday ? `${PRIMARY_GOLD}05` : 'white',
                      transition: 'all 0.2s ease',
                      position: 'relative',
                      '&:hover': { backgroundColor: '#F9FAFB', zIndex: 1 }
                    }}
                  >
                    <Stack gap={4} p={8} h="100%" align="stretch" justify="space-between">
                      <Box
                        style={{
                          alignSelf: 'flex-start',
                          width: 28,
                          height: 28,
                          borderRadius: '10px',
                          backgroundColor: isToday ? PRIMARY_BROWN : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: isToday ? '0 4px 10px rgba(107,68,35,0.2)' : 'none'
                        }}
                      >
                        <Text size="sm" fw={600} c={isToday ? 'white' : CHARCOAL}>
                          {date.getDate()}
                        </Text>
                      </Box>

                      <Box>
                        {dayApts.length > 0 && (
                          <Group gap={4} wrap="wrap">
                            {Array.from(new Set(dayApts.map(a => a.type || 'other'))).map(type => {
                              const config = getEventConfig(type);
                              const count = dayApts.filter(a => (a.type || 'other') === type).length;
                              return (
                                <Tooltip key={type} label={`${count} ${type}(s)`} position="top" withArrow>
                                  <Box 
                                    style={{ 
                                      display: 'flex', 
                                      alignItems: 'center', 
                                      gap: 4, 
                                      padding: '2px 6px',
                                      borderRadius: '6px',
                                      backgroundColor: `${config.color}15`,
                                      border: `1px solid ${config.color}30`
                                    }}
                                  >
                                    <Box c={config.color} style={{ display: 'flex' }}>{config.icon}</Box>
                                    {!isMobile && count > 1 && (
                                      <Text size={10} fw={600} c={config.color}>{count}</Text>
                                    )}
                                  </Box>
                                </Tooltip>
                              );
                            })}
                          </Group>
                        )}
                      </Box>
                    </Stack>
                  </UnstyledButton>
                </HoverCard.Target>
                
                {dayApts.length > 0 && (
                  <HoverCard.Dropdown p="xs">
                    <Stack gap="xs">
                      <Group justify="space-between" wrap="nowrap" px={4} pb={4}>
                        <Text fw={700} size="sm" c={CHARCOAL}>
                          {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </Text>
                        <Badge size="xs" color={PRIMARY_BROWN} variant="light" radius="sm">{dayApts.length} Items</Badge>
                      </Group>
                      <Divider />
                      <ScrollArea.Autosize 
                        mah={300}
                        styles={{
                          scrollbar: {
                            '&[data-orientation="vertical"]': { width: 6 },
                          },
                          thumb: { backgroundColor: PRIMARY_BROWN },
                        }}
                      >
                        <Stack gap={2} py={2}>
                          {dayApts.map((apt, i) => {
                            const config = getEventConfig(apt.type || 'other');
                            return (
                              <Paper key={i} p={4} py={3} radius="sm" withBorder style={{ borderLeft: `3px solid ${config.color}` }}>
                                <Group gap="xs" wrap="nowrap" justify="space-between">
                                  <Group gap={6} wrap="nowrap" style={{ flex: 1, overflow: 'hidden' }}>
                                    <Box c={config.color} style={{ display: 'flex', opacity: 0.8 }}>{config.icon}</Box>
                                    <Text size="xs" fw={500} truncate style={{ fontSize: '11px' }}>{apt.clientName || apt.purpose}</Text>
                                  </Group>
                                  <Text size={9} c="dimmed" fw={500} style={{ flexShrink: 0 }}>{apt.appointmentTime || 'TBD'}</Text>
                                </Group>
                              </Paper>
                            );
                          })}
                        </Stack>
                      </ScrollArea.Autosize>
                    </Stack>
                  </HoverCard.Dropdown>
                )}
              </HoverCard>
            );
          })}
        </SimpleGrid>
      </Box>
    );
  };

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="center">
        <Stack gap={0}>
          <Title order={3} fw={700} c={CHARCOAL} lts={-0.5}>
            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </Title>
          <Text size="xs" c={MUTED_OLIVE} fw={500}>System Management Calendar</Text>
        </Stack>
        <Group gap="sm">
          {/* Calendar Type Filter Integrated Here */}
          {!isMobile && (
            <Group gap="xs">
              <Select 
                placeholder="Filter by type" 
                leftSection={<IconFilter size={14} />} 
                data={['All', 'Initial Interview', 'appointment', 'hearing', 'consultation']} 
                value={filterValue} 
                onChange={onFilterChange} 
                size="xs" 
                radius="md"
                w={160}
                styles={{ input: { borderColor: '#E5E7EB', '&:focus': { borderColor: PRIMARY_BROWN } } }}
              />
              <Button 
                variant="light" 
                size="xs" 
                radius="md" 
                color={PRIMARY_BROWN} 
                fw={600}
                leftSection={<IconPlus size={14} />} 
                onClick={onAddEvent}
              >
                Add Event
              </Button>
            </Group>
          )}
          
          <Button 
            variant="outline" 
            color={PRIMARY_BROWN} 
            size="xs" 
            radius="md" 
            fw={600} 
            onClick={goToToday}
            style={{ borderColor: `${PRIMARY_BROWN}40` }}
          >
            Today
          </Button>
          <Group gap={0} bg="#F3F4F6" p={4} style={{ borderRadius: '12px' }}>
            <ActionIcon variant="subtle" color="gray" onClick={goToPrevious} radius="md" size="lg"><IconChevronLeft size={18} /></ActionIcon>
            <ActionIcon variant="subtle" color="gray" onClick={goToNext} radius="md" size="lg"><IconChevronRight size={18} /></ActionIcon>
          </Group>
        </Group>
      </Group>

      {renderMonthView()}

      <Group gap="xl" justify="center" mt="xs">
        {Object.entries(EVENT_TYPE_CONFIG).slice(0, 4).map(([type, config]) => (
          <Group key={type} gap={6}>
            <Box style={{ backgroundColor: `${config.color}20`, padding: 4, borderRadius: 6, display: 'flex' }} c={config.color}>
              {config.icon}
            </Box>
            <Text size="xs" fw={500} c={MUTED_OLIVE} tt="capitalize">{type.replace('-', ' ')}</Text>
          </Group>
        ))}
      </Group>
    </Stack>
  );
}
