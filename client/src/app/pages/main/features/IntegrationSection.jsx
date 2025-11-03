import {
  Title,
  Text,
  Container,
  Grid,
  Paper,
  ThemeIcon,
  Group,
  Box,
  Stack,
  Badge,
  List,
  rem,
} from "@mantine/core";
import { IconScale, IconCheck } from "@tabler/icons-react";
import { PRIMARY_GOLD, PRIMARY_BROWN } from "../../../../utils/constants"; // Adjust path as needed

export default function IntegrationSection() {
  return (
    <Container size="xl" py={rem(100)}>
      <Paper
        shadow="xl"
        p={rem(60)}
        radius="xl"
        style={{
          background: `linear-gradient(135deg, ${PRIMARY_GOLD} 0%, ${PRIMARY_BROWN} 100%)`,
        }}
      >
        <Grid align="center" gutter="xl">
          <Grid.Col span={12} md={8}>
            <Stack spacing="md">
              <Badge
                size="lg"
                radius="xl"
                variant="white"
                color={PRIMARY_GOLD}
              >
                Integration
              </Badge>

              <Title order={2} c="white">
                Seamlessly Integrated with PAO
              </Title>

              <Text c="white" size="lg" lh={1.7}>
                JUSTREACH works hand-in-hand with the Public Attorney's Office
                (PAO) to provide legitimate, validated legal services. Our
                platform integrates with existing PAO procedures while
                introducing modern efficiency through technology.
              </Text>

              <List
                spacing="sm"
                size="md"
                c="white"
                icon={
                  <ThemeIcon
                    color="white"
                    variant="light"
                    size={24}
                    radius="xl"
                  >
                    <IconCheck size={16} />
                  </ThemeIcon>
                }
              >
                <List.Item>Barangay-level blotter integration</List.Item>
                <List.Item>
                  PAO validation and jurisdiction compliance
                </List.Item>
                <List.Item>Direct lawyer assignment system</List.Item>
                <List.Item>Unified case management</List.Item>
              </List>
            </Stack>
          </Grid.Col>

          <Grid.Col span={12} md={4} style={{ textAlign: "center" }}>
            <ThemeIcon
              size={150}
              radius="xl"
              variant="white"
              color={PRIMARY_GOLD}
            >
              <IconScale size={90} stroke={1.5} />
            </ThemeIcon>
          </Grid.Col>
        </Grid>
      </Paper>
    </Container>
  );
}