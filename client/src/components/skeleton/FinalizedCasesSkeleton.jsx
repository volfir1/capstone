import React from 'react';
import { Stack, Paper, Skeleton, Group, Box, Text } from '@mantine/core';
import { PRIMARY_BROWN, MUTED_OLIVE } from '@/utils/constants';

export default function FinalizedCasesSkeleton({ rows = 6 }) {
  return (
    <Stack gap="sm">
      {Array.from({ length: rows }).map((_, i) => (
        <Paper key={i} shadow="xs" p="md" radius="md" style={{ border: '1px solid #E5E7EB' }}>
          <Group position="apart" align="flex-start">
            <Box style={{ flex: 1 }}>
              <Skeleton height={18} width="60%" mb="8px" />
              <Skeleton height={12} width="40%" mb="8px" />
              <Group spacing="xs" mt="6px">
                <Skeleton height={24} width={80} radius="sm" />
                <Skeleton height={24} width={60} radius="sm" />
                <Skeleton height={24} width={100} radius="sm" />
              </Group>
            </Box>

            <Box style={{ display: 'flex', alignItems: 'center' }}>
              <Skeleton height={36} width={100} radius="md" />
            </Box>
          </Group>
        </Paper>
      ))}

      <Box style={{ textAlign: 'center', color: MUTED_OLIVE }}>
        <Text size="sm" c="dimmed">Loading finalized cases...</Text>
      </Box>
    </Stack>
  );
}
