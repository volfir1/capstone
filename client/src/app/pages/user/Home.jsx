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
  ActionIcon,
  SimpleGrid,
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
  IconMessageCircle,
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

  const stats = [
    {
      icon: IconBriefcase2,
      label: "Active Cases",
      value: "3",
      subtitle: "2 pending review",
      color: PRIMARY_BROWN,
    },
    {
      icon: IconFiles,
      label: "Documents",
      value: "12",
      subtitle: "Uploaded files",
      color: PRIMARY_GOLD,
    },
    {
      icon: IconBell,
      label: "Notifications",
      value: "5",
      subtitle: "Unread messages",
      color: MUTED_OLIVE,
    },
    {
      icon: IconCalendar,
      label: "Appointments",
      value: "2",
      subtitle: "This month",
      color: ACCENT_TAN,
    },
  ];

  const quickActions = [
    {
      icon: IconBriefcase2,
      title: "Submit New Case",
      description: "Start a new legal case",
      path: "/submitcase",
      color: PRIMARY_BROWN,
    },
    {
      icon: IconFiles,
      title: "View My Cases",
      description: "Track your cases",
      path: "/cases",
      color: PRIMARY_GOLD,
    },
    {
      icon: IconMessageCircle,
      title: "Chat with Attorney",
      description: "Get instant support",
      path: "/chat",
      color: ACCENT_TAN,
    },
    {
      icon: IconSettings,
      title: "Account Settings",
      description: "Manage your profile",
      path: "/user/settings",
      color: MUTED_OLIVE,
    },
  ];

  return (
    <Box 
      bg={THEMED_LIGHT_BG} 
      mih="100vh" 
      py="xl"
      style={{
        '::-webkit-scrollbar': {
          width: '8px',
        },
        '::-webkit-scrollbar-track': {
          background: 'transparent',
        },
        '::-webkit-scrollbar-thumb': {
          background: MUTED_OLIVE,
          borderRadius: '4px',
        },
        '::-webkit-scrollbar-thumb:hover': {
          background: PRIMARY_BROWN,
        },
        scrollbarWidth: 'thin',
        scrollbarColor: `${MUTED_OLIVE} transparent`,
      }}
    >
      <style>
        {`
          ::-webkit-scrollbar {
            width: 8px;
          }
          ::-webkit-scrollbar-track {
            background: transparent;
          }
          ::-webkit-scrollbar-thumb {
            background: ${MUTED_OLIVE};
            border-radius: 4px;
          }
          ::-webkit-scrollbar-thumb:hover {
            background: ${PRIMARY_BROWN};
          }
          * {
            scrollbar-width: thin;
            scrollbar-color: ${MUTED_OLIVE} transparent;
          }
        `}
      </style>
      <Container size="xl">
        {/* Welcome Header */}
        <Paper 
          shadow="xs" 
          p="xl" 
          mb="xl" 
          radius="lg"
          style={{ 
            background: PRIMARY_BROWN,
            border: 'none',
          }}
        >
          <Group justify="space-between" align="center">
            <Group gap="lg">
              <Avatar 
                size={64}
                radius="md"
                style={{ 
                  border: `3px solid ${PRIMARY_GOLD}`,
                  background: 'white',
                  color: PRIMARY_BROWN,
                }}
              >
                <Text size="xl" fw={700}>
                  {userData.firstName?.charAt(0)}{userData.lastName?.charAt(0)}
                </Text>
              </Avatar>
              <Box>
                <Group gap="sm" mb={4}>
                  <Title order={2} c="white">
                    Welcome Back, {userData.firstName}!
                  </Title>
                  {userData.isVerified && (
                    <Badge 
                      color={PRIMARY_GOLD} 
                      variant="filled"
                      size="lg"
                      leftSection={<IconShieldCheck size={14} />}
                    >
                      Verified
                    </Badge>
                  )}
                </Group>
                <Text c="rgba(255, 255, 255, 0.9)" size="sm" fw={500}>
                  {new Date().toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </Text>
              </Box>
            </Group>
            <Button 
              leftSection={<IconLogout size={18} />}
              variant="white"
              color={PRIMARY_BROWN}
              onClick={handleSignout}
              size="md"
              radius="md"
            >
              Logout
            </Button>
          </Group>
        </Paper>

        {/* Stats Cards */}
        <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="lg" mb="xl">
          {stats.map((stat, index) => (
            <Paper 
              key={index}
              shadow="xs" 
              p="xl" 
              radius="lg"
              style={{ 
                background: 'white',
                border: '1px solid #F0F0F0',
              }}
            >
              <Group justify="space-between" mb="md">
                <Box
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: '12px',
                    background: stat.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <stat.icon size={24} color="white" stroke={2.5} />
                </Box>
              </Group>
              <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} mb={4}>
                {stat.label}
              </Text>
              <Text size="2rem" fw={700} c={CHARCOAL} lh={1} mb={4}>
                {stat.value}
              </Text>
              <Text size="xs" c={stat.color} fw={500}>
                {stat.subtitle}
              </Text>
            </Paper>
          ))}
        </SimpleGrid>

        <Grid>
          {/* Quick Actions */}
          <Grid.Col span={{ base: 12, md: 7 }}>
            <Paper shadow="xs" p="xl" radius="lg" bg="white" h="100%">
              <Group mb="xl" justify="space-between">
                <Box>
                  <Title order={3} c={CHARCOAL} mb={4}>Quick Actions</Title>
                  <Text size="sm" c={MUTED_OLIVE}>Get started with common tasks</Text>
                </Box>
              </Group>
              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                {quickActions.map((action, index) => (
                  <Paper
                    key={index}
                    p="lg"
                    radius="md"
                    style={{
                      border: '1px solid #F0F0F0',
                      cursor: 'pointer',
                      background: 'white',
                    }}
                    onClick={() => navigate(action.path)}
                  >
                    <Group justify="space-between" mb="sm">
                      <Box
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: '10px',
                          background: action.color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <action.icon size={20} color="white" stroke={2.5} />
                      </Box>
                      <ActionIcon 
                        variant="subtle" 
                        color="gray"
                        size="sm"
                      >
                        <IconChevronRight size={18} />
                      </ActionIcon>
                    </Group>
                    <Text fw={600} c={CHARCOAL} mb={4}>
                      {action.title}
                    </Text>
                    <Text size="xs" c={MUTED_OLIVE}>
                      {action.description}
                    </Text>
                  </Paper>
                ))}
              </SimpleGrid>
            </Paper>
          </Grid.Col>

          {/* Account Information */}
          <Grid.Col span={{ base: 12, md: 5 }}>
            <Paper shadow="xs" p="xl" radius="lg" bg="white" h="100%">
              <Group mb="xl" justify="space-between">
                <Box>
                  <Title order={3} c={CHARCOAL} mb={4}>Account Details</Title>
                  <Text size="sm" c={MUTED_OLIVE}>Your profile information</Text>
                </Box>
                <ActionIcon 
                  variant="light" 
                  color={PRIMARY_BROWN}
                  size="lg"
                  radius="md"
                  onClick={() => navigate("/user/settings")}
                >
                  <IconSettings size={20} />
                </ActionIcon>
              </Group>
              <Stack gap="lg">
                <Box>
                  <Group gap="xs" mb={8}>
                    <Box
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: '8px',
                        background: PRIMARY_BROWN,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <IconUser size={16} color="white" />
                    </Box>
                    <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600}>
                      Full Name
                    </Text>
                  </Group>
                  <Text fw={600} c={CHARCOAL} size="md" ml={40}>
                    {userData.firstName} {userData.lastName}
                  </Text>
                </Box>

                <Divider color="#F0F0F0" />

                <Box>
                  <Group gap="xs" mb={8}>
                    <Box
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: '8px',
                        background: PRIMARY_GOLD,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <IconShieldCheck size={16} color="white" />
                    </Box>
                    <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600}>
                      Email Address
                    </Text>
                  </Group>
                  <Text fw={500} c={CHARCOAL} ml={40}>
                    {userData.email}
                  </Text>
                </Box>

                <Divider color="#F0F0F0" />

                <Box>
                  <Group gap="xs" mb={8}>
                    <Box
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: '8px',
                        background: ACCENT_TAN,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <IconUser size={16} color="white" />
                    </Box>
                    <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600}>
                      Username
                    </Text>
                  </Group>
                  <Text fw={500} c={CHARCOAL} ml={40}>
                    @{userData.username}
                  </Text>
                </Box>

                <Divider color="#F0F0F0" />

                <Box>
                  <Group gap="xs" mb={8}>
                    <Box
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: '8px',
                        background: MUTED_OLIVE,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <IconClock size={16} color="white" />
                    </Box>
                    <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600}>
                      Member Since
                    </Text>
                  </Group>
                  <Text fw={500} c={CHARCOAL} ml={40}>
                    {new Date(userData.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </Text>
                </Box>

                <Paper 
                  p="md" 
                  radius="md"
                  style={{
                    background: '#FFF9E6',
                    border: `1px solid ${PRIMARY_GOLD}`,
                  }}
                >
                  <Group>
                    <IconShieldCheck size={20} color={PRIMARY_GOLD} />
                    <Box style={{ flex: 1 }}>
                      <Text size="sm" fw={600} c={CHARCOAL}>
                        {userData.isVerified ? 'Verified Account' : 'Unverified Account'}
                      </Text>
                      <Text size="xs" c={MUTED_OLIVE}>
                        {userData.isVerified ? 'Your account is verified' : 'Please verify your account'}
                      </Text>
                    </Box>
                  </Group>
                </Paper>
              </Stack>
            </Paper>
          </Grid.Col>
        </Grid>
      </Container>
    </Box>
  );
};

export default Home;