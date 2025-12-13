import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  Container,
  Paper,
  Text,
  Box,
  Group,
  Stack,
  Textarea,
  ActionIcon,
  ScrollArea,
  Loader,
  Center,
  Avatar,
} from '@mantine/core';
import {
  IconArrowLeft,
  IconSend,
  IconMessage,
} from '@tabler/icons-react';
import { PRIMARY_GOLD, PRIMARY_BROWN, MUTED_OLIVE, THEMED_LIGHT_BG, CHARCOAL } from '@utils/constants';
import { useAuth } from '@/context/authContext';
import { notifications } from '@mantine/notifications';
import apiClient from '@config/api/apiClient';

export default function AttorneyChat() {
  const navigate = useNavigate();
  const { caseId } = useParams();
  const location = useLocation();
  const clientName = location.state?.clientName || 'Client';
  
  const { currentUser, userData } = useAuth();
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const viewport = useRef(null);
  const isFetchingRef = useRef(false);

  useEffect(() => {
    fetchMessages();
    
    // Auto-refresh every 15 seconds
    const interval = setInterval(fetchMessages, 15000);
    
    return () => clearInterval(interval);
  }, [caseId]);

  useEffect(() => {
    // Scroll to bottom when messages change
    if (viewport.current) {
      viewport.current.scrollTo({ top: viewport.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    // Mark messages as read when component mounts
    if (caseId) {
      markAsRead();
    }
  }, [caseId]);

  const fetchMessages = async () => {
    if (!caseId || isFetchingRef.current) return;
    
    isFetchingRef.current = true;
    try {
      setLoading(true);
      const response = await apiClient.get(`/chat/case/${caseId}`);
      
      if (response.data.success) {
        setMessages(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      // Don't show notification for rate limit errors during auto-refresh
      if (error.response?.status !== 429) {
        notifications.show({
          title: 'Error',
          message: 'Failed to load messages',
          color: 'red',
        });
      }
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  };

  const markAsRead = async () => {
    if (!caseId) return;

    try {
      await apiClient.put(`/chat/read/${caseId}`);
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const handleSend = async () => {
    if (!messageText.trim() || sending) return;

    try {
      setSending(true);
      const response = await apiClient.post('/chat/send', {
        caseId,
        message: messageText.trim(),
      });

      if (response.data.success) {
        setMessages((prev) => [...prev, response.data.data]);
        setMessageText('');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to send message',
        color: 'red',
      });
    } finally {
      setSending(false);
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
    // Check by email or by _id to determine if it's the attorney's message
    const isMyMessage = message.senderId.email === currentUser?.email || 
                        message.senderId._id === userData?._id ||
                        message.senderId.email === userData?.email;
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
                {clientName}
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
        {loading && messages.length === 0 ? (
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
              loading={sending}
              style={{
                backgroundColor: !messageText.trim() || sending ? '#ccc' : PRIMARY_BROWN,
                color: 'white',
              }}
            >
              <IconSend size={20} />
            </ActionIcon>
          </Group>
        </Container>
      </Paper>
    </Box>
  );
}