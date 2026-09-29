import {
  ActionIcon, Badge, Box, Group, Paper, Stack, Table, Text, Tooltip,
} from '@mantine/core';
import { IconCheck, IconClipboardList, IconEdit, IconRotateClockwise, IconTrash } from '@tabler/icons-react';
import { CHARCOAL, MUTED_OLIVE, PRIMARY_BROWN, THEMED_LIGHT_BG } from '@/utils/constants';
import { getCase, getTaskGroup, TASK_GROUPS } from '@/features/tasks/taskUtils';
import { PrototypeLink, TaskAssigneeSelect, TaskDeadlinePicker } from './TaskRowControls';

function StatusBadge({ item }) {
  const group = TASK_GROUPS.find((entry) => entry.id === getTaskGroup(item));
  return (
    <Badge size="sm" radius="sm" variant="light" style={{ background: `${group.color}18`, color: group.color, flexShrink: 0 }}>
      {group.label}
    </Badge>
  );
}

function RowActions({ kind, completed, onComplete, onReopen, onEdit, onDelete }) {
  return (
    <Group gap={3} wrap="nowrap" justify="flex-end" style={{ flexShrink: 0 }}>
      <Tooltip label={completed ? `Reopen ${kind}` : `Complete ${kind}`}>
        <ActionIcon size="sm" variant="subtle" color={completed ? 'gray' : 'green'} aria-label={completed ? `Reopen ${kind}` : `Complete ${kind}`} onClick={completed ? onReopen : onComplete}>
          {completed ? <IconRotateClockwise size={18} /> : <IconCheck size={18} />}
        </ActionIcon>
      </Tooltip>
      <Tooltip label={`Edit ${kind}`}>
        <ActionIcon size="sm" variant="subtle" color="gray" aria-label={`Edit ${kind}`} onClick={onEdit}><IconEdit size={18} /></ActionIcon>
      </Tooltip>
      <Tooltip label={`Delete ${kind}`}>
        <ActionIcon size="sm" variant="subtle" color="red" aria-label={`Delete ${kind}`} onClick={onDelete}><IconTrash size={18} /></ActionIcon>
      </Tooltip>
    </Group>
  );
}

function TaskActions({ task, actions }) {
  return (
    <RowActions
      kind="task" completed={task.completed}
      onComplete={() => actions.onCompleteTask(task)} onReopen={() => actions.onReopenTask(task.id)}
      onEdit={() => actions.onEditTask(task)} onDelete={() => actions.onDeleteTask(task)}
    />
  );
}

function ClientCase({ caseInfo }) {
  return (
    <Stack gap={1}>
      <PrototypeLink color={CHARCOAL} fw={700} title="Client page is not connected in this prototype">
        {caseInfo?.client || 'Sample client'}
      </PrototypeLink>
      <PrototypeLink size="xs" fw={600} title="Case details are not connected in this prototype">
        {caseInfo?.title || 'Sample case'}
      </PrototypeLink>
      <Text size="xs" c={MUTED_OLIVE}>{caseInfo?.caseNumber} · {caseInfo?.lawyer}</Text>
    </Stack>
  );
}

function TaskDescription({ task, actions }) {
  const completedSubtasks = task.subtasks.filter((item) => item.completed).length;
  return (
    <Stack gap={8}>
      <PrototypeLink onClick={() => actions.onOpen(task)} title="View task details" fw={700} color={task.completed ? MUTED_OLIVE : PRIMARY_BROWN}>
        <Text component="span" td={task.completed ? 'line-through' : undefined}>{task.description}</Text>
      </PrototypeLink>
      <Group gap="xs" wrap="wrap" align="center">
        <TaskAssigneeSelect
          value={task.assignee} assignees={actions.assignees} label={`Assign task: ${task.description}`}
          onChange={(next) => actions.onAssignTask(task.id, next)}
        />
        <TaskDeadlinePicker compact value={task.dueDate} label={`Change inline deadline for task: ${task.description}`} onChange={(next) => actions.onDateTask(task.id, next)} overdue={getTaskGroup(task) === 'overdue'} />
      </Group>
      {task.subtasks.length > 0 && (
        <Box>
          <Text size="10px" fw={700} c={MUTED_OLIVE} tt="uppercase" mb={5}>Subtasks · {completedSubtasks}/{task.subtasks.length} complete</Text>
          <Stack gap={5}>
            {task.subtasks.map((item) => (
              <Paper key={item.id} p="xs" radius="sm" withBorder style={{ background: THEMED_LIGHT_BG + '45' }}>
                <Stack gap={5}>
                  <Group gap="xs" wrap="nowrap" align="flex-start" justify="space-between">
                    <Box style={{ minWidth: 0, flex: 1 }}>
                      <PrototypeLink onClick={() => actions.onEditSubtask(task, item)} title="Edit subtask" size="xs" fw={600} color={item.completed ? MUTED_OLIVE : PRIMARY_BROWN}>
                        <Text component="span" td={item.completed ? 'line-through' : undefined}>{item.description}</Text>
                      </PrototypeLink>
                    </Box>
                    <RowActions
                      kind="subtask" completed={item.completed}
                      onComplete={() => actions.onCompleteSubtask(task, item)} onReopen={() => actions.onReopenSubtask(task.id, item.id)}
                      onEdit={() => actions.onEditSubtask(task, item)} onDelete={() => actions.onDeleteSubtask(task, item)}
                    />
                  </Group>
                  <Group gap="xs" wrap="wrap" align="center">
                    <TaskAssigneeSelect compact value={item.assignee} assignees={actions.assignees} label={`Assign subtask: ${item.description}`} onChange={(next) => actions.onAssignSubtask(task.id, item.id, next)} />
                    <TaskDeadlinePicker compact value={item.dueDate} label={`Change deadline for subtask: ${item.description}`} onChange={(next) => actions.onDateSubtask(task.id, item.id, next)} overdue={getTaskGroup(item) === 'overdue'} />
                    <StatusBadge item={item} />
                  </Group>
                </Stack>
              </Paper>
            ))}
          </Stack>
        </Box>
      )}
    </Stack>
  );
}

function TaskCard({ task, caseInfo, actions }) {
  return (
    <Paper p="md" radius="md" withBorder bg="white">
      <Stack gap="sm">
        <Group justify="space-between" align="flex-start" wrap="nowrap">
          <Box style={{ minWidth: 0 }}>
            <Text size="xs" fw={700} c={MUTED_OLIVE} tt="uppercase">{caseInfo?.type || 'Case'}</Text>
            <ClientCase caseInfo={caseInfo} />
          </Box>
          <StatusBadge item={task} />
        </Group>
        <TaskDescription task={task} actions={actions} />
        <Group justify="flex-end" align="center" gap="xs" pt="xs" style={{ borderTop: '1px solid #F0F0F0' }}>
          <TaskActions task={task} actions={actions} />
        </Group>
      </Stack>
    </Paper>
  );
}

export default function TaskList({ tasks, cases, assignees, ...handlers }) {
  const actions = { ...handlers, assignees };
  const groups = TASK_GROUPS.map((group) => ({ ...group, tasks: tasks.filter((task) => getTaskGroup(task) === group.id) })).filter((group) => group.tasks.length);

  if (!groups.length) {
    return (
      <Paper p="xl" radius="lg" withBorder ta="center" bg="white">
        <IconClipboardList size={42} color={MUTED_OLIVE} stroke={1.5} />
        <Text fw={700} c={CHARCOAL} mt="sm">No tasks found</Text>
        <Text size="sm" c={MUTED_OLIVE}>Try another search or priority filter, or add a task.</Text>
      </Paper>
    );
  }

  return (
    <Stack gap="lg">
      {groups.map((group) => (
        <Paper key={group.id} radius="lg" withBorder shadow="xs" bg="white" style={{ overflow: 'hidden' }}>
          <Group gap="sm" px="lg" py="md" style={{ borderLeft: `4px solid ${group.color}` }}>
            <Text fw={700} c={group.color}>{group.label}</Text>
            <Text size="xs" c={MUTED_OLIVE}>{group.tasks.length} {group.tasks.length === 1 ? 'task' : 'tasks'}</Text>
          </Group>
          <Box visibleFrom="md">
            <Table.ScrollContainer minWidth={1120}>
              <Table verticalSpacing="md" horizontalSpacing="md" highlightOnHover style={{ tableLayout: 'fixed' }}>
                <Table.Thead style={{ background: THEMED_LIGHT_BG + '65' }}>
                  <Table.Tr>
                    <Table.Th w="12%">TYPE</Table.Th>
                    <Table.Th w="20%">CLIENT / CASE</Table.Th>
                    <Table.Th w="48%">TASK</Table.Th>
                    <Table.Th w="11%" ta="center">DEADLINE</Table.Th>
                    <Table.Th w="9%" ta="center">PRIORITY</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {group.tasks.map((task) => {
                    const caseInfo = getCase(task.caseId, cases);
                    return (
                      <Table.Tr key={task.id}>
                        <Table.Td style={{ verticalAlign: 'middle' }}><Text size="sm" fw={600} c={CHARCOAL}>{caseInfo?.type || 'Case'}</Text></Table.Td>
                        <Table.Td style={{ verticalAlign: 'middle' }}><ClientCase caseInfo={caseInfo} /></Table.Td>
                        <Table.Td style={{ verticalAlign: 'middle' }}>
                          <Group align="flex-start" wrap="nowrap" gap="xs">
                            <Box style={{ minWidth: 0, flex: 1 }}><TaskDescription task={task} actions={actions} /></Box>
                            <TaskActions task={task} actions={actions} />
                          </Group>
                        </Table.Td>
                        <Table.Td style={{ verticalAlign: 'middle', textAlign: 'center' }}>
                          <TaskDeadlinePicker value={task.dueDate} label={`Change deadline for task: ${task.description}`} onChange={(next) => actions.onDateTask(task.id, next)} overdue={group.id === 'overdue'} />
                        </Table.Td>
                        <Table.Td style={{ verticalAlign: 'middle', textAlign: 'center' }}><StatusBadge item={task} /></Table.Td>
                      </Table.Tr>
                    );
                  })}
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>
          </Box>
          <Stack gap="sm" p="sm" hiddenFrom="md" style={{ background: '#FAFAFA' }}>
            {group.tasks.map((task) => <TaskCard key={task.id} task={task} caseInfo={getCase(task.caseId, cases)} actions={actions} />)}
          </Stack>
        </Paper>
      ))}
    </Stack>
  );
}
