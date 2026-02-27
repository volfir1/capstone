import {
  Title,
  Text,
  Container,
  Grid,
  Group,
  Box,
  Stack,
  Divider,
} from "@mantine/core";
import { IconShieldCheck, IconFileText, IconBuildingArch } from "@tabler/icons-react";
import { Link } from "react-router-dom";
import { PRIMARY_GOLD, PRIMARY_BROWN } from "../../../../utils/constants";

/**
 * A reusable site footer.
 */
export default function HomepageFooter() {
  const linkStyle = {
    color: "inherit",
    textDecoration: "none",
    cursor: "pointer",
  };

  const legalLinks = [
    { label: "Privacy Policy", to: "/privacy", Icon: IconShieldCheck },
    { label: "Terms of Service", to: "/terms", Icon: IconFileText },
  ];

  const platformLinks = [
    { label: "Features", to: "/features" },
    { label: "How It Works", to: "/how" },
    { label: "About", to: "/about" },
  ];

  return (
    <Box
      component="footer"
      style={{
        borderTop: `2px solid`,
        borderImage: `linear-gradient(90deg, ${PRIMARY_GOLD}, ${PRIMARY_BROWN}) 1`,
        backgroundColor: "white",
      }}
    >
      <Container size="xl" py="xl">
        <Grid gutter="xl">

          {/* Brand column */}
          <Grid.Col span={12} md={5}>
            <Group spacing="xs" mb="md" align="center">

              {/* Logo placeholder (image) */}
              <div
                title="Place your logo here"
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 10,
                  overflow: 'hidden',
                  border: `1.5px dashed ${PRIMARY_GOLD}88`,
                  background: `linear-gradient(135deg, ${PRIMARY_GOLD}12, ${PRIMARY_BROWN}08)`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  cursor: "pointer",
                }}
              >
                <img
                  src="/sola_logo.png"
                  alt="JustReach logo"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              </div>

              <Title order={3}>
                <Text span fw={700} style={{ color: PRIMARY_GOLD }}>
                  Just
                </Text>
                <Text span fw={700} style={{ color: PRIMARY_BROWN }}>
                  Reach
                </Text>
              </Title>
            </Group>

            <Text c="dimmed" size="sm" mb="md">
              Accessible Legal Services Network bridging the justice gap for
              Filipino communities nationwide.
            </Text>
            <Text c="dimmed" size="xs">
              Supporting SDG 16: Peace, Justice, and Strong Institutions
            </Text>
          </Grid.Col>

          {/* Platform */}
          <Grid.Col span={6} md={3}>
            <Text fw={600} mb="md">
              Platform
            </Text>
            <Stack spacing="xs">
              {platformLinks.map(({ label, to }) => (
                <Link key={label} to={to} style={linkStyle}>
                  <Text size="sm" c="dimmed" style={{ cursor: "pointer" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = PRIMARY_GOLD)}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '')}
                  >
                    {label}
                  </Text>
                </Link>
              ))}
            </Stack>
          </Grid.Col>

          {/* Legal */}
          <Grid.Col span={6} md={3}>
            <Text fw={600} mb="md">
              Legal
            </Text>
            <Stack spacing="xs">
              {legalLinks.map(({ label, to, Icon }) => (
                <Link key={label} to={to} style={linkStyle}>
                  <Group spacing={6} noWrap>
                    <Icon
                      size={13}
                      stroke={1.8}
                      style={{ color: PRIMARY_GOLD, flexShrink: 0 }}
                    />
                    <Text
                      size="sm"
                      c="dimmed"
                      style={{ cursor: "pointer", transition: "color 0.18s" }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = PRIMARY_GOLD)}
                      onMouseLeave={(e) => (e.currentTarget.style.color = "")}
                    >
                      {label}
                    </Text>
                  </Group>
                </Link>
              ))}
            </Stack>
          </Grid.Col>

        </Grid>

        <Divider my="xl" />

        <Group position="apart" align="center">
          <Text c="dimmed" size="xs">
            © 2025 JUSTREACH. A Capstone Project by Nagallo, Ortiz, Pis-an &amp; Sible
          </Text>
          <Text c="dimmed" size="xs">
            Technological University of the Philippines – Taguig
          </Text>
        </Group>
      </Container>
    </Box>
  );
}