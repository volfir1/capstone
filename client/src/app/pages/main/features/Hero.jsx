import {
  Title,
  Text,
  Button,
  Container,
  Group,
  Box,
  Stack,
  Badge,
  rem,
} from "@mantine/core";
import { useNavigate } from "react-router-dom";
import { PRIMARY_GOLD, PRIMARY_BROWN } from "../../../../utils/constants"; // Adjust path as needed

export default function HeroSection() {
  const navigate = useNavigate();

  return (
    <Box
      style={{
        background: "linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)",
      }}
    >
      <Container size="xl" py={rem(100)}>
        <Stack align="center" spacing="xl">
          <Badge
            size="lg"
            radius="xl"
            variant="gradient"
            gradient={{ from: PRIMARY_GOLD, to: PRIMARY_BROWN }}
          >
            Platform Features
          </Badge>

          <Title
            order={1}
            ta="center"
            style={{
              fontSize: rem(48),
              fontWeight: 800,
              lineHeight: 1.2,
              maxWidth: 900,
            }}
          >
            Everything You Need for{" "}
            <Text
              span
              variant="gradient"
              gradient={{ from: PRIMARY_GOLD, to: PRIMARY_BROWN }}
              inherit
            >
              Accessible Legal Services
            </Text>
          </Title>

          <Text size="lg" c="dimmed" ta="center" maw={700} lh={1.7}>
            JUSTREACH provides a comprehensive suite of features designed to
            break down barriers and make legal services accessible to every
            Filipino community.
          </Text>

          <Group spacing="md">
            <Button
              size="lg"
              radius="xl"
              variant="gradient"
              gradient={{ from: PRIMARY_GOLD, to: PRIMARY_BROWN }}
              onClick={() => navigate('/appointment#create-appointment')}
            >
              Start Using JUSTREACH
            </Button>
            <Button size="lg" radius="xl" variant="outline" color={PRIMARY_BROWN}>
              Watch Demo
            </Button>
          </Group>
        </Stack>
      </Container>
    </Box>
  );
}