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
import { IconDeviceMobile, IconCheck } from "@tabler/icons-react";
import { PRIMARY_GOLD, PRIMARY_BROWN } from "../../../../utils/constants"; // Adjust path as needed

export default function OfflineFeature() {
  return (
    <Container size="xl" py={rem(100)}>
      <Paper
        shadow="xl"
        p={rem(60)}
        radius="xl"
        style={{
          background: `linear-gradient(135deg, ${PRIMARY_BROWN} 0%, ${PRIMARY_GOLD} 100%)`,
        }}
      >
        <Grid align="center" gutter="xl">
          <Grid.Col span={12} md={4} style={{ textAlign: "center" }}>
            <ThemeIcon
              size={150}
              radius="xl"
              variant="white"
              color={PRIMARY_BROWN}
            >
              <IconDeviceMobile size={90} stroke={1.5} />
            </ThemeIcon>
          </Grid.Col>

          <Grid.Col span={12} md={8}>
            <Stack spacing="md">
              <Badge size="lg" radius="xl" variant="white" color={PRIMARY_BROWN}>
                Works Offline
              </Badge>
              
              <Title order={2} c="white">
                Access Justice Even Without Internet
              </Title>
              
              <Text c="white" size="lg" lh={1.7}>
                We understand that rural areas often have limited or unstable internet 
                connectivity. That's why JUSTREACH is designed to work offline, allowing 
                you to access essential features without requiring constant connection.
              </Text>

              <List
                spacing="sm"
                size="md"
                c="white"
                icon={
                  <ThemeIcon color={PRIMARY_BROWN} variant="light" size={24} radius="xl">
                    <IconCheck size={16} />
                  </ThemeIcon>
                }
              >
                <List.Item>Browse and fill out legal forms offline</List.Item>
                <List.Item>View previously downloaded case information</List.Item>
                <List.Item>Prepare documents for submission</List.Item>
                <List.Item>Auto-sync when connection is restored</List.Item>
              </List>
            </Stack>
          </Grid.Col>
        </Grid>
      </Paper>
    </Container>
  );
}