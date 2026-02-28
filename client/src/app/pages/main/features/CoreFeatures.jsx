import {
  Title,
  Text,
  Container,
  SimpleGrid,
  ThemeIcon,
  Group,
  Box,
  Stack,
  Badge,
  Card,
  rem,
} from "@mantine/core";
import {
  IconUsers,
  IconCalendarEvent,
  IconFileText,
  IconCheck,
} from "@tabler/icons-react";
import { PRIMARY_GOLD, PRIMARY_BROWN, MUTED_OLIVE } from "../../../../utils/constants"; // Adjust path as needed

export default function CoreFeatures() {
  const features = [
    {
      icon: IconUsers,
      title: "Legal Aid Lawyer Consultations",
      description:
        "Connect with verified legal aid lawyers for professional legal advice and representation.",
      highlights: [
        "Free drafting of legal documents",
        "Court representation",
        "Scheduled appointments",
        "Free legal assistance",
      ],
      color: PRIMARY_BROWN,
    },
    {
      icon: IconCalendarEvent,
      title: "Appointment Scheduling & Calendar Sync",
      description:
        "Request, track, and manage your legal aid appointments, with Google Calendar integration to help keep schedules organized.",
      highlights: [
        "Appointment request and scheduling",
        "Status-based appointment tracking",
        "Reschedule support",
        "Google Calendar event link",
      ],
      color: PRIMARY_GOLD,
    },
    {
      icon: IconFileText,
      title: "Document Upload & Case Records",
      description:
        "Upload and review supporting documents for your request, with access to case record details and downloadable files when available.",
      highlights: [
        "Word/PDF document uploads",
        "In-app PDF preview",
        "Centralized case documents",
        "Downloadable attachments",
      ],
      color: MUTED_OLIVE,
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
          Core Features
        </Badge>

        <Title order={2} ta="center">
          Powerful Tools for Legal Empowerment
        </Title>
      </Stack>

      <SimpleGrid
        cols={3}
        spacing={30}
        breakpoints={[
          { maxWidth: "lg", cols: 2 },
          { maxWidth: "md", cols: 1 },
        ]}
      >
        {features.map((feature) => (
          <Card
            key={feature.title}
            shadow="md"
            p="xl"
            radius="xl"
            withBorder
            style={{
              transition: "all 0.3s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-8px)";
              e.currentTarget.style.boxShadow = `0 20px 40px ${feature.color}30`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "";
            }}
          >
            <Stack spacing="md">
              <ThemeIcon
                size={70}
                radius="xl"
                variant="gradient"
                gradient={{ from: feature.color, to: PRIMARY_BROWN }}
              >
                <feature.icon size={35} stroke={1.5} />
              </ThemeIcon>

              <Box>
                <Title order={3} mb="sm">
                  {feature.title}
                </Title>
                <Text c="dimmed" size="sm" lh={1.7} mb="md">
                  {feature.description}
                </Text>
              </Box>

              <Stack spacing="xs">
                {feature.highlights.map((highlight) => (
                  <Group key={highlight} spacing="xs">
                    <ThemeIcon
                      size={20}
                      radius="xl"
                      style={{ backgroundColor: `${PRIMARY_GOLD}20`, color: PRIMARY_BROWN }}
                    >
                      <IconCheck size={12} />
                    </ThemeIcon>
                    <Text size="sm" c="dimmed">
                      {highlight}
                    </Text>
                  </Group>
                ))}
              </Stack>
            </Stack>
          </Card>
        ))}
      </SimpleGrid>
    </Container>
  );
}