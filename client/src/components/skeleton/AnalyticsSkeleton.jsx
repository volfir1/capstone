import React from 'react';
import {
  Container,
  Paper,
  Box,
  Stack,
  Group,
  Card,
  SimpleGrid,
  Grid,
  Skeleton,
  Divider,
} from '@mantine/core';
import { BG } from '@utils/constants';

const StatCardSkeleton = () => (
  <Card shadow="sm" padding="lg" radius="md" withBorder>
    <Group justify="space-between" align="start">
      <Stack gap={0} style={{ flex: 1 }}>
        <Skeleton height={12} width="40%" mb={8} radius="xl" />
        <Skeleton height={40} width="60%" mb={8} radius="xl" />
        <Skeleton height={10} width="80%" radius="xl" />
      </Stack>
      <Skeleton height={50} width={50} radius="md" />
    </Group>
  </Card>
);

const LeaderboardCardSkeleton = () => (
  <Paper shadow="sm" radius="md" p="lg" withBorder style={{ height: '100%' }}>
    <Group justify="space-between" mb="lg">
      <Group gap="sm">
        <Skeleton height={32} width={32} radius="md" />
        <Stack gap={4}>
          <Skeleton height={14} width={100} radius="xl" />
          <Skeleton height={10} width={80} radius="xl" />
        </Stack>
      </Group>
    </Group>

    <Stack gap={10}>
      {[...Array(5)].map((_, index) => (
        <Group key={index} wrap="nowrap" align="center" p="10px 12px">
          <Skeleton height={20} width={20} radius="xl" />
          <Skeleton height={32} width={32} radius="xl" />
          <Box style={{ flex: 1 }}>
            <Group justify="space-between" mb={8}>
              <Skeleton height={14} width="50%" radius="xl" />
              <Skeleton height={12} width="20%" radius="xl" />
            </Group>
            <Skeleton height={4} width="100%" radius="xl" />
          </Box>
        </Group>
      ))}
    </Stack>
  </Paper>
);

export default function AnalyticsSkeleton() {
  return (
    <Box bg={BG} mih="100vh" py="xl">
      <Container size="xl">
        
        {/* Header Section */}
        <Stack gap="md" mb="xl">
          <Group justify="space-between" align="flex-end">
            <Box>
              <Group gap="xs" mb={4}>
                <Skeleton height={28} width={28} radius="sm" />
                <Skeleton height={30} width={250} radius="xl" />
              </Group>
              <Skeleton height={14} width={300} mt={8} radius="xl" />
            </Box>
            
            <Group>
              <Skeleton height={36} width={160} radius="md" />
              <Skeleton height={36} width={200} radius="md" />
              <Skeleton height={36} width={100} radius="md" />
            </Group>
          </Group>
        </Stack>

        {/* Key Metrics Grid */}
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="lg" mb="xl">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </SimpleGrid>

        <Grid gutter="lg" mb="xl">
          {/* Case Trend Chart */}
          <Grid.Col span={{ base: 12, md: 8 }}>
            <Card shadow="sm" radius="md" padding="lg" withBorder h="100%">
              <Skeleton height={24} width={200} mb="lg" radius="xl" />
              <Skeleton height={300} width="100%" radius="md" />
            </Card>
          </Grid.Col>

          {/* Decisions Donut */}
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Card shadow="sm" radius="md" padding="lg" withBorder h="100%">
              <Skeleton height={24} width={150} mb="lg" radius="xl" />
              <Stack align="center" gap="md" mt="md">
                <Skeleton height={180} width={180} circle />
                <Stack gap="xs" mt="md" w="100%">
                  {[...Array(3)].map((_, i) => (
                    <Group key={i} justify="space-between">
                      <Group gap="xs">
                        <Skeleton height={8} width={8} circle />
                        <Skeleton height={12} width={60} radius="xl" />
                      </Group>
                      <Skeleton height={12} width={20} radius="xl" />
                    </Group>
                  ))}
                </Stack>
              </Stack>
            </Card>
          </Grid.Col>
        </Grid>

        {/* Personnel Performance Section */}
        <Box mb="sm">
          <Skeleton height={28} width={200} mb={8} radius="xl" />
          <Skeleton height={14} width={250} radius="xl" />
        </Box>
        
        <Grid gutter="lg">
          <Grid.Col span={{ base: 12, md: 4 }}>
            <LeaderboardCardSkeleton />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 4 }}>
            <LeaderboardCardSkeleton />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 4 }}>
            <LeaderboardCardSkeleton />
          </Grid.Col>
        </Grid>

      </Container>
    </Box>
  );
}
