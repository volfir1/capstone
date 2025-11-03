import {
  Title,
  Text,
  Container,
  Grid,
  Paper,
  ThemeIcon,
  Box,
  Stack,
  Badge,
  rem,
} from "@mantine/core";
import {
  IconDeviceMobile,
  IconCloud,
  IconChartBar,
} from "@tabler/icons-react";
import { PRIMARY_GOLD, PRIMARY_BROWN, MUTED_OLIVE } from "../../../../utils/constants"; // Adjust path as needed

export default function TechnicalFeatures() {
  return (
    <Box style={{ backgroundColor: "#f8f9fa" }}>
      <Container size="xl" py={rem(100)}>
        <Stack spacing="xl" mb={60}>
          <Badge
            size="lg"
            radius="xl"
            variant="gradient"
            gradient={{ from: PRIMARY_GOLD, to: PRIMARY_BROWN }}
            style={{ margin: "0 auto" }}
          >
            Technical Excellence
          </Badge>

          <Title order={2} ta="center">
            Built with Modern Technology
          </Title>
        </Stack>

        <Grid gutter={40}>
          <Grid.Col span={12} md={4}>
            <Paper p="xl" radius="xl" withBorder style={{ height: "100%" }}>
              <ThemeIcon
                size={60}
                radius="xl"
                variant="gradient"
                gradient={{ from: PRIMARY_GOLD, to: PRIMARY_BROWN }}
                mb="md"
              >
                <IconDeviceMobile size={30} stroke={1.5} />
              </ThemeIcon>
              <Title order={4} mb="sm">
                Mobile-First Design
              </Title>
              <Text c="dimmed" size="sm" lh={1.7}>
                Responsive design optimized for smartphones and tablets,
                ensuring accessibility on any device with any screen size.
              </Text>
            </Paper>
          </Grid.Col>

          <Grid.Col span={12} md={4}>
            <Paper p="xl" radius="xl" withBorder style={{ height: "100%" }}>
              <ThemeIcon
                size={60}
                radius="xl"
                style={{ backgroundColor: `${PRIMARY_GOLD}20`, color: PRIMARY_BROWN }}
                mb="md"
              >
                <IconCloud size={30} stroke={1.5} />
              </ThemeIcon>
              <Title order={4} mb="sm">
                Cloud Integration
              </Title>
              <Text c="dimmed" size="sm" lh={1.7}>
                Seamless synchronization across devices with cloud backup,
                ensuring your data is always accessible and secure.
              </Text>
            </Paper>
          </Grid.Col>

          <Grid.Col span={12} md={4}>
            <Paper p="xl" radius="xl" withBorder style={{ height: "100%" }}>
              <ThemeIcon
                size={60}
                radius="xl"
                variant="gradient"
                gradient={{ from: MUTED_OLIVE, to: PRIMARY_BROWN }}
                mb="md"
              >
                <IconChartBar size={30} stroke={1.5} />
              </ThemeIcon>
              <Title order={4} mb="sm">
                Analytics Dashboard
              </Title>
              <Text c="dimmed" size="sm" lh={1.7}>
                Comprehensive analytics for administrators to track system
                usage, identify trends, and improve service delivery.
              </Text>
            </Paper>
          </Grid.Col>
        </Grid>
      </Container>
    </Box>
  );
}