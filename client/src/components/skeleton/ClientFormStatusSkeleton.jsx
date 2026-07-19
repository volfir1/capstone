import React from 'react';
import { Box, Container, Grid, Paper, Skeleton, Stack, Group, Text } from '@mantine/core';
import { PRIMARY_BROWN, MUTED_OLIVE } from '@/utils/constants';

export default function ClientFormStatusSkeleton() {
  return (
    <Box py="xl">
      <Container size="xl">
        <Group position="apart" mb="md">
          <div>
            <Skeleton height={28} width={300} radius="sm" />
            <Skeleton height={12} width={220} mt={8} />
          </div>
          <Skeleton height={36} width={140} radius="md" />
        </Group>

        <Grid gutter="xl">
          <Grid.Col span={8}>
            <Paper p="lg" radius="lg" withBorder style={{ height: 520 }}>
              <Stack spacing="sm">
                <Skeleton height={24} width={200} />
                <Skeleton height={12} width={160} />
                <Skeleton height={420} />
              </Stack>
            </Paper>
          </Grid.Col>

          <Grid.Col span={4}>
            <Stack spacing="md">
              <Paper p="md" radius="lg" withBorder>
                <Skeleton height={18} width={160} />
                <Skeleton height={12} width={120} mt={8} />
                <Skeleton height={12} width={90} mt={8} />
              </Paper>

              {Array.from({ length: 5 }).map((_, i) => (
                <Paper key={i} p="md" radius="lg" withBorder>
                  <Group position="apart">
                    <Stack spacing={6} style={{ flex: 1 }}>
                      <Skeleton height={14} width="70%" />
                      <Skeleton height={10} width="40%" />
                    </Stack>
                    <Skeleton height={28} width={80} radius="md" />
                  </Group>
                </Paper>
              ))}
            </Stack>
          </Grid.Col>
        </Grid>

        <Box mt="lg" style={{ textAlign: 'center' }}>
          <Text c={MUTED_OLIVE} size="sm">Loading appointment manager...</Text>
        </Box>
      </Container>
    </Box>
  );
}
