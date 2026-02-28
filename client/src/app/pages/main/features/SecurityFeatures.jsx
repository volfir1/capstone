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
import {
  IconLock,
  IconShieldCheck,
  IconDatabase,
  IconClockHour4,
} from "@tabler/icons-react";
import { PRIMARY_GOLD, PRIMARY_BROWN } from "../../../../utils/constants"; // Adjust path as needed

export default function SecurityFeatures() {
  const securityFeatures = [
    {
      icon: IconLock,
      title: "End-to-End Encryption",
      description:
        "All communications and documents are encrypted to protect your sensitive legal information.",
    },
    {
      icon: IconShieldCheck,
      title: "Verified Lawyers",
      description:
        "All legal aid lawyers are verified and authenticated through official channels.",
    },
    {
      icon: IconDatabase,
      title: "Secure Data Storage",
      description:
        "Your data is stored in secure, compliant databases with regular backups.",
    },
    {
      icon: IconClockHour4,
      title: "Access Control",
      description:
        "Role-based permissions ensure only authorized personnel access your case.",
    },
  ];

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
            Security & Privacy
          </Badge>

          <Title order={2} ta="center">
            Your Privacy is Our Priority
          </Title>

          <Text c="dimmed" ta="center" size="lg" maw={700} mx="auto">
            We implement industry-standard security measures to ensure your
            legal information remains confidential and protected at all times.
          </Text>
        </Stack>

        <SimpleGrid
          cols={4}
          spacing={30}
          breakpoints={[
            { maxWidth: "md", cols: 2 },
            { maxWidth: "sm", cols: 1 },
          ]}
        >
          {securityFeatures.map((feature) => (
            <Card key={feature.title} shadow="sm" p="xl" radius="xl" withBorder>
              <Stack align="center" spacing="md">
                <ThemeIcon 
                  size={60} 
                  radius="xl" 
                  style={{ backgroundColor: `${PRIMARY_GOLD}20`, color: PRIMARY_BROWN }}
                >
                  <feature.icon size={30} stroke={1.5} />
                </ThemeIcon>

                <Title order={4} ta="center">
                  {feature.title}
                </Title>

                <Text size="sm" c="dimmed" ta="center" lh={1.6}>
                  {feature.description}
                </Text>
              </Stack>
            </Card>
          ))}
        </SimpleGrid>
      </Container>
    </Box>
  );
}