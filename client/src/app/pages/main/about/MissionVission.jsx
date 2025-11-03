import {
  Title,
  Text,
  Container,
  SimpleGrid,
  ThemeIcon,
  Card,
  rem,
} from "@mantine/core";
import { IconTarget, IconHeart } from "@tabler/icons-react";
import { PRIMARY_GOLD, PRIMARY_BROWN } from "../../../../utils/constants"; // Adjust path as needed

export default function MissionVision() {
  return (
    <Container size="xl" py={rem(80)}>
      <SimpleGrid
        cols={2}
        spacing={40}
        breakpoints={[{ maxWidth: "md", cols: 1 }]}
      >
        <Card shadow="md" p="xl" radius="xl" withBorder>
          <ThemeIcon
            size={70}
            radius="xl"
            variant="gradient"
            gradient={{ from: PRIMARY_GOLD, to: PRIMARY_BROWN }}
            mb="xl"
          >
            <IconTarget size={40} stroke={1.5} />
          </ThemeIcon>

          <Title order={2} mb="md">
            Our Mission
          </Title>
          <Text c="dimmed" size="lg" lh={1.7}>
            To democratize access to legal services in the Philippines by
            creating a technology-driven platform that connects underserved
            communities with qualified legal professionals, breaking down
            barriers of cost, distance, and complexity.
          </Text>
        </Card>

        <Card shadow="md" p="xl" radius="xl" withBorder>
          <ThemeIcon
            size={70}
            radius="xl"
            style={{ backgroundColor: `${PRIMARY_GOLD}20`, color: PRIMARY_BROWN }}
            mb="xl"
          >
            <IconHeart size={40} stroke={1.5} />
          </ThemeIcon>

          <Title order={2} mb="md">
            Our Vision
          </Title>
          <Text c="dimmed" size="lg" lh={1.7}>
            A Philippines where every citizen, regardless of their socioeconomic
            status or geographic location, can exercise their legal rights and
            access justice through an inclusive, transparent, and efficient
            digital platform.
          </Text>
        </Card>
      </SimpleGrid>
    </Container>
  );
}
