import React from 'react';
import {
  Container,
  Paper,
  Box,
  Group,
  Stack,
  SimpleGrid,
  Skeleton,
  Divider,
} from '@mantine/core';
import { BG } from '@utils/constants';

const S_SURFACE = 'var(--app-surface)';
const S_SURFACE_MUTED = 'var(--app-surface-muted)';
const S_BORDER = 'var(--app-border)';

export default function DashboardSkeleton() {
  return (
    <Box bg={BG} mih="100vh" py="xl">
      <Container size="xl">
        {/* Header Skeleton */}
        <Group justify="space-between" mb="lg">
          <Box>
            <Skeleton height={28} width={150} mb="xs" />
            <Skeleton height={14} width={250} />
          </Box>
          <Skeleton height={34} width={34} radius="md" />
        </Group>

        {/* Stats Grid Skeleton */}
        <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md" mb="md">
          {Array.from({ length: 4 }).map((_, i) => (
            <Paper key={i} p="md" radius="lg" withBorder>
              <Group gap="sm">
                <Skeleton height={40} width={40} radius={10} />
                <Box style={{ flex: 1 }}>
                  <Skeleton height={10} width="60%" mb={8} />
                  <Skeleton height={24} width="40%" />
                </Box>
              </Group>
            </Paper>
          ))}
        </SimpleGrid>

        {/* Charts Grid Skeleton */}
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md" mb="xl">
          {Array.from({ length: 4 }).map((_, i) => (
            <Paper key={i} p="md" radius="lg" withBorder style={{ minHeight: 180 }}>
              <Skeleton height={10} width={120} mb="sm" />
              <Group gap="md" wrap="nowrap">
                <Box style={{ flex: '0 0 160px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Skeleton height={120} circle />
                </Box>
                <Box style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 12px' }}>
                  {Array.from({ length: 4 }).map((_, j) => (
                    <Group key={j} gap={6} wrap="nowrap">
                      <Skeleton height={8} width={8} radius={2} />
                      <Skeleton height={8} style={{ flex: 1 }} />
                    </Group>
                  ))}
                </Box>
              </Group>
            </Paper>
          ))}
        </SimpleGrid>

        {/* Large Papers Skeleton (Queues and Monitoring) */}
        {Array.from({ length: 3 }).map((_, i) => (
          <Paper key={i} shadow="sm" radius="lg" bg={S_SURFACE} mt={i > 0 ? "xl" : 0} withBorder style={{ overflow: 'hidden' }}>
            <Box px="lg" py="md" style={{ borderBottom: `1px solid ${S_BORDER}`, background: S_SURFACE_MUTED }}>
              <Group justify="space-between">
                <Skeleton height={20} width={180} />
                <Skeleton height={24} width={200} radius="md" />
              </Group>
            </Box>
            
            {/* Table-like headers skeleton */}
            <Box px="md" py={8} bg={S_SURFACE_MUTED} style={{ borderBottom: `1px solid ${S_BORDER}` }}>
               <Group wrap="nowrap" gap="md">
                <Skeleton height={12} style={{ flex: 1 }} />
                <Skeleton height={12} width={150} />
                <Skeleton height={12} width={40} />
              </Group>
            </Box>
            
            <Stack gap={0}>
              {Array.from({ length: 5 }).map((_, j) => (
                <Box key={j}>
                  <Group px="md" h={50} wrap="nowrap" gap="md">
                    <Skeleton height={16} style={{ flex: 1 }} />
                    <Skeleton height={16} width={150} />
                    <Skeleton height={20} width={40} />
                  </Group>
                  <Divider color={S_BORDER} />
                </Box>
              ))}
            </Stack>
            
            <Box px="lg" py="xs" style={{ background: S_SURFACE_MUTED, borderTop: `1px solid ${S_BORDER}` }}>
              <Skeleton height={24} width={200} />
            </Box>
          </Paper>
        ))}
      </Container>
    </Box>
  );
}
