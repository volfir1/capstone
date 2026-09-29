import { useState } from 'react';
import { Button, Popover, Select, Stack, Text, UnstyledButton } from '@mantine/core';
import { DatePicker } from '@mantine/dates';
import { IconCalendar, IconTrash } from '@tabler/icons-react';
import { formatTaskDate } from '@/features/tasks/taskUtils';
import { CHARCOAL, MUTED_OLIVE, PRIMARY_BROWN } from '@/utils/constants';
import './taskRows.css';

export function PrototypeLink({ children, onClick, title, size = 'sm', fw = 600, color = PRIMARY_BROWN }) {
  return (
    <UnstyledButton
      className="task-prototype-link" onClick={onClick || (() => {})}
      title={title || (!onClick ? 'This link is a prototype preview' : undefined)}
    >
      <Text component="span" size={size} fw={fw} c={color} style={{ overflowWrap: 'anywhere' }}>{children}</Text>
    </UnstyledButton>
  );
}

export function TaskAssigneeSelect({ value, assignees, onChange, label, compact = false }) {
  return (
    <Select
      aria-label={label} title={label} size="xs" radius="sm" searchable clearable
      placeholder="Unassigned" data={assignees} value={value || null}
      onChange={(next) => onChange(next || '')}
      comboboxProps={{ withinPortal: true, zIndex: 400 }}
      className="task-assignee-select"
      style={{ width: compact ? 152 : 175, maxWidth: '100%' }}
    />
  );
}

export function TaskDeadlinePicker({ value, onChange, label, compact = false, overdue = false }) {
  const [opened, setOpened] = useState(false);

  return (
    <Popover
      opened={opened} onChange={setOpened} position="bottom" withArrow shadow="md"
      withinPortal zIndex={450} middlewares={{ flip: true, shift: { crossAxis: true, padding: 8 } }}
    >
      <Popover.Target>
        <UnstyledButton
          className="task-deadline-button" aria-label={label} title={label}
          onClick={() => setOpened((current) => !current)}
          style={{ color: overdue ? '#C63D52' : value ? CHARCOAL : MUTED_OLIVE, fontSize: compact ? 11 : 13 }}
        >
          <IconCalendar size={compact ? 13 : 15} aria-hidden="true" />
          <span>{formatTaskDate(value)}</span>
        </UnstyledButton>
      </Popover.Target>
      <Popover.Dropdown className="task-deadline-popover" style={{ width: 318 }} p="sm">
        <Stack gap="xs" h="100%">
          <Text size="xs" fw={700} c={MUTED_OLIVE}>Set deadline</Text>
          <DatePicker
            value={value || null} onChange={(next) => { onChange(next || ''); setOpened(false); }}
            firstDayOfWeek={1} size="sm" color={PRIMARY_BROWN}
            style={{ width: '100%' }}
          />
          <Button
            mt="auto" variant="subtle" color="gray" size="xs" leftSection={<IconTrash size={14} />}
            onClick={() => { onChange(''); setOpened(false); }}
          >
            Remove Deadline
          </Button>
        </Stack>
      </Popover.Dropdown>
    </Popover>
  );
}
