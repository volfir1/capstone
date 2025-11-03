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
  IconMessageCircle,
  IconProgressCheck,
  IconBrain,
  IconCheck,
} from "@tabler/icons-react";
import { PRIMARY_GOLD, PRIMARY_BROWN, MUTED_OLIVE } from "../../../../utils/constants"; // Adjust path as needed

export default function MainStepsSection() {
  const mainSteps = [
    {
      number: "01",
      icon: IconReport,
      title: "File Your Legal Report",
      description: "Begin your journey by documenting your legal concern through our integrated barangay-level blotter reporting system.",
      details: [
        "Choose your preferred language (English, Filipino, or regional)",
        "Fill out guided forms with easy-to-understand questions",
        "Attach supporting documents or photos if available",
        "Submit directly to your local barangay for official recording"
      ],
      color: PRIMARY_BROWN,
    },
    {
      number: "02",
      icon: IconBrain,
      title: "Receive AI-Powered Guidance",
      description: "Our intelligent system analyzes your case and provides instant legal insights based on Philippine law.",
      details: [
        "Get suggestions for applicable laws relevant to your case",
        "Identify potential legal exemptions you may qualify for",
        "Understand case severity assessment",
        "Review preliminary recommendations validated by PAO procedures"
      ],
      color: PRIMARY_GOLD,
    },
    {
      number: "03",
      icon: IconMessageCircle,
      title: "Connect with a PAO Lawyer",
      description: "Schedule a consultation with a verified volunteer lawyer from the Public Attorney's Office.",
      details: [
        "Get matched with a lawyer specializing in your case type",
        "Choose between video or audio consultation",
        "Schedule at a time convenient for you",
        "Access consultations optimized for low-bandwidth connections"
      ],
      color: MUTED_OLIVE,
    },
    {
      number: "04",
      icon: IconProgressCheck,
      title: "Track Your Case Progress",
      description: "Monitor your legal case in real-time through our secure platform with regular updates and notifications.",
      details: [
        "View case status and timeline at any time",
        "Receive push notifications for important updates",
        "Access all your documents in one secure location",
        "Communicate directly with your assigned lawyer"
      ],
      color: PRIMARY_BROWN,
    },
  ];

  return (
    <Container size="xl" py={rem(100)}>
      <Stack spacing="xl" mb={60}>
        <Badge
          size="lg"
          radius="xl"
          style={{ 
            margin: '0 auto',
            backgroundColor: `${PRIMARY_GOLD}20`, 
            color: PRIMARY_BROWN 
          }}
        >
          Main Process
        </Badge>
        
        <Title order={2} ta="center">
          Four Steps to Justice
        </Title>
        
        <Text c="dimmed" ta="center" size="lg" maw={700} mx="auto">
          Our streamlined process makes legal assistance accessible to everyone, 
          regardless of location or technical expertise.
        </Text>
      </Stack>

      <Stack spacing={40}>
        {mainSteps.map((step, index) => (
          <Card
            key={step.title}
            shadow="md"
            p="xl"
            radius="xl"
            withBorder
            style={{
              transition: "all 0.3s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateX(10px)";
              e.currentTarget.style.boxShadow = `0 20px 40px ${step.color}20`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateX(0)";
              e.currentTarget.style.boxShadow = "";
            }}
          >
            <Grid align="center" gutter="xl">
              <Grid.Col span={12} md={3}>
                <Stack align="center" spacing="md">
                  <Text
                    size={rem(80)}
                    fw={900}
                    variant="gradient"
                    gradient={{ from: step.color, to: step.color === PRIMARY_GOLD ? PRIMARY_BROWN : PRIMARY_GOLD }}
                    style={{ lineHeight: 1 }}
                  >
                    {step.number}
                  </Text>
                  
                  <ThemeIcon
                    size={80}
                    radius="xl"
                    variant="gradient"
                    gradient={{ from: step.color, to: step.color === PRIMARY_GOLD ? PRIMARY_BROWN : PRIMARY_GOLD }}
                  >
                    <step.icon size={45} stroke={1.5} />
                  </ThemeIcon>
                </Stack>
              </Grid.Col>

              <Grid.Col span={12} md={9}>
                <Stack spacing="md">
                  <Box>
                    <Title order={3} mb="sm">{step.title}</Title>
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
                            color: PRIMARY_BROWN 
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