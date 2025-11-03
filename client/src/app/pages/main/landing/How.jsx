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
  IconFileSearch,
  IconUsers,
  IconShieldCheck,
  IconGavel,
} from "@tabler/icons-react";
import { PRIMARY_GOLD, PRIMARY_BROWN } from "../../../../utils/constants"; // Adjust path if needed

export default function HowItWorks() {
  const [scroll] = useWindowScroll();

  const steps = [
    {
      icon: IconFileSearch,
      title: "File Your Report",
      description:
        "Start by reporting your legal concern through our integrated barangay-level blotter system—your first step to accessing justice.",
    },
    {
      icon: IconUsers,
      title: "Connect & Consult",
      description:
        "Get matched with a verified PAO volunteer lawyer based on your case type. Schedule a remote consultation at your convenience.",
    },
    {
      icon: IconShieldCheck,
      title: "Track Progress",
      description:
        "Monitor your case through our secure platform with real-time updates, transparent status information, and direct communication.",
    },
    {
      icon: IconGavel,
      title: "Receive Resolution",
      description:
        "Access AI-powered guidance suggesting applicable laws and resources while your lawyer works toward resolving your case.",
    },
  ];

  return (
    <Box 
      style={{ 
        backgroundColor: "#f8f9fa",
        transform: `translateY(${(scroll.y - 1600) * 0.15}px)`,
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
            Simple Process
          </Badge>

          <Title order={2} ta="center">
            Get Justice in 4 Simple Steps
          </Title>

          <Text c="dimmed" ta="center" size="lg" maw={600} mx="auto">
            We've streamlined the legal assistance process to make it
            accessible, transparent, and efficient for everyone.
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
          {steps.map((step, index) => (
            <Card key={step.title} shadow="sm" p="xl" radius="xl" withBorder>
              <Stack align="center" spacing="md">
                <Badge
                  size="xl"
                  radius="xl"
                  variant="gradient"
                  gradient={{ from: PRIMARY_GOLD, to: PRIMARY_BROWN }}
                >
                  Step {index + 1}
                </Badge>

                <ThemeIcon 
                  size={70} 
                  radius="xl" 
                  variant="light" 
                  style={{ backgroundColor: `${PRIMARY_GOLD}20`, color: PRIMARY_BROWN }}
                >
                  <step.icon size={35} stroke={1.5} />
                </ThemeIcon>

                <Title order={4} ta="center" fw={600}>
                  {step.title}
                </Title>

                <Text size="sm" c="dimmed" ta="center" lh={1.6}>
                  {step.description}
                </Text>
              </Stack>
            </Card>
          ))}
        </SimpleGrid>
      </Container>
    </Box>
  );
}