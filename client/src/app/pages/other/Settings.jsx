import {
  Box,
  Container,
  Grid,
  Group,
  Paper,
  Stack,
  Switch,
  Text,
  ThemeIcon,
  Badge,
} from '@mantine/core';
import {
  IconMoonStars,
  IconSettings,
  IconSunHigh,
  IconSparkles,
} from '@tabler/icons-react';
import { useThemeMode } from '@context/themeContext';
import {
  BG,
  CHARCOAL,
  MUTED_OLIVE,
  PRIMARY_BROWN,
  PRIMARY_GOLD,
} from '@utils/constants';

export default function Settings() {
  const { isDarkMode, setThemeMode } = useThemeMode();

  const handleThemeChange = (event) => {
    setThemeMode(event.currentTarget.checked ? 'dark' : 'light');
  };

  return (
    <Box bg={BG} mih="100vh" py="xl">
      <Container size="md">
        <Stack gap="lg">
          <Paper
            p="xl"
            radius="lg"
            withBorder
            style={{
              backgroundColor: 'var(--app-surface)',
              borderColor: 'var(--app-border)',
              boxShadow: '0 18px 40px var(--app-shadow)',
            }}
          >
            <Group justify="space-between" align="flex-start" gap="md" wrap="wrap">
              <Group gap="sm" align="flex-start">
                <ThemeIcon
                  size={42}
                  radius="md"
                  variant="light"
                  color={PRIMARY_BROWN}
                  style={{ border: '1px solid var(--app-border)' }}
                >
                  <IconSettings size={22} />
                </ThemeIcon>
                <Box>
                  <Text size="xl" fw={700} c={CHARCOAL}>
                    Settings
                  </Text>
                  <Text size="sm" c={MUTED_OLIVE}>
                    Personalize your workspace and choose how the admin portal looks.
                  </Text>
                </Box>
              </Group>

              <Badge
                size="lg"
                radius="sm"
                color={isDarkMode ? 'gray' : 'green'}
                variant="light"
              >
                {isDarkMode ? 'Dark Mode Active' : 'Light Mode Active'}
              </Badge>
            </Group>
          </Paper>

          <Paper
            p="xl"
            radius="lg"
            withBorder
            style={{
              backgroundColor: 'var(--app-surface)',
              borderColor: 'var(--app-border)',
              boxShadow: '0 18px 40px var(--app-shadow)',
            }}
          >
            <Stack gap="md">
              <Group justify="space-between" align="center" wrap="wrap">
                <Box>
                  <Group gap="xs" mb={6}>
                    <ThemeIcon size={28} radius="xl" variant="light" color={PRIMARY_BROWN}>
                      {isDarkMode ? <IconMoonStars size={15} /> : <IconSunHigh size={15} />}
                    </ThemeIcon>
                    <Text size="lg" fw={600} c={CHARCOAL}>
                      Appearance
                    </Text>
                  </Group>
                  <Text size="sm" c={MUTED_OLIVE}>
                    Toggle dark mode for a low-light interface. Your choice is saved for your next login.
                  </Text>
                </Box>

                <Switch
                  checked={isDarkMode}
                  onChange={handleThemeChange}
                  color={PRIMARY_BROWN}
                  size="lg"
                  onLabel={<IconMoonStars size={14} />}
                  offLabel={<IconSunHigh size={14} />}
                />
              </Group>

              <Grid gutter="md">
                <Grid.Col span={{ base: 12, sm: 6 }}>
                  <Box
                    p="md"
                    style={{
                      borderRadius: 12,
                      backgroundColor: isDarkMode ? 'var(--app-surface-soft)' : 'var(--app-surface-muted)',
                      border: '1px solid var(--app-border)',
                    }}
                  >
                    <Text size="xs" fw={700} c={CHARCOAL} tt="uppercase" lts={0.7}>
                      Workspace Preview
                    </Text>
                    <Text size="sm" mt={6} c={MUTED_OLIVE}>
                      {isDarkMode
                        ? 'Soft charcoal surfaces with restrained contrast for focused work.'
                        : 'A clean light workspace for daytime administrative work.'}
                    </Text>
                  </Box>
                </Grid.Col>

                <Grid.Col span={{ base: 12, sm: 6 }}>
                  <Box
                    p="md"
                    style={{
                      borderRadius: 12,
                      backgroundColor: 'var(--app-surface-muted)',
                      border: '1px solid var(--app-border)',
                    }}
                  >
                    <Group gap={8} mb={8}>
                      <ThemeIcon size={24} radius="md" variant="light" color={PRIMARY_GOLD}>
                        <IconSparkles size={14} />
                      </ThemeIcon>
                      <Text size="xs" fw={700} c={CHARCOAL} tt="uppercase" lts={0.7}>
                        Saved Preference
                      </Text>
                    </Group>
                    <Text size="sm" c={MUTED_OLIVE}>
                      Theme preference is stored on this browser and only applies inside the admin system after login.
                    </Text>
                  </Box>
                </Grid.Col>
              </Grid>
            </Stack>
          </Paper>
        </Stack>
      </Container>
    </Box>
  );
}
