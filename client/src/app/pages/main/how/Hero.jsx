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
import { PRIMARY_GOLD, PRIMARY_BROWN, THEMED_LIGHT_BG } from "../../../../utils/constants"; // Adjust path as needed

export default function HeroSection() {
  return (
    <Box style={{ backgroundColor: THEMED_LIGHT_BG }}>
      <Container size="xl" py={rem(100)}>
        <Stack align="center" spacing="xl">
          <Badge
            size="lg"
            radius="xl"
            variant="gradient"
            gradient={{ from: PRIMARY_GOLD, to: PRIMARY_BROWN }}
          >
            How It Works
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
            Getting Legal Help is{" "}
            <Text
              span
              variant="gradient"
              gradient={{ from: PRIMARY_GOLD, to: PRIMARY_BROWN }}
              inherit
            >
              Simple & Straightforward
            </Text>
          </Title>

          <Text size="lg" c="dimmed" ta="center" maw={700} lh={1.7}>
            From filing your first report to resolving your legal issue, JUSTREACH
            guides you through every step with clarity and support.
          </Text>

          <Group spacing="md">
            <Button
              size="lg"
              radius="xl"
              variant="gradient"
              gradient={{ from: PRIMARY_GOLD, to: PRIMARY_BROWN }}
            >
              Start Your Journey
            </Button>
            <Button
              size="lg"
              radius="xl"
              variant="outline"
              color={PRIMARY_BROWN}
            >
              Watch Video Tutorial
            </Button>
          </Group>
        </Stack>
      </Container>
    </Box>
  );
}