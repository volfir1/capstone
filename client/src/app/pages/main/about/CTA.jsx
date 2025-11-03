import {
  Title,
  Text,
  Button,
  Container,
  Group,
  Stack,
  rem,
} from "@mantine/core";
import { PRIMARY_GOLD, PRIMARY_BROWN } from "../../../../utils/constants"; // Adjust path as needed

export default function CTA() {
  return (
    <Container size="xl" py={rem(80)}>
      <Stack align="center" spacing="xl">
        <Title order={2} ta="center">
          Join Us in Making Justice Accessible
        </Title>
        <Text c="dimmed" ta="center" size="lg" maw={600}>
          Whether you're seeking legal assistance or want to support our
          mission, we'd love to hear from you.
        </Text>
        <Group>
          <Button
            size="lg"
            radius="xl"
            variant="gradient"
            gradient={{ from: PRIMARY_GOLD, to: PRIMARY_BROWN }}
          >
            Get Started
          </Button>
          <Button size="lg" radius="xl" variant="outline" color={PRIMARY_BROWN}>
            Contact Us
          </Button>
        </Group>
      </Stack>
    </Container>
  );
}
