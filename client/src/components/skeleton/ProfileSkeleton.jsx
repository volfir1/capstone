import React from 'react';
import { Box, Container, Group, Skeleton, Stack, Paper, Grid, Text } from '@mantine/core';
import { BG, PRIMARY_BROWN, MUTED_OLIVE, CHARCOAL } from '@/utils/constants';

export default function ProfileSkeleton() {
  return (
    <Box bg={BG} py="xl" mih="100vh">
      <Container size="xl">
        <Group position="apart" mb="lg">
          <Group align="center" gap="lg">
            <Skeleton height={100} width={100} radius="xl" />
            <div>
              <Skeleton height={22} width={260} mb={8} />
              <Skeleton height={14} width={180} />
            </div>
          </Group>
          <div style={{ display: 'flex', gap: 12 }}>
            <Skeleton height={36} width={120} radius="md" />
            <Skeleton height={36} width={36} radius="md" />
          </div>
        </Group>

        <Grid gutter="lg">
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Stack spacing="sm">
              <Paper p="md" radius="md" withBorder>
                <Stack spacing={8}>
                  <Skeleton height={16} width={140} />
                  <Skeleton height={12} width={200} />
                  <Skeleton height={12} width={120} />
                </Stack>
              </Paper>

              <Paper p="md" radius="md" withBorder>
                <Stack spacing={8}>
                  <Skeleton height={14} width={180} />
                  <Skeleton height={12} width={160} />
                  <Skeleton height={12} width={100} />
                </Stack>
              </Paper>
            </Stack>
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 8 }}>
            <Stack spacing="md">
              <Paper p="md" radius="md" withBorder>
                <Skeleton height={18} width={220} mb={12} />
                <Stack spacing={8}>
                  <Skeleton height={12} width="100%" />
                  <Skeleton height={12} width="100%" />
                  <Skeleton height={12} width="80%" />
                </Stack>
              </Paper>

              <Paper p="md" radius="md" withBorder>
                <Stack spacing={10}>
                  <Skeleton height={16} width={200} />
                  <Group position="apart">
                    <Skeleton height={12} width={140} />
                    <Skeleton height={12} width={80} />
                  </Group>
                  <Skeleton height={12} width="60%" />
                </Stack>
              </Paper>
            </Stack>
          </Grid.Col>
        </Grid>

        <Box mt="lg" style={{ textAlign: 'center', color: MUTED_OLIVE }}>
          <Text size="sm">Loading profile...</Text>
        </Box>
      </Container>
    </Box>
  );
}
