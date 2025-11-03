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
  Divider,
  Group,
  rem,
} from "@mantine/core";
import {
  IconClipboardCheck,
  IconPhone,
  IconUserCheck,
  IconCheck,
} from "@tabler/icons-react";
import { PRIMARY_GOLD, PRIMARY_BROWN, THEMED_LIGHT_BG } from "../../../../utils/constants"; // Adjust path as needed

export default function UserTypes() {
  const userTypes = [
    {
      icon: IconClipboardCheck,
      title: "For Citizens",
      description: "File reports, track cases, and connect with lawyers—all from your mobile device.",
      benefits: [
        "Free legal consultations",
        "Easy-to-understand guidance",
        "24/7 platform access"
      ]
    },
    {
      icon: IconPhone,
      title: "For Barangay Officials",
      description: "Efficiently manage blotter reports and facilitate legal service connections.",
      benefits: [
        "Digital blotter system",
        "Report management tools",
        "Community service tracking"
      ]
    },
    {
      icon: IconUserCheck,
      title: "For PAO Lawyers",
      description: "Streamline consultations and case management with organized digital tools.",
      benefits: [
        "Client management dashboard",
        "Remote consultation tools",
        "Automated case assignments"
      ]
    },
  ];

  return (
    <Box style={{ backgroundColor: THEMED_LIGHT_BG }}>
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
            For Everyone
          </Badge>
          
          <Title order={2} ta="center">
            Built for All Stakeholders
          </Title>
          
          <Text c="dimmed" ta="center" size="lg" maw={700} mx="auto">
            JUSTREACH serves multiple user types with tailored features for each role 
            in the legal assistance ecosystem.
          </Text>
        </Stack>

        <SimpleGrid
          cols={3}
          spacing={30}
          breakpoints={[
            { maxWidth: "md", cols: 1 },
          ]}
        >
          {userTypes.map((type) => (
            <Card
              key={type.title}
              shadow="md"
              p="xl"
              radius="xl"
              withBorder
              style={{
                transition: "all 0.3s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-8px)";
                e.currentTarget.style.boxShadow = "0 20px 40px rgba(139, 69, 19, 0.15)";
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
                  style={{ 
                    backgroundColor: `${PRIMARY_GOLD}20`, 
                    color: PRIMARY_BROWN 
                  }}
                >
                  <type.icon size={35} stroke={1.5} />
                </ThemeIcon>

                <Box>
                  <Title order={4} mb="sm">{type.title}</Title>
                  <Text c="dimmed" size="sm" lh={1.7} mb="md">
                    {type.description}
                  </Text>
                </Box>

                <Divider />

                <Stack spacing="xs">
                  {type.benefits.map((benefit) => (
                    <Group key={benefit} spacing="xs">
                      <ThemeIcon
                        size={18}
                        radius="xl"
                        style={{ 
                          backgroundColor: `${PRIMARY_GOLD}20`, 
                          color: PRIMARY_BROWN 
                        }}
                      >
                        <IconCheck size={10} />
                      </ThemeIcon>
                      <Text size="sm" c="dimmed">{benefit}</Text>
                    </Group>
                  ))}
                </Stack>
              </Stack>
            </Card>
          ))}
        </SimpleGrid>
      </Container>
    </Box>
  );
}