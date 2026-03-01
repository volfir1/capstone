import { Box, Paper, Skeleton, Group, Stack, Tabs, Text } from '@mantine/core';
import { PRIMARY_BROWN, MUTED_OLIVE } from '@/utils/constants';

const SkeletonTableRow = ({ showExtraCol }) => (
  <Group gap="sm" py={10} px="md" style={{ borderBottom: '1px solid #F0F0F0' }} wrap="nowrap">
    <Skeleton height={14} width="18%" radius="sm" />
    <Skeleton height={14} width="14%" radius="sm" />
    {showExtraCol && (
      <Group gap={6} wrap="nowrap" style={{ width: '16%' }}>
        <Skeleton height={24} width={24} radius="xl" />
        <Skeleton height={14} style={{ flex: 1 }} radius="sm" />
      </Group>
    )}
    <Skeleton height={14} width="12%" radius="sm" />
    <Skeleton height={14} width="16%" radius="sm" />
    <Skeleton height={18} width={18} radius="xl" />
    <Group gap={6} wrap="nowrap">
      <Skeleton height={28} width={60} radius="md" />
      <Skeleton height={28} width={28} radius="md" />
    </Group>
  </Group>
);

export default function AssignedCasesSkeleton({ rows = 5, isAssigner = false }) {
  return (
    <Box p="lg">
      {/* Header */}
      <Paper shadow="xs" p="xl" mb="xl" radius="lg" style={{ background: PRIMARY_BROWN, border: 'none' }}>
        <Group gap="md" align="center">
          <Skeleton height={48} width={48} radius={12} style={{ opacity: 0.3 }} />
          <Box>
            <Skeleton height={22} width={200} mb={8} style={{ opacity: 0.3 }} />
            <Skeleton height={14} width={280} style={{ opacity: 0.3 }} />
          </Box>
        </Group>
      </Paper>

      {/* Search */}
      <Paper shadow="xs" p="md" mb="md" radius="md">
        <Skeleton height={36} radius="md" />
      </Paper>

      {/* Tabs + Table */}
      <Paper shadow="xs" radius="md" p="md">
        {/* Tab headers */}
        <Group gap="sm" mb="md">
          <Skeleton height={32} width={170} radius="sm" />
          <Skeleton height={32} width={110} radius="sm" />
          {isAssigner && <Skeleton height={32} width={160} radius="sm" />}
          {isAssigner && <Skeleton height={32} width={160} radius="sm" />}
        </Group>

        {/* Table header */}
        <Group
          gap="sm"
          px="md"
          py={10}
          wrap="nowrap"
          style={{ backgroundColor: `${PRIMARY_BROWN}18`, borderRadius: '6px 6px 0 0' }}
        >
          {['Case Title', 'Client', 'Assigned By', 'Deadline', 'Message', 'Status', 'Actions'].map((col) => (
            <Skeleton key={col} height={12} width={col === 'Case Title' ? '18%' : col === 'Message' ? '16%' : '12%'} radius="sm" />
          ))}
        </Group>

        {/* Table rows */}
        <Stack gap={0}>
          {Array.from({ length: rows }).map((_, i) => (
            <SkeletonTableRow key={i} showExtraCol />
          ))}
        </Stack>

        {/* Pagination placeholder */}
        <Group justify="center" mt="md">
          <Skeleton height={32} width={200} radius="md" />
        </Group>
      </Paper>

      <Box ta="center" mt="md">
        <Text size="sm" c={MUTED_OLIVE}>Loading assignments...</Text>
      </Box>
    </Box>
  );
}
