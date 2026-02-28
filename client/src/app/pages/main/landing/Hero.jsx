import {
  Title,
  Text,
  Button,
  Container,
  Grid,
  Paper,
  ThemeIcon,
  Group,
  Box,
  Stack,
  Badge,
  rem,
  Center,
} from "@mantine/core";
import { IconScale, IconCheck, IconRobot } from "@tabler/icons-react";
import { PRIMARY_GOLD, PRIMARY_BROWN } from "../../../../utils/constants"; // Adjust path if needed
import { useNavigate } from "react-router";

export default function Hero() {
  const navigate = useNavigate();
    
  return (
    <Box
      style={{
        position: 'relative',
        overflow: 'hidden',
        minHeight: '100vh',
        backgroundImage: 'url(https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1920&q=80)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      {/* Overlay */}
      <Box
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 0,
        }}
      />

      {/* Content */}
      <Container size="xl" py={rem(100)} style={{ position: 'relative', zIndex: 1 }}>
        <Grid gutter={50} align="center">
          <Grid.Col span={12} md={6}>
            <Badge
              size="lg"
              radius="xl"
              variant="gradient"
              gradient={{ from: PRIMARY_GOLD, to: PRIMARY_BROWN }}
              mb="md"
            >
              Supporting SDG 16: Peace, Justice & Strong Institutions
            </Badge>

            <Title
              order={1}
              style={{
                fontSize: rem(52),
                fontWeight: 800,
                lineHeight: 1.1,
                marginBottom: rem(24),
                color: "white",
              }}
            >
              Bridging the Justice Gap for{" "}
              <Text
                span
                variant="gradient"
                gradient={{ from: PRIMARY_GOLD, to: PRIMARY_BROWN }}
                inherit
              >
                Rural Filipinos
              </Text>
            </Title>

            <Text size="lg" lh={1.7} c="white" mb="xl" maw={550}>
              JUSTREACH brings legal services directly to underserved
              communities across the Philippines. Access multilingual legal
              guidance, connect with PAO lawyers, and track your case
              progress—all from your mobile device, even with limited internet
              connectivity.
            </Text>

            <Group spacing="md">
              <Button
                size="lg"
                radius="xl"
                variant="gradient"
                gradient={{ from: PRIMARY_GOLD, to: PRIMARY_BROWN }}
                onClick={() => navigate('/appointment')}
              >
                Get Legal Assistance
              </Button>
              
            </Group>

            <Group spacing={40} mt={40}>
              <Box>
                <Text size="xl" fw={700} c={PRIMARY_GOLD}>
                  50K+
                </Text>
                <Text size="sm" c="white">
                  Users Served
                </Text>
              </Box>
              <Box>
                <Text size="xl" fw={700} c={PRIMARY_GOLD}>
                  24/7
                </Text>
                <Text size="sm" c="white">
                  Platform Access
                </Text>
              </Box>
              <Box>
                <Text size="xl" fw={700} c={PRIMARY_GOLD}>
                  3+
                </Text>
                <Text size="sm" c="white">
                  Languages
                </Text>
              </Box>
            </Group>
          </Grid.Col>

          <Grid.Col span={12} md={6}>
            <Paper
              shadow="xl"
              p={40}
              radius="xl"
              style={{
                background: `linear-gradient(135deg, ${PRIMARY_GOLD} 0%, ${PRIMARY_BROWN} 100%)`,
              }}
            >
              <Stack spacing="xl">
                <ThemeIcon
                  size={100}
                  radius="xl"
                  variant="white"
                  color={PRIMARY_GOLD}
                  style={{ margin: "0 auto" }}
                >
                  <IconScale size={60} stroke={1.5} />
                </ThemeIcon>

                <Text c="white" ta="center" size="xl" fw={600} lh={1.6}>
                  Making Justice Accessible to Every Filipino Community
                </Text>

                <Center>
                  <Group spacing="lg">
                    <Group spacing="xs">
                      <ThemeIcon
                        color="white"
                        variant="light"
                        radius="xl"
                        size="sm"
                      >
                        <IconCheck size={14} />
                      </ThemeIcon>
                      <Text c="white" size="sm">
                        Free Legal Consultations
                      </Text>
                    </Group>
                    <Group spacing="xs">
                      <ThemeIcon
                        color="white"
                        variant="light"
                        radius="xl"
                        size="sm"
                      >
                        <IconCheck size={14} />
                      </ThemeIcon>
                      <Text c="white" size="sm">
                        Multilingual Platform Support
                      </Text>
                    </Group>
                    <Group spacing="xs">
                      <ThemeIcon
                        color="white"
                        variant="light"
                        radius="xl"
                        size="sm"
                      >
                        <IconCheck size={14} />
                      </ThemeIcon>
                      <Text c="white" size="sm">
                        Offline-Capable Technology
                      </Text>
                    </Group>
                  </Group>
                </Center>
              </Stack>
            </Paper>
          </Grid.Col>
        </Grid>
      </Container>
    </Box>
  );
}