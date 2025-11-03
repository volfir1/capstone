import {
  Title,
  Text,
  Container,
  Grid,
  ThemeIcon,
  Group,
  Box,
  Stack,
  Badge,
  Card,
  rem,
} from "@mantine/core";
import {
  IconReport,
  IconBrain,
  IconMessageCircle,
  IconProgressCheck,
} from "@tabler/icons-react";
import { PRIMARY_GOLD, PRIMARY_BROWN } from "../../../../utils/constants"; // Adjust path as needed

export default function WorkflowSection() {
  const steps = [
    {
      icon: IconReport,
      title: "File Your Legal Report",
      description:
        "Start by documenting your legal concern through our barangay-level integrated blotter reporting system. The platform guides you through each required field.",
    },
    {
      icon: IconBrain,
      title: "Get AI Recommendations",
      description:
        "Our intelligent system analyzes your case and suggests applicable laws, identifies potential exemptions, and assesses the severity of your situation.",
    },
    {
      icon: IconMessageCircle,
      title: "Connect with a Lawyer",
      description:
        "Based on your case details, you'll be matched with a qualified PAO volunteer lawyer. Schedule a consultation at your convenience via video or audio call.",
    },
    {
      icon: IconProgressCheck,
      title: "Track Case Progress",
      description:
        "Monitor your case status in real-time through our secure platform. Receive notifications for important updates and access all your legal documents anytime.",
    },
  ];

  return (
    <Container size="xl" py={rem(100)}>
      <Stack spacing="xl" mb={60}>
        <Badge
          size="lg"
          radius="xl"
          variant="gradient"
          gradient={{ from: PRIMARY_GOLD, to: PRIMARY_BROWN }}
          style={{ margin: "0 auto" }}
        >
          How It Works
        </Badge>

        <Title order={2} ta="center">
          Simple Four-Step Process
        </Title>
      </Stack>

      <Grid gutter={40}>
        {steps.map((step, index) => (
          <Grid.Col key={step.title} span={12} md={6}>
            <Card
              shadow="sm"
              p="xl"
              radius="xl"
              withBorder
              style={{ height: "100%" }}
            >
              <Group align="flex-start" spacing="xl">
                <Stack align="center" spacing="xs">
                  <Badge
                    size="xl"
                    radius="xl"
                    variant="gradient"
                    gradient={{ from: PRIMARY_GOLD, to: PRIMARY_BROWN }}
                  >
                    {index + 1}
                  </Badge>
                  <ThemeIcon
                    size={60}
                    radius="xl"
                    style={{ backgroundColor: `${PRIMARY_GOLD}20`, color: PRIMARY_BROWN }}
                  >
                    <step.icon size={30} stroke={1.5} />
                  </ThemeIcon>
                </Stack>

                <Box style={{ flex: 1 }}>
                  <Title order={4} mb="sm">
                    {step.title}
                  </Title>
                  <Text c="dimmed" size="sm" lh={1.7}>
                    {step.description}
                  </Text>
                </Box>
              </Group>
            </Card>
          </Grid.Col>
        ))}
      </Grid>
    </Container>
  );
}