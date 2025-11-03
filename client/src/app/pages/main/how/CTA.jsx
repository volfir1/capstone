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

export default function CTASection() {
  return (
    <Container size="xl" py={rem(80)}>
      <Stack align="center" spacing="xl">
        <Title order={2} ta="center">
          Ready to Get Started?
        </Title>
        <Text c="dimmed" ta="center" size="lg" maw={600}>
          Join thousands of Filipinos accessing justice through JUSTREACH. 
          Create your account in minutes and take the first step toward resolving 
          your legal concerns.
        </Text>
        <Group>
          <Button
            size="lg"
            radius="xl"
            variant="gradient"
            gradient={{ from: PRIMARY_GOLD, to: PRIMARY_BROWN }}
          >
            Create Free Account
          </Button>
          <Button
            size="lg"
            radius="xl"
            variant="outline"
            color={PRIMARY_BROWN}
          >
            Download Guide
          </Button>
        </Group>
        <Group spacing={5}>
          <Text size="sm" c="dimmed">Already have an account?</Text>
          <Text
            size="sm"
            fw={600}
            variant="gradient"
            gradient={{ from: PRIMARY_GOLD, to: PRIMARY_BROWN }}
            style={{ cursor: 'pointer' }}
          >
            Log in here
          </Text>
        </Group>
      </Stack>
    </Container>
  );
}