import { useEffect, useState } from 'react';
import {
  ActionIcon, Box, Button, FileInput, Group, Modal, Paper, Select, SimpleGrid,
  Stack, Text, Textarea, TextInput,
} from '@mantine/core';
import { IconLock, IconPaperclip, IconPlus, IconTrash } from '@tabler/icons-react';
import { getTaskGroup, TASK_GROUPS } from '@/features/tasks/taskUtils';
import { CHARCOAL, MUTED_OLIVE, PRIMARY_BROWN, THEMED_LIGHT_BG } from '@/utils/constants';

const localDate = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

const blankFollowUp = (caseId = '') => ({ description: '', caseId, assignee: '', dueDate: '', subtasks: [] });

export default function TaskCompletionModal({ opened, target, cases, assignees, onClose, onComplete }) {
  const [override, setOverride] = useState('');
  const [completedAt, setCompletedAt] = useState(localDate);
  const [file, setFile] = useState(null);
  const [followUp, setFollowUp] = useState(blankFollowUp);
  const [errors, setErrors] = useState({});
  const isSubtask = target?.kind === 'subtask';
  const original = isSubtask ? target?.subtask?.description : target?.task?.description;
  const caseInfo = cases.find((item) => item.id === target?.task?.caseId);

  useEffect(() => {
    if (!opened) return;
    setOverride('');
    setCompletedAt(localDate());
    setFile(null);
    setFollowUp(blankFollowUp(target?.task?.caseId));
    setErrors({});
  }, [opened, target?.kind, target?.task?.id, target?.subtask?.id, target?.task?.caseId]);

  const updateFollowUp = (field, value) => setFollowUp((current) => ({ ...current, [field]: value }));
  const addSubtask = () => setFollowUp((current) => ({
    ...current,
    subtasks: [...current.subtasks, { id: `local-sub-${Date.now()}-${current.subtasks.length}`, description: '', assignee: '', dueDate: '', completed: false }],
  }));
  const updateSubtask = (id, field, value) => setFollowUp((current) => ({
    ...current,
    subtasks: current.subtasks.map((item) => item.id === id ? { ...item, [field]: value } : item),
  }));
  const removeSubtask = (id) => setFollowUp((current) => ({
    ...current,
    subtasks: current.subtasks.filter((item) => item.id !== id),
  }));

  const complete = (addFollowUp) => {
    const nextErrors = {
      completedAt: completedAt ? null : 'Choose a completion date.',
      description: addFollowUp && !followUp.description.trim() ? 'Describe the follow-up work.' : null,
      caseId: addFollowUp && !followUp.caseId ? 'Choose an associated case.' : null,
      subtasks: addFollowUp && followUp.subtasks.some((item) => !item.description.trim()) ? 'Describe each subtask or remove the empty row.' : null,
    };
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) return;

    onComplete({
      completion: {
        description: override.trim() || original,
        descriptionOverride: override.trim(),
        completedAt,
        attachmentName: file?.name || '',
      },
      followUp: addFollowUp ? {
        ...followUp,
        description: followUp.description.trim(),
        subtasks: followUp.subtasks.map((item) => ({ ...item, description: item.description.trim() })),
      } : null,
    });
  };

  const priority = TASK_GROUPS.find((group) => group.id === getTaskGroup({ dueDate: followUp.dueDate, completed: false }))?.label || 'Pending';
  const followUpReady = followUp.description.trim() && followUp.caseId && !followUp.subtasks.some((item) => !item.description.trim());
  const kindLabel = isSubtask ? 'Subtask' : 'Task';

  return (
    <Modal
      opened={opened} onClose={onClose} size="1100px" centered radius="lg"
      title={`Complete ${kindLabel} & Add Follow-up ${kindLabel}`}
      overlayProps={{ backgroundOpacity: 0.55, blur: 3 }}
    >
      <Stack gap="md">
        <Text size="xs" c={MUTED_OLIVE}>Prototype only: completion and follow-up changes reset on refresh. Selected files are shown by name and are not uploaded.</Text>
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
          <Paper p={{ base: 'md', sm: 'lg' }} radius="md" withBorder style={{ background: THEMED_LIGHT_BG + '45' }}>
            <Stack gap="md">
              <Box>
                <Text fw={700} c={CHARCOAL}>Complete current {kindLabel.toLowerCase()}</Text>
                <Text size="sm" c={MUTED_OLIVE}>This moves the {kindLabel.toLowerCase()} to Completed in this prototype.</Text>
              </Box>
              <Box>
                <Text size="xs" c={MUTED_OLIVE} mb={5}>Original Description</Text>
                <Text size="sm" fw={600} c={CHARCOAL} fs="italic" style={{ whiteSpace: 'pre-wrap' }}>{original}</Text>
              </Box>
              <TextInput
                label="Description Override (Optional)" placeholder="Leave blank to use the original description"
                value={override} onChange={(event) => setOverride(event.currentTarget.value)}
              />
              <TextInput
                label="Completion Date" type="date" required value={completedAt}
                onChange={(event) => setCompletedAt(event.currentTarget.value)} error={errors.completedAt}
              />
              <FileInput
                label="Attach File / Document (Optional)" placeholder="Choose a file"
                leftSection={<IconPaperclip size={16} />} clearable value={file} onChange={setFile}
                accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
              />
              {file && <Text size="xs" c={MUTED_OLIVE}>Selected: {file.name} · file contents are not saved in this prototype.</Text>}
            </Stack>
          </Paper>

          <Paper p={{ base: 'md', sm: 'lg' }} radius="md" withBorder style={{ background: '#FAFAF8' }}>
            <Stack gap="md">
              <Text fw={700} c={CHARCOAL}>Add Follow-up {kindLabel}</Text>
              <Textarea
                label={`${kindLabel} Description`} required placeholder="Describe the follow-up work" minRows={2} maxRows={5} autosize
                value={followUp.description} onChange={(event) => updateFollowUp('description', event.currentTarget.value)} error={errors.description}
              />
              {isSubtask ? (
                <TextInput label="Associated Case" value={caseInfo ? `${caseInfo.client} — ${caseInfo.title}` : ''} readOnly description="Inherited from the parent task" />
              ) : (
                <Select
                  label="Associated Case" required searchable data={cases.map((item) => ({ value: item.id, label: `${item.client} — ${item.title}` }))}
                  value={followUp.caseId} onChange={(value) => updateFollowUp('caseId', value || '')} error={errors.caseId}
                />
              )}
              <SimpleGrid cols={{ base: 1, sm: 2 }}>
                <TextInput label={<Group gap={5}>Priority <IconLock size={13} /></Group>} value={priority} readOnly description="Calculated from the due date" />
                <Select label="Assigned To" placeholder="Assign staff (optional)" data={assignees} searchable clearable value={followUp.assignee || null} onChange={(value) => updateFollowUp('assignee', value || '')} />
              </SimpleGrid>
              <TextInput label="Due Date" type="date" value={followUp.dueDate} onChange={(event) => updateFollowUp('dueDate', event.currentTarget.value)} />

              {!isSubtask && (
                <>
                  {followUp.subtasks.map((item, index) => (
                    <Paper key={item.id} p="sm" radius="md" withBorder>
                      <Stack gap="xs">
                        <Group justify="space-between">
                          <Text size="xs" fw={700} c={MUTED_OLIVE}>SUBTASK {index + 1}</Text>
                          <ActionIcon variant="subtle" color="red" aria-label={`Remove follow-up subtask ${index + 1}`} onClick={() => removeSubtask(item.id)}><IconTrash size={16} /></ActionIcon>
                        </Group>
                        <TextInput aria-label={`Follow-up subtask ${index + 1} description`} placeholder="Subtask description" value={item.description} onChange={(event) => updateSubtask(item.id, 'description', event.currentTarget.value)} />
                        <SimpleGrid cols={{ base: 1, sm: 2 }}>
                          <Select aria-label={`Follow-up subtask ${index + 1} assignee`} placeholder="Assign staff (optional)" data={assignees} searchable clearable value={item.assignee || null} onChange={(value) => updateSubtask(item.id, 'assignee', value || '')} />
                          <TextInput aria-label={`Follow-up subtask ${index + 1} due date`} type="date" value={item.dueDate} onChange={(event) => updateSubtask(item.id, 'dueDate', event.currentTarget.value)} />
                        </SimpleGrid>
                      </Stack>
                    </Paper>
                  ))}
                  {errors.subtasks && <Text size="xs" c="red">{errors.subtasks}</Text>}
                  <Button variant="light" color={PRIMARY_BROWN} leftSection={<IconPlus size={16} />} onClick={addSubtask} fullWidth>Add Subtask</Button>
                </>
              )}
              <Group justify="flex-end" mt="auto" gap="xs">
                <Button variant="default" onClick={onClose}>Cancel</Button>
                <Button color="green" onClick={() => complete(false)}>Complete Only</Button>
                <Button style={{ backgroundColor: PRIMARY_BROWN }} disabled={!followUpReady} onClick={() => complete(true)}>Complete and Add</Button>
              </Group>
            </Stack>
          </Paper>
        </SimpleGrid>
      </Stack>
    </Modal>
  );
}
