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
  SimpleGrid,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconRefresh,
  IconFolderOpen,
  IconMessageCircle,
  IconUser,
  IconChevronRight,
  IconBriefcase,
} from '@tabler/icons-react';
import { PRIMARY_GOLD, PRIMARY_BROWN, MUTED_OLIVE, THEMED_LIGHT_BG, CHARCOAL, ACCENT_TAN } from '@utils/constants';
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

  const stats = [
    {
      id: 'cases',
      title: 'Active Cases',
      count: assignedCases.length,
      icon: IconBriefcase,
      color: PRIMARY_BROWN,
    },
    {
      id: 'chats',
      title: 'Active Chats',
      count: chatList.length,
      icon: IconMessageCircle,
      color: PRIMARY_GOLD,
    },
  ];

  return (
    <Box 
      bg={THEMED_LIGHT_BG} 
      mih="100vh" 
      py="xl"
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
            <Box>
              <Title order={2} c="white" mb={4}>
                Attorney Dashboard
              </Title>
              <Text c="rgba(255, 255, 255, 0.9)" size="sm" fw={500}>
                Manage your cases and communicate with clients
              </Text>
            </Box>
            <ActionIcon
              size="lg"
              variant="white"
              color={PRIMARY_BROWN}
              onClick={handleRefresh}
              loading={loading || casesLoading}
              radius="md"
            >
              <IconRefresh size={20} />
            </ActionIcon>
          </Group>
        </Paper>

        {/* Stats Cards */}
        {(loading && assignedCases.length === 0) ? (
          <Center py="xl">
            <Loader size="lg" color={PRIMARY_BROWN} />
          </Center>
        ) : (
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg" mb="xl">
            {stats.map((stat) => {
              const IconComponent = stat.icon;
              return (
                <Paper
                  key={stat.id}
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
                      <IconComponent size={24} color="white" stroke={2.5} />
                    </Box>
                  </Group>
                  <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} mb={4}>
                    {stat.title}
                  </Text>
                  <Text size="2rem" fw={700} c={CHARCOAL} lh={1}>
                    {stat.count}
                  </Text>
                </Paper>
              );
            })}
          </SimpleGrid>
        )}

        {/* Assigned Cases Section */}
        <Paper shadow="xs" p="xl" radius="lg" bg="white" mb="xl">
          <Group mb="xl" justify="space-between">
            <Box>
              <Title order={3} c={CHARCOAL} mb={4}>Your Assigned Cases</Title>
              <Text size="sm" c={MUTED_OLIVE}>
                {assignedCases.length} {assignedCases.length === 1 ? 'case' : 'cases'} currently assigned
              </Text>
            </Box>
          </Group>

          {casesLoading ? (
            <Center py="xl">
              <Stack align="center" gap="md">
                <Loader size="lg" color={PRIMARY_BROWN} />
                <Text c={MUTED_OLIVE}>Loading cases...</Text>
              </Stack>
            </Center>
          ) : assignedCases.length === 0 ? (
            <Center py="xl">
              <Stack align="center" gap="md">
                <Box
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: '50%',
                    background: THEMED_LIGHT_BG,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <IconFolderOpen size={32} color={MUTED_OLIVE} />
                </Box>
                <Text size="lg" fw={600} c={CHARCOAL}>
                  No cases assigned yet
                </Text>
                <Text size="sm" c={MUTED_OLIVE} ta="center" maw={400}>
                  Cases will appear here when they are assigned to you by the system
                </Text>
              </Stack>
            </Center>
          ) : (
            <Stack gap="md">
              {assignedCases.map((caseItem) => (
                <Paper
                  key={caseItem._id}
                  p="lg"
                  radius="md"
                  style={{
                    border: '1px solid #F0F0F0',
                    borderLeft: `4px solid ${PRIMARY_BROWN}`,
                    cursor: 'pointer',
                    background: 'white',
                  }}
                  onClick={() => handleCasePress(caseItem)}
                >
                  <Group justify="space-between">
                    <Box style={{ flex: 1 }}>
                      <Group mb={8} gap="xs">
                        <Text fw={600} c={CHARCOAL} size="md">
                          {caseItem.caseTitle}
                        </Text>
                      </Group>
                      <Group gap="xs" mb={8}>
                        <Badge
                          size="sm"
                          variant="light"
                          style={{ 
                            background: '#FEF8F0',
                            color: PRIMARY_BROWN,
                          }}
                        >
                          {caseItem.caseNumber}
                        </Badge>
                        <Text size="xs" c={MUTED_OLIVE} tt="capitalize">
                          {caseItem.caseType}
                        </Text>
                      </Group>
                      <Text size="sm" c={MUTED_OLIVE} lineClamp={2} mb={12}>
                        {caseItem.shortDescription}
                      </Text>
                      <Group gap="xs">
                        <IconUser size={16} color={MUTED_OLIVE} />
                        <Text size="sm" fw={500} c={PRIMARY_BROWN}>
                          {caseItem.userId.firstName} {caseItem.userId.lastName}
                        </Text>
                      </Group>
                    </Box>
                    <ActionIcon 
                      variant="subtle" 
                      color="gray"
                      size="sm"
                    >
                      <IconChevronRight size={18} />
                    </ActionIcon>
                  </Group>
                </Paper>
              ))}
            </Stack>
          )}
        </Paper>

        {/* Active Chats Section */}
        <Paper shadow="xs" p="xl" radius="lg" bg="white">
          <Group mb="xl" justify="space-between">
            <Box>
              <Title order={3} c={CHARCOAL} mb={4}>Active Conversations</Title>
              <Text size="sm" c={MUTED_OLIVE}>
                {chatList.length} {chatList.length === 1 ? 'conversation' : 'conversations'} with clients
              </Text>
            </Box>
          </Group>

          {loading ? (
            <Center py="xl">
              <Stack align="center" gap="md">
                <Loader size="lg" color={PRIMARY_BROWN} />
                <Text c={MUTED_OLIVE}>Loading chats...</Text>
              </Stack>
            </Center>
          ) : chatList.length === 0 ? (
            <Center py="xl">
              <Stack align="center" gap="md">
                <Box
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: '50%',
                    background: THEMED_LIGHT_BG,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <IconMessageCircle size={32} color={MUTED_OLIVE} />
                </Box>
                <Text size="lg" fw={600} c={CHARCOAL}>
                  No active conversations
                </Text>
                <Text size="sm" c={MUTED_OLIVE} ta="center" maw={400}>
                  Start communicating with your clients to see conversations here
                </Text>
              </Stack>
            </Center>
          ) : (
            <Stack gap="md">
              {chatList.map((chatItem) => (
                <Paper
                  key={chatItem.case._id}
                  p="lg"
                  radius="md"
                  style={{
                    border: '1px solid #F0F0F0',
                    cursor: 'pointer',
                    background: 'white',
                  }}
                  onClick={() => handleChatPress(chatItem)}
                >
                  <Group justify="space-between">
                    <Group gap="md" style={{ flex: 1 }}>
                      <Box
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: '50%',
                          background: '#FEF8F0',
                          border: `2px solid ${PRIMARY_GOLD}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <IconUser size={24} color={PRIMARY_BROWN} />
                      </Box>
                      <Box style={{ flex: 1 }}>
                        <Group gap={8} mb={6}>
                          <Text fw={600} c={CHARCOAL}>
                            {chatItem.case.userId.firstName} {chatItem.case.userId.lastName}
                          </Text>
                          {chatItem.unreadCount > 0 && (
                            <Badge
                              size="sm"
                              variant="filled"
                              style={{ 
                                background: PRIMARY_BROWN,
                                borderRadius: '12px',
                              }}
                            >
                              {chatItem.unreadCount}
                            </Badge>
                          )}
                        </Group>
                        <Text fw={500} c={CHARCOAL} size="sm" mb={4}>
                          {chatItem.case.caseTitle}
                        </Text>
                        <Badge
                          size="sm"
                          variant="light"
                          style={{ 
                            background: '#FEF8F0',
                            color: PRIMARY_BROWN,
                            marginBottom: 8,
                          }}
                        >
                          {chatItem.case.caseNumber}
                        </Badge>
                        {chatItem.lastMessage && (
                          <Text size="sm" c={MUTED_OLIVE} fs="italic" lineClamp={1}>
                            {chatItem.lastMessage.message}
                          </Text>
                        )}
                      </Box>
                    </Group>
                    <ActionIcon 
                      variant="subtle" 
                      color="gray"
                      size="sm"
                    >
                      <IconChevronRight size={18} />
                    </ActionIcon>
                  </Group>
                </Paper>
              ))}
            </Stack>
          )}
        </Paper>
      </Container>
    </Box>
  );
}