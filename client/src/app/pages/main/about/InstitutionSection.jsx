import {
  Title,
  Text,
  Container,
  Grid,
  Paper,
  ThemeIcon,
  Box,
  rem,
} from "@mantine/core";
import { IconUsers } from "@tabler/icons-react";
import { PRIMARY_GOLD, PRIMARY_BROWN } from "../../../../utils/constants"; // Adjust path as needed

export default function InstitutionSection() {
  return (
    <Box style={{ backgroundColor: "#f8f9fa" }}>
      <Container size="xl" py={rem(80)}>
        <Paper
          shadow="md"
          p={rem(60)}
          radius="xl"
          style={{
            background: `linear-gradient(135deg, ${PRIMARY_GOLD} 0%, ${PRIMARY_BROWN} 100%)`,
          }}
        >
          <Grid align="center" gutter="xl">
            <Grid.Col span={12} md={8}>
              <Title order={2} c="white" mb="md">
                Technological University of the Philippines - Taguig
              </Title>
              <Text c="white" size="lg" lh={1.7}>
                This capstone project is presented to the Faculty of the
                Electrical and Allied Department as part of the requirements for
                the Bachelor of Science in Information Technology degree.
                Completed in August 2025.
              </Text>
              <Text c="white" size="sm" mt="md" style={{ opacity: 0.9 }}>
                KM. 14 East Service Road, Western Bicutan, Taguig City,
                Philippines
              </Text>
            </Grid.Col>

            <Grid.Col span={12} md={4} style={{ textAlign: "center" }}>
              <ThemeIcon
                size={120}
                radius="xl"
                variant="white"
                color={PRIMARY_GOLD}
              >
                <IconUsers size={70} stroke={1.5} />
              </ThemeIcon>
            </Grid.Col>
          </Grid>
        </Paper>
      </Container>
    </Box>
  );
}
