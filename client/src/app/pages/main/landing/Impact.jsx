import {
  Title,
  Text,
  Container,
  Grid,
  SimpleGrid,
  Paper,
  ThemeIcon,
  Box,
  Stack,
  Badge,
  List,
  rem,
} from "@mantine/core";
import { useWindowScroll } from "@mantine/hooks";
import { IconCheck } from "@tabler/icons-react";
import { PRIMARY_GOLD, PRIMARY_BROWN } from "../../../../utils/constants"; // Adjust path if needed

export default function ImpactSection() {
  const [scroll] = useWindowScroll();

  return (
    <Box
      style={{
        backgroundColor: 'white',
        transform: `translateY(${(scroll.y - 2400) * 0.1}px)`,
        transition: 'transform 0.2s ease-out'
      }}
    >
      <Container size="xl" py={rem(100)}>
        <Grid gutter={50} align="center">
          <Grid.Col span={12} md={6}>
            <Stack spacing="md">
              <Badge 
                size="lg" 
                radius="xl" 
                variant="gradient"
                gradient={{ from: PRIMARY_GOLD, to: PRIMARY_BROWN }}
              >
                Our Impact
              </Badge>

              <Title order={2}>Empowering Communities Through Technology</Title>

              <Text c="dimmed" size="lg" lh={1.7}>
                JUSTREACH addresses the critical justice gap in rural Philippines
                by decentralizing legal services through mobile and web platforms.
                Our system integrates with existing PAO procedures while
                introducing AI-powered recommendations and offline capabilities.
              </Text>

              <List
                spacing="md"
                size="md"
                icon={
                  <ThemeIcon 
                    style={{ backgroundColor: `${PRIMARY_GOLD}20`, color: PRIMARY_BROWN }}
                    size={24} 
                    radius="xl"
                  >
                    <IconCheck size={16} />
                  </ThemeIcon>
                }
              >
                <List.Item>
                  <Text fw={500}>Eliminates Geographic Barriers</Text>
                  <Text size="sm" c="dimmed">
                    No need to travel to urban centers for legal consultations
                  </Text>
                </List.Item>
                <List.Item>
                  <Text fw={500}>Reduces Legal Costs</Text>
                  <Text size="sm" c="dimmed">
                    Free consultations and digital document processing
                  </Text>
                </List.Item>
                <List.Item>
                  <Text fw={500}>Increases Legal Awareness</Text>
                  <Text size="sm" c="dimmed">
                    Educational resources in multiple languages
                  </Text>
                </List.Item>
                <List.Item>
                  <Text fw={500}>Strengthens Local Governance</Text>
                  <Text size="sm" c="dimmed">
                    Barangay-level integration for transparent justice
                  </Text>
                </List.Item>
              </List>
            </Stack>
          </Grid.Col>

          <Grid.Col span={12} md={6}>
            <SimpleGrid cols={2} spacing="md">
              <Paper p="xl" radius="xl" withBorder>
                <Text size={rem(48)} fw={700} c={PRIMARY_GOLD} ta="center">
                  63%
                </Text>
                <Text size="sm" c="dimmed" ta="center">
                  Of PDLs lack timely trials—we're changing that
                </Text>
              </Paper>

              <Paper p="xl" radius="xl" withBorder>
                <Text size={rem(48)} fw={700} c={PRIMARY_BROWN} ta="center">
                  120K+
                </Text>
                <Text size="sm" c="dimmed" ta="center">
                  Population in target areas like San Jose Del Monte
                </Text>
              </Paper>

              <Paper p="xl" radius="xl" withBorder>
                <Text size={rem(48)} fw={700} c={PRIMARY_GOLD} ta="center">
                  100%
                </Text>
                <Text size="sm" c="dimmed" ta="center">
                  Free legal assistance for qualified individuals
                </Text>
              </Paper>

              <Paper p="xl" radius="xl" withBorder>
                <Text size={rem(48)} fw={700} c={PRIMARY_BROWN} ta="center">
                  24/7
                </Text>
                <Text size="sm" c="dimmed" ta="center">
                  Platform availability with offline support
                </Text>
              </Paper>
            </SimpleGrid>
          </Grid.Col>
        </Grid>
      </Container>
    </Box>
  );
}