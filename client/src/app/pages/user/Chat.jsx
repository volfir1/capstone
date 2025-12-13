import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  Container,
  Paper,
  Text,
  Box,
  Group,
  Stack,
  TextInput,
  ActionIcon,
  ScrollArea,
  Loader,
  Center,
  Avatar,
  Divider,
  Textarea,
} from '@mantine/core';
import {
  IconArrowLeft,
  IconSend,
  IconMessage,
} from '@tabler/icons-react';
import { PRIMARY_GOLD, PRIMARY_BROWN, MUTED_OLIVE, THEMED_LIGHT_BG, CHARCOAL } from '@utils/constants';
import { useAuth } from '@/context/authContext';
import { useChat } from '@/hooks/user/useChat';
import apiClient from '@config/api/apiClient';
import { notifications } from '@mantine/notifications';

export default function UserChat() {
  const navigate = useNavigate();
  const { caseId: urlCaseId } = useParams();
  const [searchParams] = useSearchParams();
  const attorneyName = searchParams.get('attorneyName');
  const clientName = searchParams.get('clientName');
  
  const { userData } = useAuth();
  const [caseId, setCaseId] = useState(urlCaseId);
  const [fetchingCase, setFetchingCase] = useState(!urlCaseId);
  const [caseData, setCaseData] = useState(null);
  const [messageText, setMessageText] = useState('');
  const viewport = useRef(null);
  
  // All hooks must be called before any conditional returns
  const { messages, loading, sending, sendMessage } = useChat(caseId);

  // Auto-fetch assigned case if no caseId in URL
  useEffect(() => {
    if (!urlCaseId) {
      const fetchAssignedCase = async () => {
        try {
          const response = await apiClient.get('/cases/user-cases');
          if (response.data.success) {
            const cases = response.data.data;
            const assignedCase = cases.find(c => c.attorneyId);
            
            if (assignedCase) {
              setCaseId(assignedCase._id);
              setCaseData(assignedCase);
            } else {
              notifications.show({
                title: 'No Assigned Case',
                message: 'You need an assigned attorney to start chatting',
                color: 'yellow',
              });
              navigate('/user/trackcase', { replace: true });
            }
          }
        } catch (error) {
          console.error('Error fetching case:', error);
          notifications.show({
            title: 'Error',
            message: 'Failed to load case information',
            color: 'red',
          });
          navigate('/user/trackcase', { replace: true });
        } finally {
          setFetchingCase(false);
        }
      };
      
      fetchAssignedCase();
    } else {
      setFetchingCase(false);
    }
  }, [urlCaseId, navigate]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (viewport.current) {
      viewport.current.scrollTo({ top: viewport.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  // Show loading state while fetching case
  if (fetchingCase) {
    return (
      <Box style={{ minHeight: '100vh', backgroundColor: '#F9F6F1', padding: '2rem' }}>
        <Center style={{ minHeight: '60vh' }}>
          <Stack align="center" spacing="md">
            <Loader size="lg" color={PRIMARY_BROWN} />
            <Text color="dimmed">Loading chat...</Text>
          </Stack>
        </Center>
      </Box>
    );
  }

  const displayAttorneyName = attorneyName || 
    (caseData?.attorneyId ? `${caseData.attorneyId.firstName} ${caseData.attorneyId.lastName}` : null);
  const chatPartnerName = displayAttorneyName || clientName || 'Chat';

  const handleSend = async () => {
    if (!messageText.trim() || sending) return;

    const success = await sendMessage(messageText);
    if (success) {
      setMessageText('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderMessage = (message) => {
    const isMyMessage = message.senderId.email === userData?.email;
    const senderName = `${message.senderId.firstName} ${message.senderId.lastName}`;
    const time = formatTime(message.createdAt);

    return (
      <Box
        key={message._id}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: isMyMessage ? 'flex-end' : 'flex-start',
          marginBottom: '1rem',
          maxWidth: '70%',
          marginLeft: isMyMessage ? 'auto' : 0,
          marginRight: isMyMessage ? 0 : 'auto',
        }}
      >
        {!isMyMessage && (
          <Text size="xs" weight={600} mb={4} ml={12} style={{ color: PRIMARY_BROWN }}>
            {senderName}
          </Text>
        )}
        <Paper
          p="md"
          radius="lg"
          style={{
            backgroundColor: isMyMessage ? PRIMARY_BROWN : 'white',
            border: isMyMessage ? 'none' : `1px solid #E0E0E0`,
            borderBottomRightRadius: isMyMessage ? '4px' : '12px',
            borderBottomLeftRadius: isMyMessage ? '12px' : '4px',
          }}
        >
          <Text
            size="sm"
            style={{
              color: isMyMessage ? 'white' : CHARCOAL,
              wordWrap: 'break-word',
            }}
          >
            {message.message}
          </Text>
          <Text
            size="xs"
            mt={4}
            style={{
              color: isMyMessage ? 'rgba(255, 255, 255, 0.7)' : '#999',
              textAlign: isMyMessage ? 'right' : 'left',
            }}
          >
            {time}
          </Text>
        </Paper>
      </Box>
    );
  };

  return (
    <Box style={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: THEMED_LIGHT_BG }}>
      {/* Header */}
      <Paper
        p="md"
        radius={0}
        style={{
          backgroundColor: 'white',
          borderBottom: `1px solid #E0E0E0`,
        }}
      >
        <Group position="apart">
          <Group spacing="md">
            <ActionIcon
              size="lg"
              variant="subtle"
              onClick={() => navigate(-1)}
              style={{ color: CHARCOAL }}
            >
              <IconArrowLeft size={24} />
            </ActionIcon>
            <Box>
              <Text weight={700} size="lg" style={{ color: CHARCOAL }}>
                {chatPartnerName}
              </Text>
              <Text size="xs" color="dimmed">
                Case #{caseId?.slice(-6)}
              </Text>
            </Box>
          </Group>
        </Group>
      </Paper>

      {/* Messages Area */}
      <Box style={{ flex: 1, overflow: 'hidden' }}>
        {loading ? (
          <Center style={{ height: '100%' }}>
            <Stack align="center" spacing="md">
              <Loader size="lg" color={PRIMARY_BROWN} />
              <Text color="dimmed">Loading messages...</Text>
            </Stack>
          </Center>
        ) : (
          <ScrollArea
            style={{ height: '100%' }}
            viewportRef={viewport}
          >
            <Container size="md" py="lg">
              {messages.length === 0 ? (
                <Center style={{ paddingTop: '100px' }}>
                  <Stack align="center" spacing="md">
                    <IconMessage size={64} color="#ccc" />
                    <Text size="lg" weight={600} color="dimmed">
                      No messages yet
                    </Text>
                    <Text size="sm" color="dimmed">
                      Start the conversation!
                    </Text>
                  </Stack>
                </Center>
              ) : (
                <Stack spacing="md">
                  {messages.map(renderMessage)}
                </Stack>
              )}
            </Container>
          </ScrollArea>
        )}
      </Box>

      {/* Input Area */}
      <Paper
        p="md"
        radius={0}
        style={{
          backgroundColor: 'white',
          borderTop: `1px solid #E0E0E0`,
        }}
      >
        <Container size="md">
          <Group spacing="md" align="flex-end">
            <Textarea
              placeholder="Type a message..."
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyPress={handleKeyPress}
              maxLength={1000}
              autosize
              minRows={1}
              maxRows={4}
              style={{ flex: 1 }}
              styles={{
                input: {
                  backgroundColor: THEMED_LIGHT_BG,
                  borderRadius: '20px',
                  border: 'none',
                  padding: '10px 16px',
                },
              }}
            />
            <ActionIcon
              size={44}
              radius="xl"
              onClick={handleSend}
              disabled={!messageText.trim() || sending}
              style={{
                backgroundColor: !messageText.trim() || sending ? '#ccc' : PRIMARY_BROWN,
                color: 'white',
              }}
              loading={sending}
            >
              <IconSend size={20} />
            </ActionIcon>
          </Group>
        </Container>
      </Paper>
    </Box>
  );
}