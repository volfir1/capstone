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
  IconLanguage,
  IconUsers,
  IconBrain,
  IconFileSearch,
  IconFileDigit,
  IconWifiOff,
  IconCheck,
} from "@tabler/icons-react";
import { PRIMARY_GOLD, PRIMARY_BROWN, MUTED_OLIVE } from "../../../../utils/constants"; // Adjust path as needed

export default function CoreFeatures() {
  const features = [
    {
      icon: IconLanguage,
      title: "Multilingual Support",
      description:
        "Access legal forms and guidance in English, Filipino, and major regional languages including Cebuano, Ilocano, and Hiligaynon.",
      highlights: [
        "Automatic language detection",
        "Easy language switching",
        "Culturally appropriate translations",
        "Accessible to all education levels",
      ],
      color: PRIMARY_GOLD,
    },
    {
      icon: IconUsers,
      title: "PAO Lawyer Consultations",
      description:
        "Connect with verified volunteer lawyers from the Public Attorney's Office for professional legal advice and representation.",
      highlights: [
        "Video and audio consultations",
        "Optimized for low bandwidth",
        "Scheduled appointments",
        "Free legal assistance",
      ],
      color: PRIMARY_BROWN,
    },
    {
      icon: IconBrain,
      title: "AI-Powered Legal Assistance",
      description:
        "Intelligent system that analyzes your case and provides relevant legal recommendations based on Philippine law.",
      highlights: [
        "Law applicability suggestions",
        "Legal exemption identification",
        "Case severity assessment",
        "PAO-validated recommendations",
      ],
      color: MUTED_OLIVE,
    },
    {
      icon: IconFileSearch,
      title: "Real-Time Case Tracking",
      description:
        "Monitor your legal case progress with live updates and simplified case information through a secure platform.",
      highlights: [
        "Live status updates",
        "Case timeline visualization",
        "Document history",
        "Notification alerts",
      ],
      color: PRIMARY_GOLD,
    },
    {
      icon: IconFileDigit,
      title: "Digital Document Processing",
      description:
        "Securely digitize, store, and submit legal documents with certified e-submission requiring professional validation.",
      highlights: [
        "Document scanning and upload",
        "Certified e-submission",
        "License number validation",
        "Digital signature support",
      ],
      color: PRIMARY_BROWN,
    },
    {
      icon: IconWifiOff,
      title: "Offline Functionality",
      description:
        "Access essential features even without internet connection, designed specifically for rural areas with limited connectivity.",
      highlights: [
        "Offline form access",
        "Local data storage",
        "Auto-sync when online",
        "Reliable rural operation",
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
        cols={2}
        spacing={30}
        breakpoints={[{ maxWidth: "md", cols: 1 }]}
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