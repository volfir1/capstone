import React from 'react';
import { Box, Container, Paper, Skeleton, Stack, Group, Text, Grid } from '@mantine/core';
import { PRIMARY_BROWN, MUTED_OLIVE } from '@/utils/constants';

export default function AssignedCasesSkeleton() {
  return (
    <Box py="xl">
      <Container size="xl">
        <Paper shadow="xs" p="md" mb="md" radius="md" style={{ background: PRIMARY_BROWN }}>
          <Group position="left">
            <Skeleton height={28} width={220} radius="sm" />
          </Group>
        </Paper>

        <Grid gutter="xl">
          <Grid.Col span={12}>
            <Paper p="md" radius="md" withBorder>
              <Stack spacing="sm">
                <Group spacing={10} style={{ width: '100%' }}>
                  <Skeleton height={18} width="20%" />
                  <Skeleton height={18} width="15%" />
                  <Skeleton height={18} width="15%" />
                  <Skeleton height={18} width="15%" />
                  <Skeleton height={18} width="10%" />
                  <Skeleton height={18} width="10%" />
                </Group>

                {Array.from({ length: 6 }).map((_, i) => (
                  <Paper key={i} p="md" radius="md" withBorder>
                    <Group position="apart" align="center">
                      <Stack spacing={6} style={{ flex: 1 }}>
                        <Skeleton height={14} width="60%" />
                        <Skeleton height={12} width="40%" />
                      </Stack>
                      <Skeleton height={28} width={120} radius="md" />
                    </Group>
                  </Paper>
                ))}
              </Stack>
            </Paper>
          </Grid.Col>
        </Grid>

        <Box mt="lg" style={{ textAlign: 'center' }}>
          <Text c={MUTED_OLIVE} size="sm">Loading assignments...</Text>
        </Box>
      </Container>
    </Box>
  );
}
