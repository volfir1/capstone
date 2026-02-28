import {
  Title,
  Text,
  Container,
  SimpleGrid,
  ThemeIcon,
  Box,
  Stack,
  Badge,
  Card,
  rem,
} from "@mantine/core";
import { useWindowScroll } from "@mantine/hooks";
import {
  IconLanguage,
  IconUsers,
  IconFileSearch,
  IconFileDigit,
  IconWifiOff,
  IconClipboardCheck,
} from "@tabler/icons-react";
import { PRIMARY_GOLD, PRIMARY_BROWN } from "../../../../utils/constants"; // Adjust path if needed

export default function Features() {
  const [scroll] = useWindowScroll();

  const featuresData = [
    {
      icon: IconLanguage,
      title: "Multilingual & Accessible",
      description:
        "Access legal forms and guidance in English, Filipino, and major regional languages. Designed for all educational levels with intuitive, user-friendly interfaces.",
    },
    {
      icon: IconUsers,
      title: "Connect with Legal Aid Lawyers",
      description:
        "Schedule remote consultations with verified legal aid volunteer lawyers, optimized for low-bandwidth areas across rural Philippines.",
    },
    {
      icon: IconClipboardCheck,
      title: "Guided Legal Requirements",
      description:
        "Get clear, structured guidance on requirements and next steps based on your report details and standard legal aid procedures.",
    },
    {
      icon: IconFileSearch,
      title: "Secure Case Tracking",
      description:
        "Monitor your case status in real-time through our secure platform. Receive simplified case information and regular status updates.",
    },
    {
      icon: IconFileDigit,
      title: "Digital Document Submission",
      description:
        "Safely digitize and submit legal documents with certified e-submission requiring validation through license number and signature.",
    },
    {
      icon: IconWifiOff,
      title: "Offline-Capable Platform",
      description:
        "Access core features including legal forms and case tracking even without stable internet—built specifically for rural connectivity challenges.",
    },
  ];

  return (
    <Box
      style={{
        position: 'relative',
        backgroundColor: 'white',
        transform: `translateY(${(scroll.y - 800) * 0.1}px)`,
        transition: 'transform 0.2s ease-out' 
      }}
    >
      <Container size="xl" py={rem(100)}>
        <Stack spacing="xl" mb={60}>
          <Badge
            size="lg"
            radius="xl"
            variant="gradient"
            gradient={{ from: PRIMARY_GOLD, to: PRIMARY_BROWN }}
            style={{ margin: "0 auto" }}
          >
            Platform Features
          </Badge>

          <Title order={2} ta="center" maw={700} mx="auto">
            Comprehensive Legal Services Designed for Filipino Communities
          </Title>

          <Text c="dimmed" ta="center" size="lg" maw={700} mx="auto">
            JUSTREACH combines technology and legal expertise to overcome
            traditional barriers to justice—cost, distance, language, and
            complexity.
          </Text>
        </Stack>

        <SimpleGrid
          cols={3}
          spacing={30}
          breakpoints={[
            { maxWidth: "md", cols: 2 },
            { maxWidth: "sm", cols: 1 },
          ]}
        >
          {featuresData.map((feature) => (
            <Card
              key={feature.title}
              shadow="sm"
              p="xl"
              radius="xl"
              withBorder
              style={{
                transition: "all 0.3s ease",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-8px)";
                e.currentTarget.style.boxShadow =
                  "0 20px 40px rgba(196, 171, 125, 0.2)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "";
              }}
            >
              <ThemeIcon
                size={60}
                radius="xl"
                variant="gradient"
                gradient={{ from: PRIMARY_GOLD, to: PRIMARY_BROWN }}
                mb="md"
              >
                <feature.icon size={30} stroke={1.5} />
              </ThemeIcon>

              <Title order={4} fw={600} mb="sm">
                {feature.title}
              </Title>

              <Text size="sm" c="dimmed" lh={1.7}>
                {feature.description}
              </Text>
            </Card>
          ))}
        </SimpleGrid>
      </Container>
    </Box>
  );
}