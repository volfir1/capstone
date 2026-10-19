import { useEffect, useState } from 'react';
import {
  ActionIcon, Button, Group, Modal, Paper, Select, SimpleGrid,
  Stack, Text, Textarea, TextInput,
} from '@mantine/core';
import { IconLock, IconPlus, IconTrash } from '@tabler/icons-react';
import { PRIMARY_BROWN, MUTED_OLIVE, THEMED_LIGHT_BG } from '@/utils/constants';
import { getTaskGroup, TASK_GROUPS } from '@/features/tasks/taskUtils';

const emptyTask = () => ({ description: '', caseId: '', assignee: '', dueDate: '', subtasks: [], completed: false });

export default function TaskFormModal({ opened, task, cases, assignees, onClose, onSave }) {
  const [form, setForm] = useState(emptyTask);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!opened) return;
    setForm(task ? { ...task, subtasks: task.subtasks.map((item) => ({ ...item })) } : emptyTask());
    setErrors({});
  }, [opened, task]);

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const updateSubtask = (id, field, value) => setForm((current) => ({
    ...current,
    subtasks: current.subtasks.map((item) => item.id === id ? { ...item, [field]: value } : item),
  }));
  const addSubtask = () => setForm((current) => ({
    ...current,
    subtasks: [...current.subtasks, { id: `sub-${Date.now()}-${current.subtasks.length}`, description: '', assignee: '', dueDate: '', completed: false }],
  }));
  const removeSubtask = (id) => setForm((current) => ({
    ...current,
    subtasks: current.subtasks.filter((item) => item.id !== id),
  }));

  const save = (event) => {
    event.preventDefault();
    const nextErrors = {
      description: form.description.trim() ? null : 'Enter a task description.',
      caseId: form.caseId ? null : 'Choose an associated case.',
      subtasks: form.subtasks.some((item) => !item.description.trim()) ? 'Describe each subtask or remove the empty row.' : null,
    };
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) return;
    onSave({
      ...form,
      description: form.description.trim(),
      subtasks: form.subtasks.map((item) => ({ ...item, description: item.description.trim() })),
    });
  };

  const priority = TASK_GROUPS.find((group) => group.id === getTaskGroup(form))?.label || 'Pending';

  return (
    <Modal opened={opened} onClose={onClose} title={task ? 'Edit Task' : 'Add Task'} size="lg" centered radius="lg" overlayProps={{ backgroundOpacity: 0.55, blur: 3 }}>
      <form onSubmit={save}>
        <Stack gap="md">
          <Text size="xs" c={MUTED_OLIVE}>Prototype task. Changes are available only until this page is refreshed.</Text>
          <Textarea
            label="Task Description" required placeholder="Describe the work to be done" minRows={2} maxRows={5} autosize
            value={form.description} onChange={(event) => update('description', event.currentTarget.value)} error={errors.description}
          />
          <Select
            label="Associated Case" required searchable placeholder="Select an associated case"
            data={cases.map((item) => ({ value: item.id, label: `${item.client} — ${item.title}` }))}
            value={form.caseId} onChange={(value) => update('caseId', value || '')} error={errors.caseId}
          />
          <SimpleGrid cols={{ base: 1, sm: 2 }}>
            <TextInput label={<Group gap={5}>Priority <IconLock size={13} /></Group>} value={priority} readOnly description="Calculated from the due date" />
            <Select label="Assigned To" placeholder="Assign staff (optional)" data={assignees} searchable clearable value={form.assignee || null} onChange={(value) => update('assignee', value || '')} />
          </SimpleGrid>
          <TextInput label="Due Date" type="date" value={form.dueDate} onChange={(event) => update('dueDate', event.currentTarget.value)} />

          {form.subtasks.length > 0 && (
            <Stack gap="sm">
              <Text size="sm" fw={700}>Subtasks</Text>
              {form.subtasks.map((item, index) => (
                <Paper key={item.id} p="sm" radius="md" withBorder style={{ background: THEMED_LIGHT_BG + '30' }}>
                  <Stack gap="xs">
                    <Group justify="space-between">
                      <Text size="xs" fw={700} c={MUTED_OLIVE}>SUBTASK {index + 1}</Text>
                      <ActionIcon variant="subtle" color="red" aria-label={`Remove subtask ${index + 1}`} onClick={() => removeSubtask(item.id)}><IconTrash size={16} /></ActionIcon>
                    </Group>
                    <TextInput placeholder="Subtask description" aria-label={`Subtask ${index + 1} description`} value={item.description} onChange={(event) => updateSubtask(item.id, 'description', event.currentTarget.value)} />
                    <SimpleGrid cols={{ base: 1, sm: 2 }}>
                      <Select placeholder="Assign staff (optional)" aria-label={`Subtask ${index + 1} assignee`} data={assignees} clearable searchable value={item.assignee || null} onChange={(value) => updateSubtask(item.id, 'assignee', value || '')} />
                      <TextInput type="date" aria-label={`Subtask ${index + 1} due date`} value={item.dueDate} onChange={(event) => updateSubtask(item.id, 'dueDate', event.currentTarget.value)} />
                    </SimpleGrid>
                  </Stack>
                </Paper>
              ))}
            </Stack>
          )}
          {errors.subtasks && <Text size="xs" c="red">{errors.subtasks}</Text>}
          <Button variant="light" color={PRIMARY_BROWN} leftSection={<IconPlus size={16} />} onClick={addSubtask} fullWidth>Add Subtask</Button>
          <Group justify="flex-end" mt="xs">
            <Button variant="default" onClick={onClose}>Cancel</Button>
            <Button type="submit" style={{ backgroundColor: PRIMARY_BROWN }}>{task ? 'Save Task' : 'Add Task'}</Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
