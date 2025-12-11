import React from "react";
import { useAuth } from "@/context/authContext";
import { 
  Button, 
  Container, 
  Title, 
  Paper, 
  Grid, 
  Text, 
  Group, 
  Avatar, 
  Stack,
  Box,
  Badge,
  Divider,
} from "@mantine/core";
import { 
  IconLogout, 
  IconUser, 
  IconSettings, 
  IconBell, 
  IconShieldCheck,
  IconBriefcase2,
  IconFiles,
  IconCalendar,
  IconClock,
  IconChevronRight,
} from "@tabler/icons-react";
import { doSignOut } from "@/firebase/auth";
import { Navigate, useNavigate } from "react-router";
import { Loaders } from "@/components/ui/Loader";
import { 
  PRIMARY_GOLD, 
  PRIMARY_BROWN, 
  MUTED_OLIVE, 
  THEMED_LIGHT_BG, 
  CHARCOAL, 
  ACCENT_TAN 
} from "@/utils/constants";

const Home = () => {
  const { userData, userLoggedIn, loading } = useAuth();
  const navigate = useNavigate();

  const handleSignout = async () => {
    try {
      await doSignOut();
      navigate("/login");
    } catch (error) {
      console.error("Sign out error", error);
    }
  };

  if (loading) {
    return <Loaders height={window.innerHeight - 100} />;
  }

  if (!userLoggedIn) {
    return <Navigate to="/login" replace={true} />
  }

  if (!userData) {
    return <Loaders height={window.innerHeight - 100} />;
  }

  return (
    <Box bg={THEMED_LIGHT_BG} mih="100vh" py="xl">
      <Container size="lg">
        {/* Welcome Header */}
        <Paper 
          shadow="sm" 
          p="xl" 
          mb="xl" 
          bg="white"
          style={{ borderTop: `4px solid ${PRIMARY_GOLD}` }}
        >
          <Group justify="space-between" align="flex-start">
            <Box>
              <Group gap="sm" mb="xs">
                <Title order={1} c={CHARCOAL}>
                  Welcome Back, {userData.firstName}!
                </Title>
                {userData.isVerified && (
                  <Badge 
                    color={PRIMARY_GOLD} 
                    variant="light"
                    leftSection={<IconShieldCheck size={14} />}
                  >
                    Verified
                  </Badge>
                )}
              </Group>
              <Text c={MUTED_OLIVE} size="sm">
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </Text>
            </Box>
            <Button 
              leftSection={<IconLogout size={18} />}
              variant="outline"
              color={PRIMARY_BROWN}
              onClick={handleSignout}
            >
              Logout
            </Button>
          </Group>
        </Paper>

        {/* Profile Overview Card */}
        <Paper shadow="sm" p="xl" mb="xl" bg="white">
          <Group mb="md">
            <Avatar 
              size={80}
              color={PRIMARY_BROWN}
              radius="md"
              style={{ border: `3px solid ${PRIMARY_GOLD}` }}
            >
              <Text size="xl" fw={700}>
                {userData.firstName?.charAt(0)}{userData.lastName?.charAt(0)}
              </Text>
            </Avatar>
            <Box style={{ flex: 1 }}>
              <Title order={2} c={CHARCOAL}>
                {userData.firstName} {userData.lastName}
              </Title>
              <Text c={MUTED_OLIVE} size="sm" mb="xs">
                {userData.email}
              </Text>
              <Group gap="xs">
                <Badge 
                  color={userData.isVerified ? "green" : "red"} 
                  variant="light"
                  leftSection={<IconShieldCheck size={14} />}
                >
                  {userData.isVerified ? 'Verified Account' : 'Unverified Account'}
                </Badge>
                <Badge color={ACCENT_TAN} variant="light" tt="capitalize">
                  {userData.role}
                </Badge>
              </Group>
            </Box>
          </Group>
        </Paper>

        {/* Quick Stats */}
        <Grid mb="xl">
          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <Paper 
              shadow="sm" 
              p="lg" 
              bg="white"
              style={{ 
                cursor: 'pointer',
                transition: 'transform 0.2s ease',
                borderLeft: `4px solid ${PRIMARY_BROWN}`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '';
              }}
            >
              <Group justify="space-between" mb="xs">
                <IconBriefcase2 size={32} color={PRIMARY_BROWN} />
                <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600}>
                  Active Cases
                </Text>
              </Group>
              <Text size="2rem" fw={700} c={CHARCOAL}>
                3
              </Text>
              <Text size="xs" c={MUTED_OLIVE}>
                2 pending review
              </Text>
            </Paper>
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <Paper 
              shadow="sm" 
              p="lg" 
              bg="white"
              style={{ 
                cursor: 'pointer',
                transition: 'transform 0.2s ease',
                borderLeft: `4px solid ${PRIMARY_GOLD}`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '';
              }}
            >
              <Group justify="space-between" mb="xs">
                <IconFiles size={32} color={PRIMARY_GOLD} />
                <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600}>
                  Documents
                </Text>
              </Group>
              <Text size="2rem" fw={700} c={CHARCOAL}>
                12
              </Text>
              <Text size="xs" c={MUTED_OLIVE}>
                Uploaded files
              </Text>
            </Paper>
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <Paper 
              shadow="sm" 
              p="lg" 
              bg="white"
              style={{ 
                cursor: 'pointer',
                transition: 'transform 0.2s ease',
                borderLeft: `4px solid ${ACCENT_TAN}`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '';
              }}
            >
              <Group justify="space-between" mb="xs">
                <IconBell size={32} color={ACCENT_TAN} />
                <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600}>
                  Notifications
                </Text>
              </Group>
              <Text size="2rem" fw={700} c={CHARCOAL}>
                5
              </Text>
              <Text size="xs" c={MUTED_OLIVE}>
                Unread messages
              </Text>
            </Paper>
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <Paper 
              shadow="sm" 
              p="lg" 
              bg="white"
              style={{ 
                cursor: 'pointer',
                transition: 'transform 0.2s ease',
                borderLeft: `4px solid ${MUTED_OLIVE}`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '';
              }}
            >
              <Group justify="space-between" mb="xs">
                <IconCalendar size={32} color={MUTED_OLIVE} />
                <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600}>
                  Appointments
                </Text>
              </Group>
              <Text size="2rem" fw={700} c={CHARCOAL}>
                2
              </Text>
              <Text size="xs" c={MUTED_OLIVE}>
                This month
              </Text>
            </Paper>
          </Grid.Col>
        </Grid>

        <Grid>
          {/* Quick Actions */}
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Paper shadow="sm" p="xl" bg="white" h="100%">
              <Group mb="lg" justify="space-between">
                <Title order={3} c={CHARCOAL}>Quick Actions</Title>
                <IconChevronRight size={20} color={MUTED_OLIVE} />
              </Group>
              <Stack gap="sm">
                <Button 
                  leftSection={<IconBriefcase2 size={18} />}
                  variant="light"
                  color={PRIMARY_BROWN}
                  fullWidth
                  justify="space-between"
                  rightSection={<IconChevronRight size={16} />}
                  onClick={() => navigate("/submitcase")}
                  styles={{
                    root: {
                      height: 'auto',
                      padding: '12px 16px',
                    },
                  }}
                >
                  <Box>
                    <Text fw={600}>Submit New Case</Text>
                    <Text size="xs" opacity={0.8}>Start a new legal case</Text>
                  </Box>
                </Button>
                <Button 
                  leftSection={<IconFiles size={18} />}
                  variant="light"
                  color={PRIMARY_GOLD}
                  fullWidth
                  justify="space-between"
                  rightSection={<IconChevronRight size={16} />}
                  onClick={() => navigate("/cases")}
                  styles={{
                    root: {
                      height: 'auto',
                      padding: '12px 16px',
                    },
                  }}
                >
                  <Box>
                    <Text fw={600}>View My Cases</Text>
                    <Text size="xs" opacity={0.8}>Track your cases</Text>
                  </Box>
                </Button>
                <Button 
                  leftSection={<IconSettings size={18} />}
                  variant="light"
                  color={ACCENT_TAN}
                  fullWidth
                  justify="space-between"
                  rightSection={<IconChevronRight size={16} />}
                  onClick={() => navigate("/user/settings")}
                  styles={{
                    root: {
                      height: 'auto',
                      padding: '12px 16px',
                    },
                  }}
                >
                  <Box>
                    <Text fw={600}>Account Settings</Text>
                    <Text size="xs" opacity={0.8}>Manage your profile</Text>
                  </Box>
                </Button>
              </Stack>
            </Paper>
          </Grid.Col>

          {/* Account Information */}
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Paper shadow="sm" p="xl" bg="white" h="100%">
              <Group mb="lg" justify="space-between">
                <Title order={3} c={CHARCOAL}>Account Details</Title>
                <IconUser size={20} color={MUTED_OLIVE} />
              </Group>
              <Stack gap="md">
                <Box>
                  <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} mb={4}>
                    Full Name
                  </Text>
                  <Text fw={500} c={CHARCOAL}>
                    {userData.firstName} {userData.lastName}
                  </Text>
                </Box>
                <Divider color={THEMED_LIGHT_BG} />
                <Box>
                  <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} mb={4}>
                    Email Address
                  </Text>
                  <Text fw={500} c={CHARCOAL}>
                    {userData.email}
                  </Text>
                </Box>
                <Divider color={THEMED_LIGHT_BG} />
                <Box>
                  <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} mb={4}>
                    Username
                  </Text>
                  <Text fw={500} c={CHARCOAL}>
                    {userData.username}
                  </Text>
                </Box>
                <Divider color={THEMED_LIGHT_BG} />
                <Box>
                  <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} mb={4}>
                    Member Since
                  </Text>
                  <Group gap="xs">
                    <IconClock size={16} color={MUTED_OLIVE} />
                    <Text fw={500} c={CHARCOAL}>
                      {new Date(userData.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </Text>
                  </Group>
                </Box>
              </Stack>
            </Paper>
          </Grid.Col>
        </Grid>
      </Container>
    </Box>
  );
};

export default Home;