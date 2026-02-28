import {
  Title,
  Text,
  Button,
  Container,
  Grid,
  Paper,
  Group,
  Badge,
  rem,
} from "@mantine/core";
import { PRIMARY_GOLD, PRIMARY_BROWN } from "../../../../utils/constants"; // Adjust path if needed

export default function CallToAction() {
  return (
    <Container size="xl" py={rem(80)}>
      <Paper
        shadow="xl"
        radius="xl"
        p={rem(60)}
        style={{
          background: `linear-gradient(135deg, ${PRIMARY_GOLD} 0%, ${PRIMARY_BROWN} 100%)`,
        }}
      >
        <Grid align="center" gutter="xl">
          <Grid.Col span={12} md={8}>
            <Title order={2} c="white" mb="md">
              Ready to Access Justice?
            </Title>
            <Text c="white" size="lg" lh={1.7} maw={650}>
              Join thousands of Filipinos who have already taken control of
              their legal rights. Create your free account today and connect
              with qualified legal professionals who understand your community's
              needs.
            </Text>
            <Group spacing="sm" mt="md">
              <Badge size="lg" radius="xl" color="white" variant="light">
                No hidden fees
              </Badge>
              <Badge size="lg" radius="xl" color="white" variant="light">
                Secure & confidential
              </Badge>
              <Badge size="lg" radius="xl" color="white" variant="light">
                Verified legal aid lawyers
              </Badge>
            </Group>
          </Grid.Col>

          <Grid.Col span={12} md={4} style={{ textAlign: "center" }}>
            <Button
              size="xl"
              radius="xl"
              color="white"
              variant="filled"
              c={PRIMARY_GOLD}
              fullWidth
            >
              Create Free Account
            </Button>
            <Text c="white" size="xs" mt="md" style={{ opacity: 0.8 }}>
              Already have an account?{" "}
              <Text
                span
                fw={600}
                style={{ cursor: "pointer", textDecoration: "underline" }}
              >
                Log in
              </Text>
            </Text>
          </Grid.Col>
        </Grid>
      </Paper>
    </Container>
  );
}