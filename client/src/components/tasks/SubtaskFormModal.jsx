import { useEffect, useState } from 'react';
import { Button, Group, Modal, Select, Stack, Text, Textarea, TextInput } from '@mantine/core';
import { IconLock } from '@tabler/icons-react';
import { getTaskGroup, TASK_GROUPS } from '@/features/tasks/taskUtils';
import { MUTED_OLIVE, PRIMARY_BROWN } from '@/utils/constants';

export default function SubtaskFormModal({ opened, task, subtask, caseInfo, assignees, onClose, onSave }) {
  const [description, setDescription] = useState('');
  const [assignee, setAssignee] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!opened || !subtask) return;
    setDescription(subtask.description);
    setAssignee(subtask.assignee || '');
    setDueDate(subtask.dueDate || '');
    setError('');
  }, [opened, subtask?.id, subtask?.description, subtask?.assignee, subtask?.dueDate]);

  const save = (event) => {
    event.preventDefault();
    if (!description.trim()) { setError('Enter a subtask description.'); return; }
    onSave({ description: description.trim(), assignee, dueDate });
  };

  const priority = TASK_GROUPS.find((group) => group.id === getTaskGroup({ dueDate, completed: subtask?.completed }))?.label || 'Pending';

  return (
    <Modal opened={opened} onClose={onClose} title="Edit Subtask" size="lg" centered radius="lg" overlayProps={{ backgroundOpacity: 0.55, blur: 3 }}>
      <form onSubmit={save}>
        <Stack gap="md">
          <Text size="xs" c={MUTED_OLIVE}>Prototype subtask. Changes reset when this page is refreshed.</Text>
          <Textarea label="Subtask Description" required minRows={2} autosize value={description} onChange={(event) => setDescription(event.currentTarget.value)} error={error} />
          <TextInput label="Parent Task" value={task?.description || ''} readOnly />
          <TextInput label="Associated Case" value={caseInfo ? `${caseInfo.client} — ${caseInfo.title}` : ''} readOnly />
          <TextInput label={<Group gap={5}>Priority <IconLock size={13} /></Group>} value={priority} readOnly description="Calculated from the due date" />
          <Select label="Assigned To" placeholder="Assign staff (optional)" data={assignees} searchable clearable value={assignee || null} onChange={(value) => setAssignee(value || '')} />
          <TextInput label="Due Date" type="date" value={dueDate} onChange={(event) => setDueDate(event.currentTarget.value)} />
          <Group justify="flex-end">
            <Button variant="default" onClick={onClose}>Cancel</Button>
            <Button type="submit" style={{ backgroundColor: PRIMARY_BROWN }}>Save Subtask</Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
