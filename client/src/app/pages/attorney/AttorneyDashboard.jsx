import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Title,
  Text,
  Box,
  Group,
  Stack,
  Badge,
  ActionIcon,
  Loader,
  Center,
  Card,
  Avatar,
  Divider,
  Grid,
  ThemeIcon,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconRefresh,
  IconFolderOpen,
  IconMessageCircle,
  IconUser,
  IconChevronRight,
} from '@tabler/icons-react';
import { PRIMARY_GOLD, PRIMARY_BROWN, MUTED_OLIVE, THEMED_LIGHT_BG, CHARCOAL } from '@utils/constants';
import apiClient from '@config/api/apiClient';

export default function AttorneyDashboard() {
  const navigate = useNavigate();
  const [chatList, setChatList] = useState([]);
  const [assignedCases, setAssignedCases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [casesLoading, setCasesLoading] = useState(false);

  useEffect(() => {
    fetchChatList();
    fetchAssignedCases();
  }, []);

  const fetchAssignedCases = async () => {
    try {
      setCasesLoading(true);
      const response = await apiClient.get('/cases/attorney-cases');

      if (response.data.success) {
        setAssignedCases(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching assigned cases:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to load assigned cases',
        color: 'red',
      });
    } finally {
      setCasesLoading(false);
    }
  };

  const fetchChatList = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/chat/list');

      if (response.data.success) {
        setChatList(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching chat list:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to load chat list',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchChatList();
    fetchAssignedCases();
  };

  const handleChatPress = (chatItem) => {
    navigate(`/attorney/chat/${chatItem.case._id}`, {
      state: {
        clientName: `${chatItem.case.userId.firstName} ${chatItem.case.userId.lastName}`,
      },
    });
  };

  const handleCasePress = (caseItem) => {
    navigate(`/attorney/chat/${caseItem._id}`, {
      state: {
        clientName: `${caseItem.userId.firstName} ${caseItem.userId.lastName}`,
      },
    });
  };

  return (
    <Box>
      <Container size="xl" py="xl">
        {/* Welcome Section */}
        <Paper p="xl" radius="md" mb="xl" style={{ backgroundColor: 'white' }}>
          <Stack spacing="xs">
            <Text size="sm" weight={500} style={{ color: PRIMARY_BROWN }}>
              Welcome back,
            </Text>
            <Title order={1} style={{ color: CHARCOAL }}>
              Attorney
            </Title>
            <Text size="sm" color="dimmed">
              Manage your cases and clients
            </Text>
          </Stack>
        </Paper>

        {/* Main Content */}
        <Stack spacing="xl">
          {/* Assigned Cases Section */}
          <Box>
            <Group position="apart" align="center" mb="lg">
              <Title order={2} style={{ color: CHARCOAL }}>
                Your Assigned Cases
              </Title>
              <ActionIcon
                size="lg"
                variant="light"
                color={PRIMARY_BROWN}
                onClick={handleRefresh}
                loading={loading || casesLoading}
                style={{ backgroundColor: THEMED_LIGHT_BG }}
              >
                <IconRefresh size={20} />
              </ActionIcon>
            </Group>

            {casesLoading ? (
              <Center py="xl">
                <Stack align="center" spacing="md">
                  <Loader size="lg" color={PRIMARY_BROWN} />
                  <Text color="dimmed">Loading cases...</Text>
                </Stack>
              </Center>
            ) : assignedCases.length === 0 ? (
              <Center py="xl">
                <Stack align="center" spacing="md">
                  <IconFolderOpen size={64} color="#ccc" />
                  <Text size="lg" weight={600} color="dimmed">
                    No cases assigned yet
                  </Text>
                  <Text size="sm" color="dimmed" align="center" style={{ maxWidth: 400 }}>
                    Cases will appear here when they are assigned to you
                  </Text>
                </Stack>
              </Center>
            ) : (
              <Grid gutter="md">
                {assignedCases.map((caseItem) => (
                  <Grid.Col key={caseItem._id} span={12} md={6}>
                    <Card
                      shadow="sm"
                      padding="lg"
                      radius="md"
                      withBorder
                      style={{
                        backgroundColor: 'white',
                        borderLeft: `4px solid ${PRIMARY_BROWN}`,
                        cursor: 'pointer',
                        transition: 'transform 0.2s ease',
                        borderColor: '#E8E4DC',
                      }}
                      onClick={() => handleCasePress(caseItem)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      <Stack spacing="xs">
                        <Group position="apart">
                          <Text size="lg" weight={700} style={{ color: CHARCOAL }}>
                            {caseItem.caseTitle}
                          </Text>
                        </Group>
                        <Badge
                          size="sm"
                          variant="light"
                          color={PRIMARY_BROWN}
                          style={{ width: 'fit-content' }}
                        >
                          {caseItem.caseNumber}
                        </Badge>
                        <Text size="sm" color="dimmed" tt="capitalize">
                          {caseItem.caseType}
                        </Text>
                        <Text size="sm" color="dimmed" lineClamp={2}>
                          {caseItem.shortDescription}
                        </Text>
                        <Divider my="xs" />
                        <Group spacing="xs">
                          <IconUser size={16} color={MUTED_OLIVE} />
                          <Text size="sm" weight={600} style={{ color: PRIMARY_BROWN }}>
                            {caseItem.userId.firstName} {caseItem.userId.lastName}
                          </Text>
                        </Group>
                      </Stack>
                    </Card>
                  </Grid.Col>
                ))}
              </Grid>
            )}
          </Box>

          {/* Active Chats Section */}
          <Box>
            <Title order={2} mb="lg" style={{ color: CHARCOAL }}>
              Active Chats
            </Title>

            {loading ? (
              <Center py="xl">
                <Stack align="center" spacing="md">
                  <Loader size="lg" color={PRIMARY_BROWN} />
                  <Text color="dimmed">Loading chats...</Text>
                </Stack>
              </Center>
            ) : chatList.length === 0 ? (
              <Center py="xl">
                <Stack align="center" spacing="md">
                  <IconMessageCircle size={64} color="#ccc" />
                  <Text size="lg" weight={600} color="dimmed">
                    No active chats
                  </Text>
                  <Text size="sm" color="dimmed" align="center" style={{ maxWidth: 400 }}>
                    Start a conversation with your clients
                  </Text>
                </Stack>
              </Center>
            ) : (
              <Stack spacing="md">
                {chatList.map((chatItem) => (
                  <Card
                    key={chatItem.case._id}
                    shadow="sm"
                    padding="lg"
                    radius="md"
                    withBorder
                    style={{
                      backgroundColor: 'white',
                      cursor: 'pointer',
                      transition: 'transform 0.2s ease',
                      borderColor: '#E8E4DC',
                    }}
                    onClick={() => handleChatPress(chatItem)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateX(4px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateX(0)';
                    }}
                  >
                    <Group position="apart" align="flex-start">
                      <Group spacing="md" style={{ flex: 1 }}>
                        <Avatar
                          size={56}
                          radius="xl"
                          color={PRIMARY_BROWN}
                          style={{ border: `2px solid ${PRIMARY_GOLD}` }}
                        >
                          <IconUser size={28} />
                        </Avatar>
                        <Box style={{ flex: 1 }}>
                          <Group spacing="xs" mb={4}>
                            <Text size="lg" weight={700} style={{ color: CHARCOAL }}>
                              {chatItem.case.userId.firstName} {chatItem.case.userId.lastName}
                            </Text>
                            {chatItem.unreadCount > 0 && (
                              <Badge
                                size="sm"
                                variant="filled"
                                color={PRIMARY_BROWN}
                                style={{ borderRadius: '10px' }}
                              >
                                {chatItem.unreadCount}
                              </Badge>
                            )}
                          </Group>
                          <Text size="md" weight={600} style={{ color: CHARCOAL }} mb={2}>
                            {chatItem.case.caseTitle}
                          </Text>
                          <Badge
                            size="xs"
                            variant="light"
                            color={PRIMARY_BROWN}
                            mb={8}
                          >
                            {chatItem.case.caseNumber}
                          </Badge>
                          {chatItem.lastMessage && (
                            <Text size="sm" color="dimmed" lineClamp={1} italic>
                              {chatItem.lastMessage.message}
                            </Text>
                          )}
                        </Box>
                      </Group>
                      <ThemeIcon
                        size="md"
                        radius="xl"
                        variant="light"
                        color={MUTED_OLIVE}
                      >
                        <IconChevronRight size={16} />
                      </ThemeIcon>
                    </Group>
                  </Card>
                ))}
              </Stack>
            )}
          </Box>
        </Stack>
      </Container>
    </Box>
  );
}