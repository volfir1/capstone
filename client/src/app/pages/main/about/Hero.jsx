import {
  Title,
  Text,
  Container,
  Box,
  Stack,
  Badge,
  rem,
} from "@mantine/core";
import { PRIMARY_GOLD, PRIMARY_BROWN } from "../../../../utils/constants"; // Adjust path as needed

export default function Hero() {
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
            About JUSTREACH
          </Badge>

          <Title
            order={1}
            ta="center"
            style={{
              fontSize: rem(48),
              fontWeight: 800,
              lineHeight: 1.2,
              maxWidth: 800,
            }}
          >
            Bridging the Justice Gap Through{" "}
            <Text
              span
              variant="gradient"
              gradient={{ from: PRIMARY_GOLD, to: PRIMARY_BROWN }}
              inherit
            >
              Innovation & Empathy
            </Text>
          </Title>

          <Text size="lg" c="dimmed" ta="center" maw={700} lh={1.7}>
            JUSTREACH is a capstone project born from a commitment to make legal
            services accessible to every Filipino, regardless of location,
            income, or educational background. We're leveraging technology to
            create a more just and equitable society.
          </Text>
        </Stack>
      </Container>
    </Box>
  );
}
