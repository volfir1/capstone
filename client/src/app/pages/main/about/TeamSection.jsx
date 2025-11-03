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
  Avatar,
  rem,
} from "@mantine/core";
import {
  IconBrandLinkedin,
  IconBrandGithub,
  IconMail,
} from "@tabler/icons-react";
import {
  PRIMARY_GOLD,
  PRIMARY_BROWN,
  MUTED_OLIVE,
  ACCENT_TAN,
} from "../../../../utils/constants"; // Adjust path as needed

export default function TeamSection() {
  const teamMembers = [
    {
      name: "John Leonard O. Nagallo",
      role: "Lead Developer & Project Manager",
      description:
        "Specializes in full-stack development and system architecture. Passionate about using technology to solve social issues.",
      avatar: "JN",
      color: PRIMARY_GOLD,
    },
    {
      name: "Gwyneth Selwyn Zoe G. Ortiz",
      role: "UI/UX Designer & Frontend Developer",
      description:
        "Focuses on creating accessible and intuitive user interfaces. Advocates for inclusive design principles.",
      avatar: "GO",
      color: PRIMARY_BROWN,
    },
    {
      name: "Jade C. Pis-an",
      role: "Backend Developer & AI Specialist",
      description:
        "Develops AI/ML models for legal recommendations. Ensures data security and system reliability.",
      avatar: "JP",
      color: MUTED_OLIVE,
    },
    {
      name: "Lester I. Sible",
      role: "Database Administrator & Research Lead",
      description:
        "Manages data infrastructure and conducts user research. Bridges technical solutions with community needs.",
      avatar: "LS",
      color: ACCENT_TAN,
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
          Meet the Team
        </Badge>

        <Title order={2} ta="center">
          The Minds Behind JUSTREACH
        </Title>

        <Text c="dimmed" ta="center" size="lg" maw={700} mx="auto">
          A dedicated team of IT students from Technological University of the
          Philippines - Taguig, committed to making a difference through
          technology and innovation.
        </Text>
      </Stack>

      <SimpleGrid
        cols={2}
        spacing={30}
        breakpoints={[{ maxWidth: "md", cols: 1 }]}
      >
        {teamMembers.map((member) => (
          <Card
            key={member.name}
            shadow="md"
            p="xl"
            radius="xl"
            withBorder
            style={{
              transition: "all 0.3s ease",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-8px)";
              e.currentTarget.style.boxShadow = `0 20px 40px ${member.color}30`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "";
            }}
          >
            <Stack spacing="md">
              <Group>
                <Avatar
                  size={80}
                  radius="xl"
                  variant="gradient"
                  gradient={{ from: member.color, to: PRIMARY_BROWN }}
                  style={{
                    fontSize: rem(28),
                    fontWeight: 700,
                  }}
                >
                  {member.avatar}
                </Avatar>

                <Box style={{ flex: 1 }}>
                  <Title order={4} mb={4}>
                    {member.name}
                  </Title>
                  <Badge
                    size="md"
                    radius="xl"
                    style={{ backgroundColor: `${member.color}20`, color: PRIMARY_BROWN }}
                  >
                    {member.role}
                  </Badge>
                </Box>
              </Group>

              <Text c="dimmed" size="sm" lh={1.6}>
                {member.description}
              </Text>

              <Group spacing="xs">
                <ThemeIcon
                  size={32}
                  radius="xl"
                  style={{ backgroundColor: `${PRIMARY_GOLD}20`, color: PRIMARY_BROWN }}
                  sx={{ cursor: "pointer" }}
                >
                  <IconBrandLinkedin size={18} />
                </ThemeIcon>
                <ThemeIcon
                  size={32}
                  radius="xl"
                  style={{ backgroundColor: `${PRIMARY_GOLD}20`, color: PRIMARY_BROWN }}
                  sx={{ cursor: "pointer" }}
                >
                  <IconBrandGithub size={18} />
                </ThemeIcon>
                <ThemeIcon
                  size={32}
                  radius="xl"
                  style={{ backgroundColor: `${PRIMARY_GOLD}20`, color: PRIMARY_BROWN }}
                  sx={{ cursor: "pointer" }}
                >
                  <IconMail size={18} />
                </ThemeIcon>
              </Group>
            </Stack>
          </Card>
        ))}
      </SimpleGrid>
    </Container>
  );
}
