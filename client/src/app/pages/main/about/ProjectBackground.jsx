import {
  Title,
  Text,
  Container,
  Grid,
  Paper,
  Box,
  Stack,
  Badge,
  Group,
  rem,
} from "@mantine/core";
import { PRIMARY_GOLD, PRIMARY_BROWN } from "../../../../utils/constants"; // Adjust path as needed

export default function ProjectBackground() {
  return (
    <Box style={{ backgroundColor: "#f8f9fa" }}>
      <Container size="xl" py={rem(80)}>
        <Stack spacing="xl" mb={50}>
          <Badge
            size="lg"
            radius="xl"
            variant="gradient"
            gradient={{ from: PRIMARY_GOLD, to: PRIMARY_BROWN }}
            style={{ margin: "0 auto" }}
          >
            Project Background
          </Badge>

          <Title order={2} ta="center">
            Supporting SDG 16: Peace, Justice & Strong Institutions
          </Title>
        </Stack>

        <Grid gutter={40}>
          <Grid.Col span={12} md={6}>
            <Paper p="xl" radius="xl" withBorder style={{ height: "100%" }}>
              <Title order={3} mb="md">
                The Challenge
              </Title>
              <Text c="dimmed" lh={1.7} mb="md">
                In the Philippines, access to justice remains a critical
                challenge, especially for rural communities where legal
                resources are concentrated in urban centers. This inequality
                creates barriers including:
              </Text>
              <Stack spacing="sm">
                <Group spacing="xs">
                  <Box
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      backgroundColor: PRIMARY_GOLD,
                    }}
                  />
                  <Text size="sm" c="dimmed">
                    Prohibitive legal costs
                  </Text>
                </Group>
                <Group spacing="xs">
                  <Box
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      backgroundColor: PRIMARY_GOLD,
                    }}
                  />
                  <Text size="sm" c="dimmed">
                    Geographic distance from legal services
                  </Text>
                </Group>
                <Group spacing="xs">
                  <Box
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      backgroundColor: PRIMARY_GOLD,
                    }}
                  />
                  <Text size="sm" c="dimmed">
                    Language barriers and complex legal terminology
                  </Text>
                </Group>
                <Group spacing="xs">
                  <Box
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      backgroundColor: PRIMARY_GOLD,
                    }}
                  />
                  <Text size="sm" c="dimmed">
                    Limited awareness of legal rights and procedures
                  </Text>
                </Group>
              </Stack>
            </Paper>
          </Grid.Col>

          <Grid.Col span={12} md={6}>
            <Paper p="xl" radius="xl" withBorder style={{ height: "100%" }}>
              <Title order={3} mb="md">
                Our Solution
              </Title>
              <Text c="dimmed" lh={1.7} mb="md">
                JUSTREACH addresses these challenges through a comprehensive
                mobile and web-based platform that offers:
              </Text>
              <Stack spacing="sm">
                <Group spacing="xs">
                  <Box
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      backgroundColor: PRIMARY_BROWN,
                    }}
                  />
                  <Text size="sm" c="dimmed">
                    Multilingual legal forms and guidance
                  </Text>
                </Group>
                <Group spacing="xs">
                  <Box
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      backgroundColor: PRIMARY_BROWN,
                    }}
                  />
                  <Text size="sm" c="dimmed">
                    Remote consultations with PAO volunteer lawyers
                  </Text>
                </Group>
                <Group spacing="xs">
                  <Box
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      backgroundColor: PRIMARY_BROWN,
                    }}
                  />
                  <Text size="sm" c="dimmed">
                    AI-powered legal recommendations
                  </Text>
                </Group>
                <Group spacing="xs">
                  <Box
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      backgroundColor: PRIMARY_BROWN,
                    }}
                  />
                  <Text size="sm" c="dimmed">
                    Offline-capable technology for rural areas
                  </Text>
                </Group>
              </Stack>
            </Paper>
          </Grid.Col>
        </Grid>
      </Container>
    </Box>
  );
}
