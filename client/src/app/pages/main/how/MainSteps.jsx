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
  IconUserCheck,
  IconReport,
  IconCalendarEvent,
  IconProgressCheck,
  IconCheck,
} from "@tabler/icons-react";
import { PRIMARY_GOLD, PRIMARY_BROWN, MUTED_OLIVE } from "../../../../utils/constants"; // Adjust path as needed

export default function MainStepsSection() {
  const mainSteps = [
    {
      number: "01",
      icon: IconUserCheck,
      title: "Create Account & Choose Language",
      description:
        "Start by signing up and setting your language preference so the platform can guide you clearly through forms and next steps.",
      details: [
        "Register and verify your account",
        "Choose English/Filipino/regional language (if available)",
        "Access the guided reporting flow",
        "Your profile info can speed up future submissions",
      ],
      color: PRIMARY_BROWN,
    },
    {
      number: "02",
      icon: IconReport,
      title: "Submit Your Case Report",
      description:
        "Document your concern using the guided form and upload supporting evidence when available.",
      details: [
        "Answer structured, easy-to-follow questions",
        "Provide incident/case description and parties involved (if applicable)",
        "Attach documents/photos to support your report",
        "Submit for initial review",
      ],
      color: PRIMARY_GOLD,
    },
    {
      number: "03",
      icon: IconCalendarEvent,
      title: "System Review, Assignment & Consultation",
      description:
        "Your submission is reviewed. If qualified, a legal aid volunteer lawyer can be assigned and you can schedule a consultation.",
      details: [
        "Initial review and validation of required details",
        "Surface a checklist of requirements and recommended next steps",
        "Assignment/matching to an available legal aid volunteer lawyer",
        "Schedule a consultation (video/audio) when needed",
      ],
      color: MUTED_OLIVE,
    },
    {
      number: "04",
      icon: IconProgressCheck,
      title: "Track Status Until Completion",
      description:
        "Monitor progress with transparent status updates and notifications while keeping documents and communication in one place.",
      details: [
        "See statuses like Pending Review, Under Review, Attorney Assigned, In Progress, Completed",
        "Receive notifications for updates and requests",
        "Access case documents securely",
        "Follow through until resolution/closure",
      ],
      color: PRIMARY_BROWN,
    },
  ];

  return (
    <Container size="xl" py={rem(100)}>
      <Stack spacing={40}>
        {mainSteps.map((step) => (
          <Card
            key={step.title}
            shadow="md"
            p="xl"
            radius="xl"
            withBorder
            style={{ transition: "all 0.3s ease" }}
          >
            <Grid align="center" gutter="xl">
              <Grid.Col span={12} md={3}>
                <Stack align="center" spacing="md">
                  <Text
                    size={rem(80)}
                    fw={900}
                    variant="gradient"
                    gradient={{
                      from: step.color,
                      to:
                        step.color === PRIMARY_GOLD
                          ? PRIMARY_BROWN
                          : PRIMARY_GOLD,
                    }}
                    style={{ lineHeight: 1 }}
                  >
                    {step.number}
                  </Text>

                  <ThemeIcon
                    size={80}
                    radius="xl"
                    variant="gradient"
                    gradient={{
                      from: step.color,
                      to:
                        step.color === PRIMARY_GOLD
                          ? PRIMARY_BROWN
                          : PRIMARY_GOLD,
                    }}
                  >
                    <step.icon size={45} stroke={1.5} />
                  </ThemeIcon>
                </Stack>
              </Grid.Col>

              <Grid.Col span={12} md={9}>
                <Stack spacing="md">
                  <Box>
                    <Title order={3} mb="sm">
                      {step.title}
                    </Title>
                    <Text c="dimmed" size="md" lh={1.7}>
                      {step.description}
                    </Text>
                  </Box>

                  <Stack spacing="xs">
                    {step.details.map((detail) => (
                      <Group key={detail} spacing="xs" align="flex-start">
                        <ThemeIcon
                          size={20}
                          radius="xl"
                          style={{
                            backgroundColor: `${PRIMARY_GOLD}20`,
                            color: PRIMARY_BROWN,
                          }}
                          mt={4}
                        >
                          <IconCheck size={12} />
                        </ThemeIcon>
                        <Text size="sm" c="dimmed" style={{ flex: 1 }}>
                          {detail}
                        </Text>
                      </Group>
                    ))}
                  </Stack>
                </Stack>
              </Grid.Col>
            </Grid>
          </Card>
        ))}
      </Stack>
    </Container>
  );
}