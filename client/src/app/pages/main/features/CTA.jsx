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
          Ready to Experience These Features?
        </Title>
        <Text c="dimmed" ta="center" size="lg" maw={600}>
          Join thousands of Filipinos accessing justice through JUSTREACH.
          Create your free account today.
        </Text>
        <Group>
          <Button
            size="lg"
            radius="xl"
            variant="gradient"
            gradient={{ from: PRIMARY_GOLD, to: PRIMARY_BROWN }}
          >
            Get Started Now
          </Button>
          <Button size="lg" radius="xl" variant="outline" color={PRIMARY_BROWN}>
            View Pricing
          </Button>
        </Group>
      </Stack>
    </Container>
  );
}