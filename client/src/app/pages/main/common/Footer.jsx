import {
  Title,
  Text,
  Container,
  Grid,
  ThemeIcon,
  Group,
  Box,
  Stack,
  Divider,
} from "@mantine/core";
import { IconGavel } from "@tabler/icons-react";
import { PRIMARY_GOLD, PRIMARY_BROWN } from "../../../../utils/constants"   ; // Adjust path as needed

/**
 * A reusable site footer.
 */
export default function HomepageFooter() {
  return (
    <Box
      component="footer"
      style={{
        borderTop: "1px solid #dee2e6",
        backgroundColor: "white",
      }}
    >
      <Container size="xl" py="xl">
        <Grid gutter="xl">
          <Grid.Col span={12} md={4}>
            <Group spacing="xs" mb="md">
              <ThemeIcon
                size={36}
                radius="xl"
                variant="gradient"
                gradient={{ from: PRIMARY_GOLD, to: PRIMARY_BROWN }}
              >
                <IconGavel size={20} />
              </ThemeIcon>
              <Title order={3}>
                <Text span fw={700} style={{ color: PRIMARY_GOLD }}>
                  Just
                </Text>
                <Text span fw={700} style={{ color: PRIMARY_BROWN }}>
                  Reach
                </Text>
              </Title>
            </Group>
            <Text c="dimmed" size="sm" mb="md">
              Accessible Legal Services Network bridging the justice gap for
              Filipino communities nationwide.
            </Text>
            <Text c="dimmed" size="xs">
              Supporting SDG 16: Peace, Justice, and Strong Institutions
            </Text>
          </Grid.Col>

          <Grid.Col span={6} md={2}>
            <Text fw={600} mb="md">
              Platform
            </Text>
            <Stack spacing="xs">
              <Text size="sm" c="dimmed" style={{ cursor: "pointer" }}>
                Features
              </Text>
              <Text size="sm" c="dimmed" style={{ cursor: "pointer" }}>
                How It Works
              </Text>
              <Text size="sm" c="dimmed" style={{ cursor: "pointer" }}>
                Pricing
              </Text>
              <Text size="sm" c="dimmed" style={{ cursor: "pointer" }}>
                FAQ
              </Text>
            </Stack>
          </Grid.Col>

          <Grid.Col span={6} md={2}>
            <Text fw={600} mb="md">
              Resources
            </Text>
            <Stack spacing="xs">
              <Text size="sm" c="dimmed" style={{ cursor: "pointer" }}>
                Legal Guide
              </Text>
              <Text size="sm" c="dimmed" style={{ cursor: "pointer" }}>
                Blog
              </Text>
              <Text size="sm" c="dimmed" style={{ cursor: "pointer" }}>
                Case Studies
              </Text>
              <Text size="sm" c="dimmed" style={{ cursor: "pointer" }}>
                Help Center
              </Text>
            </Stack>
          </Grid.Col>

          <Grid.Col span={6} md={2}>
            <Text fw={600} mb="md">
              Company
            </Text>
            <Stack spacing="xs">
              <Text size="sm" c="dimmed" style={{ cursor: "pointer" }}>
                About Us
              </Text>
              <Text size="sm" c="dimmed" style={{ cursor: "pointer" }}>
                Contact
              </Text>
              <Text size="sm" c="dimmed" style={{ cursor: "pointer" }}>
                Careers
              </Text>
              <Text size="sm" c="dimmed" style={{ cursor: "pointer" }}>
                Partners
              </Text>
            </Stack>
          </Grid.Col>

          <Grid.Col span={6} md={2}>
            <Text fw={600} mb="md">
              Legal
            </Text>
            <Stack spacing="xs">
              <Text size="sm" c="dimmed" style={{ cursor: "pointer" }}>
                Privacy Policy
              </Text>
              <Text size="sm" c="dimmed" style={{ cursor: "pointer" }}>
                Terms of Service
              </Text>
              <Text size="sm" c="dimmed" style={{ cursor: "pointer" }}>
                Cookie Policy
              </Text>
              <Text size="sm" c="dimmed" style={{ cursor: "pointer" }}>
                Compliance
              </Text>
            </Stack>
          </Grid.Col>
        </Grid>

        <Divider my="xl" />

        <Group position="apart">
          <Text c="dimmed" size="xs">
            © 2025 JUSTREACH. A Capstone Project by Nagallo, Ortiz, Pis-an &
            Sible
          </Text>
          <Text c="dimmed" size="xs">
            Technological University of the Philippines - Taguig
          </Text>
        </Group>
      </Container>
    </Box>
  );
}
