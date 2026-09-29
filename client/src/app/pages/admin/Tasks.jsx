import { useMemo, useState } from 'react';
import {
  ActionIcon, Badge, Box, Button, Container, Group, Modal, Paper, Select,
  SimpleGrid, Stack, Text, TextInput, Title, Tooltip,
} from '@mantine/core';
import { IconCheck, IconEdit, IconFilter, IconListCheck, IconPlus, IconRotateClockwise, IconSearch, IconTrash } from '@tabler/icons-react';
import TaskCompletionModal from '@/components/tasks/TaskCompletionModal';
import TaskFormModal from '@/components/tasks/TaskFormModal';
import TaskList from '@/components/tasks/TaskList';
import { PrototypeLink, TaskAssigneeSelect, TaskDeadlinePicker } from '@/components/tasks/TaskRowControls';
import SubtaskFormModal from '@/components/tasks/SubtaskFormModal';
import { createPrototypeTasks, SAMPLE_ASSIGNEES, SAMPLE_CASES } from '@/features/tasks/prototypeData';
import { formatTaskDate, getCase, getTaskGroup, TASK_GROUPS } from '@/features/tasks/taskUtils';
import { BG, CHARCOAL, MUTED_OLIVE, PRIMARY_BROWN, THEMED_LIGHT_BG } from '@/utils/constants';

const FILTER_OPTIONS = [
  { value: 'active', label: 'All Priorities' },
  ...TASK_GROUPS.map((group) => ({ value: group.id, label: group.id === 'pending' ? 'Pending (No Deadline)' : group.label })),
];

const localId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

function TaskSummary({ tasks, onFilter }) {
  const active = tasks.filter((task) => !task.completed).length;
  const items = [
    { id: 'active', label: 'Active Tasks', value: active, color: PRIMARY_BROWN },
    ...TASK_GROUPS.filter((group) => group.id !== 'completed').map((group) => ({
      id: group.id,
      label: group.label,
      value: tasks.filter((task) => getTaskGroup(task) === group.id).length,
      color: group.color,
    })),
  ];

  return (
    <SimpleGrid cols={{ base: 2, xs: 3, md: 4, xl: 7 }} spacing="sm">
      {items.map((item) => (
        <Paper
          key={item.id} component="button" type="button" onClick={() => onFilter(item.id)}
          p="md" radius="lg" withBorder shadow="xs"
          style={{ cursor: 'pointer', textAlign: 'center', background: 'white', borderTop: `3px solid ${item.color}` }}
          aria-label={`Show ${item.label.toLowerCase()} tasks`}
        >
          <Text size="10px" fw={700} tt="uppercase" c={MUTED_OLIVE} style={{ letterSpacing: '0.08em' }}>{item.label}</Text>
          <Text size="xl" fw={800} c={item.color}>{item.value}</Text>
        </Paper>
      ))}
    </SimpleGrid>
  );
}

export default function Tasks() {
  const [tasks, setTasks] = useState(createPrototypeTasks);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('active');
  const [formOpened, setFormOpened] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [detailsId, setDetailsId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [completionTarget, setCompletionTarget] = useState(null);
  const [editingSubtaskTarget, setEditingSubtaskTarget] = useState(null);

  const visibleTasks = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return tasks.filter((task) => {
      if (filter === 'active' && task.completed) return false;
      if (filter !== 'active' && getTaskGroup(task) !== filter) return false;
      if (!query) return true;
      const caseInfo = getCase(task.caseId, SAMPLE_CASES);
      return [task.description, task.assignee, caseInfo?.client, caseInfo?.title, caseInfo?.type, caseInfo?.caseNumber,
        ...task.subtasks.map((item) => item.description)].some((value) => String(value || '').toLocaleLowerCase().includes(query));
    }).sort((a, b) => (a.dueDate || '9999').localeCompare(b.dueDate || '9999'));
  }, [tasks, search, filter]);

  const detailsTask = tasks.find((task) => task.id === detailsId);
  const detailsCase = detailsTask ? getCase(detailsTask.caseId, SAMPLE_CASES) : null;
  const detailsGroup = detailsTask ? TASK_GROUPS.find((group) => group.id === getTaskGroup(detailsTask)) : null;
  const completionTask = tasks.find((task) => task.id === completionTarget?.taskId);
  const completionSubtask = completionTask?.subtasks.find((item) => item.id === completionTarget?.subtaskId);
  const completionDetails = completionTask && (completionTarget.kind === 'task' || completionSubtask)
    ? { kind: completionTarget.kind, task: completionTask, subtask: completionSubtask }
    : null;
  const editingSubtaskTask = tasks.find((task) => task.id === editingSubtaskTarget?.taskId);
  const editingSubtask = editingSubtaskTask?.subtasks.find((item) => item.id === editingSubtaskTarget?.subtaskId);

  const openAdd = () => { setEditingTask(null); setFormOpened(true); };
  const openEdit = (task) => { setDetailsId(null); setEditingTask(task); setFormOpened(true); };
  const saveTask = (value) => {
    setTasks((current) => editingTask
      ? current.map((task) => task.id === editingTask.id ? value : task)
      : [...current, { ...value, id: localId('local-task') }]);
    setFormOpened(false);
    setEditingTask(null);
    setFilter('active');
  };
  const openTaskCompletion = (task) => { setDetailsId(null); setCompletionTarget({ kind: 'task', taskId: task.id }); };
  const openSubtaskCompletion = (task, subtask) => { setDetailsId(null); setCompletionTarget({ kind: 'subtask', taskId: task.id, subtaskId: subtask.id }); };
  const openSubtaskEdit = (task, subtask) => { setDetailsId(null); setEditingSubtaskTarget({ taskId: task.id, subtaskId: subtask.id }); };
  const saveSubtask = (updates) => {
    if (!editingSubtaskTarget) return;
    setTasks((current) => current.map((task) => task.id === editingSubtaskTarget.taskId ? {
      ...task,
      subtasks: task.subtasks.map((item) => item.id === editingSubtaskTarget.subtaskId ? { ...item, ...updates } : item),
    } : task));
    setEditingSubtaskTarget(null);
  };
  const assignTask = (id, assignee) => setTasks((current) => current.map((task) => task.id === id ? { ...task, assignee } : task));
  const dateTask = (id, dueDate) => setTasks((current) => current.map((task) => task.id === id ? { ...task, dueDate } : task));
  const updateSubtaskField = (taskId, subtaskId, field, value) => setTasks((current) => current.map((task) => task.id === taskId ? {
    ...task,
    subtasks: task.subtasks.map((item) => item.id === subtaskId ? { ...item, [field]: value } : item),
  } : task));
  const reopenTask = (id) => setTasks((current) => current.map((task) => task.id === id ? { ...task, completed: false, completion: undefined } : task));
  const reopenSubtask = (taskId, subtaskId) => setTasks((current) => current.map((task) => task.id === taskId ? {
    ...task,
    subtasks: task.subtasks.map((item) => item.id === subtaskId ? { ...item, completed: false, completion: undefined } : item),
  } : task));
  const completeWork = ({ completion, followUp }) => {
    if (!completionTarget) return;
    const { kind, taskId, subtaskId } = completionTarget;
    setTasks((current) => kind === 'task'
      ? [
        ...current.map((task) => task.id === taskId ? { ...task, completed: true, completion } : task),
        ...(followUp ? [{ ...followUp, id: localId('local-task'), completed: false }] : []),
      ]
      : current.map((task) => task.id === taskId ? {
        ...task,
        subtasks: [
          ...task.subtasks.map((item) => item.id === subtaskId ? { ...item, completed: true, completion } : item),
          ...(followUp ? [{ id: localId('local-sub'), description: followUp.description, assignee: followUp.assignee, dueDate: followUp.dueDate, completed: false }] : []),
        ],
      } : task));
    setCompletionTarget(null);
    setFilter((current) => kind === 'task' ? (followUp ? 'active' : 'completed') : current);
  };
  const confirmDelete = () => {
    if (!deleteTarget) return;
    setTasks((current) => deleteTarget.kind === 'task'
      ? current.filter((task) => task.id !== deleteTarget.taskId)
      : current.map((task) => task.id === deleteTarget.taskId
        ? { ...task, subtasks: task.subtasks.filter((item) => item.id !== deleteTarget.subtaskId) }
        : task));
    if (detailsId === deleteTarget.taskId) setDetailsId(null);
    if (editingSubtaskTarget?.subtaskId === deleteTarget.subtaskId) setEditingSubtaskTarget(null);
    setDeleteTarget(null);
  };

  return (
    <Box bg={BG} mih="100vh" py={{ base: 'md', sm: 'xl' }}>
      <Container fluid px={{ base: 'md', sm: 'lg', xl: 'xl' }}>
        <Stack gap="lg">
          <Group justify="space-between" align="flex-start" gap="sm">
            <Group gap="sm" align="center">
              <Box style={{ width: 44, height: 44, borderRadius: 12, background: `linear-gradient(45deg, ${PRIMARY_BROWN}, #C4AB7D)`, display: 'grid', placeItems: 'center' }}>
                <IconListCheck size={23} color="white" />
              </Box>
              <Box>
                <Title order={3} fw={700} c={CHARCOAL}>Tasks</Title>
                <Text size="sm" c={MUTED_OLIVE}>Track case work and upcoming deadlines</Text>
              </Box>
            </Group>
            <Badge variant="light" color="brown" radius="sm">UI prototype · sample data</Badge>
          </Group>

          <Paper
            component="section" aria-label="Task controls"
            p="md" radius="lg" shadow="xs" withBorder bg="white"
            style={{ position: 'sticky', top: 'var(--app-shell-header-height, 60px)', zIndex: 90 }}
          >
            <Group align="flex-end" justify="space-between" gap="sm">
              <TextInput
                aria-label="Search tasks" placeholder="Search tasks, clients, or cases" leftSection={<IconSearch size={17} />}
                value={search} onChange={(event) => setSearch(event.currentTarget.value)}
                style={{ flex: '1 1 280px' }}
              />
              <Group gap="sm" style={{ flex: '0 1 auto' }}>
                <Select
                  aria-label="Filter tasks by priority" leftSection={<IconFilter size={16} />}
                  data={FILTER_OPTIONS} value={filter} onChange={(value) => setFilter(value || 'active')}
                  style={{ width: 210, maxWidth: '100%' }}
                />
                <Button leftSection={<IconPlus size={18} />} onClick={openAdd} style={{ backgroundColor: PRIMARY_BROWN }}>Add Task</Button>
              </Group>
            </Group>
          </Paper>

          <TaskSummary tasks={tasks} onFilter={setFilter} />
          <TaskList
            tasks={visibleTasks} cases={SAMPLE_CASES} assignees={SAMPLE_ASSIGNEES}
            onOpen={(task) => setDetailsId(task.id)}
            onCompleteTask={openTaskCompletion} onReopenTask={reopenTask}
            onCompleteSubtask={openSubtaskCompletion} onReopenSubtask={reopenSubtask}
            onEditTask={openEdit} onDeleteTask={(task) => setDeleteTarget({ kind: 'task', taskId: task.id })}
            onEditSubtask={openSubtaskEdit} onDeleteSubtask={(task, subtask) => setDeleteTarget({ kind: 'subtask', taskId: task.id, subtaskId: subtask.id })}
            onAssignTask={assignTask} onAssignSubtask={(taskId, subtaskId, next) => updateSubtaskField(taskId, subtaskId, 'assignee', next)}
            onDateTask={dateTask} onDateSubtask={(taskId, subtaskId, next) => updateSubtaskField(taskId, subtaskId, 'dueDate', next)}
          />
          <Text size="xs" c={MUTED_OLIVE} ta="center">Sample tasks and changes are temporary. They reset when this page is refreshed.</Text>
        </Stack>
      </Container>

      <TaskFormModal
        opened={formOpened} task={editingTask} cases={SAMPLE_CASES} assignees={SAMPLE_ASSIGNEES}
        onClose={() => setFormOpened(false)} onSave={saveTask}
      />

      <TaskCompletionModal
        opened={Boolean(completionDetails)} target={completionDetails} cases={SAMPLE_CASES} assignees={SAMPLE_ASSIGNEES}
        onClose={() => setCompletionTarget(null)} onComplete={completeWork}
      />

      <SubtaskFormModal
        opened={Boolean(editingSubtask)} task={editingSubtaskTask} subtask={editingSubtask}
        caseInfo={getCase(editingSubtaskTask?.caseId, SAMPLE_CASES)} assignees={SAMPLE_ASSIGNEES}
        onClose={() => setEditingSubtaskTarget(null)} onSave={saveSubtask}
      />

      <Modal opened={Boolean(detailsTask)} onClose={() => setDetailsId(null)} title="Task Details" size="lg" centered radius="lg">
        {detailsTask && (
          <Stack gap="md">
            <Paper p="md" radius="md" withBorder style={{ background: THEMED_LIGHT_BG + '50' }}>
              <Text size="xs" fw={700} c={MUTED_OLIVE} tt="uppercase">Associated Case</Text>
              <Group gap={5}>
                <PrototypeLink color={CHARCOAL} fw={700} title="Client page is not connected in this prototype">{detailsCase?.client}</PrototypeLink>
                <Text size="sm" c={MUTED_OLIVE}>·</Text>
                <PrototypeLink title="Case details are not connected in this prototype">{detailsCase?.title}</PrototypeLink>
              </Group>
              <Text size="xs" c={MUTED_OLIVE}>{detailsCase?.caseNumber} · {detailsCase?.type}</Text>
            </Paper>
            <PrototypeLink onClick={() => openEdit(detailsTask)} title="Edit task" fw={700}>{detailsTask.description}</PrototypeLink>
            {detailsTask.completion && (
              <Paper p="sm" radius="md" withBorder style={{ background: '#EFF8F1' }}>
                <Text size="xs" fw={700} c="green">COMPLETED · {formatTaskDate(detailsTask.completion.completedAt)}</Text>
                {detailsTask.completion.descriptionOverride && <Text size="sm" mt={4}>Completion note: {detailsTask.completion.descriptionOverride}</Text>}
                {detailsTask.completion.attachmentName && <Text size="xs" c={MUTED_OLIVE}>Selected document: {detailsTask.completion.attachmentName}</Text>}
              </Paper>
            )}
            <Group gap="lg">
              <Box><Text size="xs" c={MUTED_OLIVE}>PRIORITY</Text><Badge variant="light" style={{ color: detailsGroup?.color, background: `${detailsGroup?.color}18` }}>{detailsGroup?.label}</Badge></Box>
              <Box><Text size="xs" c={MUTED_OLIVE}>DUE DATE</Text><TaskDeadlinePicker value={detailsTask.dueDate} label={`Change deadline for task: ${detailsTask.description}`} onChange={(next) => dateTask(detailsTask.id, next)} overdue={getTaskGroup(detailsTask) === 'overdue'} /></Box>
              <Box><Text size="xs" c={MUTED_OLIVE}>ASSIGNED TO</Text><TaskAssigneeSelect value={detailsTask.assignee} assignees={SAMPLE_ASSIGNEES} label={`Assign task: ${detailsTask.description}`} onChange={(next) => assignTask(detailsTask.id, next)} /></Box>
            </Group>
            <Box>
              <Text size="sm" fw={700} mb="xs">Subtasks ({detailsTask.subtasks.length})</Text>
              {detailsTask.subtasks.length ? (
                <Stack gap="xs">
                  {detailsTask.subtasks.map((item) => (
                    <Paper key={item.id} p="sm" withBorder radius="md">
                      <Group justify="space-between" wrap="nowrap" align="flex-start">
                        <Box style={{ minWidth: 0 }}>
                          <PrototypeLink onClick={() => openSubtaskEdit(detailsTask, item)} title="Edit subtask" size="sm" color={item.completed ? MUTED_OLIVE : PRIMARY_BROWN}>
                            <Text component="span" td={item.completed ? 'line-through' : undefined}>{item.description}</Text>
                          </PrototypeLink>
                          {item.completion && <Text size="xs" c="green">Completed {formatTaskDate(item.completion.completedAt)}{item.completion.descriptionOverride ? ` · ${item.completion.descriptionOverride}` : ''}{item.completion.attachmentName ? ` · ${item.completion.attachmentName}` : ''}</Text>}
                        </Box>
                        <Group gap={3} wrap="nowrap">
                          <Tooltip label={item.completed ? 'Reopen subtask' : 'Complete subtask'}><ActionIcon size="sm" variant="subtle" color={item.completed ? 'gray' : 'green'} aria-label={item.completed ? 'Reopen subtask' : 'Complete subtask'} onClick={() => item.completed ? reopenSubtask(detailsTask.id, item.id) : openSubtaskCompletion(detailsTask, item)}>{item.completed ? <IconRotateClockwise size={18} /> : <IconCheck size={18} />}</ActionIcon></Tooltip>
                          <Tooltip label="Edit subtask"><ActionIcon size="sm" variant="subtle" color="gray" aria-label="Edit subtask" onClick={() => openSubtaskEdit(detailsTask, item)}><IconEdit size={18} /></ActionIcon></Tooltip>
                          <Tooltip label="Delete subtask"><ActionIcon size="sm" variant="subtle" color="red" aria-label="Delete subtask" onClick={() => setDeleteTarget({ kind: 'subtask', taskId: detailsTask.id, subtaskId: item.id })}><IconTrash size={18} /></ActionIcon></Tooltip>
                        </Group>
                      </Group>
                      <Group gap="xs" mt="xs" wrap="wrap">
                        <TaskAssigneeSelect compact value={item.assignee} assignees={SAMPLE_ASSIGNEES} label={`Assign subtask: ${item.description}`} onChange={(next) => updateSubtaskField(detailsTask.id, item.id, 'assignee', next)} />
                        <TaskDeadlinePicker compact value={item.dueDate} label={`Change deadline for subtask: ${item.description}`} onChange={(next) => updateSubtaskField(detailsTask.id, item.id, 'dueDate', next)} overdue={getTaskGroup(item) === 'overdue'} />
                      </Group>
                    </Paper>
                  ))}
                </Stack>
              ) : <Text size="sm" c={MUTED_OLIVE}>No subtasks yet.</Text>}
            </Box>
            <Group justify="flex-end">
              <Button variant="default" onClick={() => openEdit(detailsTask)}>Edit Task</Button>
              <Button variant="light" color={detailsTask.completed ? 'gray' : 'green'} onClick={() => detailsTask.completed ? reopenTask(detailsTask.id) : openTaskCompletion(detailsTask)}>{detailsTask.completed ? 'Reopen Task' : 'Mark Complete'}</Button>
            </Group>
          </Stack>
        )}
      </Modal>

      <Modal opened={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} title={`Delete ${deleteTarget?.kind === 'subtask' ? 'Subtask' : 'Task'}`} centered size="sm" radius="lg">
        <Stack gap="md">
          <Text size="sm" c={CHARCOAL}>{deleteTarget?.kind === 'subtask' ? 'Delete this subtask from the current prototype session?' : 'Delete this task and all of its subtasks from the current prototype session?'}</Text>
          <Group justify="flex-end"><Button variant="default" onClick={() => setDeleteTarget(null)}>Cancel</Button><Button color="red" leftSection={<IconTrash size={16} />} onClick={confirmDelete}>Delete</Button></Group>
        </Stack>
      </Modal>
    </Box>
  );
}
