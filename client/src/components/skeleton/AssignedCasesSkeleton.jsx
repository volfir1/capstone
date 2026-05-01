import { Box, Container, Paper, Skeleton, Group, Stack, Table, Text } from '@mantine/core';
import { PRIMARY_BROWN, MUTED_OLIVE, BG, CHARCOAL } from '@/utils/constants';

const S_SURFACE = 'var(--app-surface)';
const S_SURFACE_MUTED = 'var(--app-surface-muted)';
const S_BORDER = 'var(--app-border)';

const SkeletonTableRow = ({ cols }) => (
  <Table.Tr>
    {Array.from({ length: cols }).map((_, i) => (
      <Table.Td key={i}>
        {i === 0 ? (
          <Group gap={8} wrap="nowrap">
            <Skeleton height={22} width={22} radius="xl" />
            <Skeleton height={14} style={{ flex: 1 }} radius="sm" />
          </Group>
        ) : i === cols - 2 ? (
          <Skeleton height={18} width={18} radius="xl" />
        ) : i === cols - 1 ? (
          <Group gap={6} wrap="nowrap">
            <Skeleton height={28} width={60} radius="md" />
            <Skeleton height={28} width={28} radius="md" />
          </Group>
        ) : (
          <Skeleton height={14} radius="sm" />
        )}
      </Table.Td>
    ))}
  </Table.Tr>
);

export default function AssignedCasesSkeleton({ rows = 5, isAssigner = false }) {
  const cols = isAssigner ? 8 : 7;

  return (
    <Box bg={BG} mih="100vh" py="xl">
      <Container size="xl" px={{ base: 'md', sm: 'xl' }}>
        {/* Page Header */}
        <Group justify="space-between" align="center" mb="lg">
          <Box>
            <Skeleton height={24} width={180} mb={6} radius="sm" />
            <Skeleton height={14} width={260} radius="sm" />
          </Box>
          <Skeleton height={28} width={28} radius="md" />
        </Group>

        {/* Search */}
        <Paper shadow="xs" p="md" mb="md" radius="lg" withBorder style={{ background: S_SURFACE }}>
          <Skeleton height={36} radius="md" />
        </Paper>

        {/* Tabs + Table */}
        <Paper shadow="xs" radius="lg" withBorder style={{ overflow: 'hidden', background: S_SURFACE }}>
          {/* Tab header area */}
          <Box px={{ base: 'sm', sm: 'md' }} pt="md" pb="sm" style={{ borderBottom: `1px solid ${S_BORDER}`, background: S_SURFACE_MUTED }}>
            <Group gap="sm">
              <Skeleton height={32} width={170} radius="xl" />
              <Skeleton height={32} width={110} radius="xl" />
              {isAssigner && <Skeleton height={32} width={160} radius="xl" />}
              {isAssigner && <Skeleton height={32} width={160} radius="xl" />}
            </Group>
          </Box>

          {/* Table */}
          <Box p={{ base: 'xs', sm: 'md' }}>
            <Table.ScrollContainer minWidth={700}>
              <Table striped highlightOnHover withTableBorder withColumnBorders>
                <Table.Thead>
                  <Table.Tr style={{ backgroundColor: PRIMARY_BROWN }}>
                    {['Case Title', 'Client', ...(isAssigner ? ['Assigned To'] : ['Assigned By']), 'Deadline', 'Message', 'Status', 'Actions'].map((col) => (
                      <Table.Th key={col} style={{ color: 'white', fontSize: 13 }}>
                        {col}
                      </Table.Th>
                    ))}
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {Array.from({ length: rows }).map((_, i) => (
                    <SkeletonTableRow key={i} cols={cols} />
                  ))}
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>

            {/* Pagination placeholder */}
            <Group justify="center" mt="md">
              <Skeleton height={32} width={200} radius="md" />
            </Group>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
