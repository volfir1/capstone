import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
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
  Badge,
  Divider,
  TextInput,
} from '@mantine/core';
import {
  IconSend,
  IconMessage,
  IconUser,
  IconSearch,
  IconPaperclip,
  IconPhoto,
} from '@tabler/icons-react';
import { PRIMARY_GOLD, PRIMARY_BROWN, MUTED_OLIVE, THEMED_LIGHT_BG, CHARCOAL } from '@utils/constants';
import { useAuth } from '@/context/authContext';
import { notifications } from '@mantine/notifications';
import apiClient from '@config/api/apiClient';

export default function AttorneyMessenger() {
  const navigate = useNavigate();
  const { currentUser, userData } = useAuth();
  
  const [chatList, setChatList] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sending, setSending] = useState(false);
  
  const viewport = useRef(null);
  const isFetchingRef = useRef(false);

  useEffect(() => {
    fetchChatList();
    
    // Refresh chat list every 30 seconds
    const interval = setInterval(fetchChatList, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedChat) {
      fetchMessages(selectedChat.case._id);
      markAsRead(selectedChat.case._id);
      
      // Auto-refresh messages every 15 seconds
      const interval = setInterval(() => fetchMessages(selectedChat.case._id), 15000);
      return () => clearInterval(interval);
    }
  }, [selectedChat]);

  useEffect(() => {
    // Scroll to bottom when messages change
    if (viewport.current) {
      viewport.current.scrollTo({ top: viewport.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

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

  const fetchMessages = async (caseId) => {
    if (!caseId || isFetchingRef.current) return;
    
    isFetchingRef.current = true;
    try {
      setMessagesLoading(true);
      const response = await apiClient.get(`/chat/case/${caseId}`);
      
      if (response.data.success) {
        setMessages(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      if (error.response?.status !== 429) {
        notifications.show({
          title: 'Error',
          message: 'Failed to load messages',
          color: 'red',
        });
      }
    } finally {
      setMessagesLoading(false);
      isFetchingRef.current = false;
    }
  };

  const markAsRead = async (caseId) => {
    if (!caseId) return;

    try {
      await apiClient.put(`/chat/read/${caseId}`);
      // Refresh chat list to update unread counts
      fetchChatList();
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const handleSend = async () => {
    if (!messageText.trim() || sending || !selectedChat) return;

    try {
      setSending(true);
      const response = await apiClient.post('/chat/send', {
        caseId: selectedChat.case._id,
        message: messageText.trim(),
      });

      if (response.data.success) {
        setMessages((prev) => [...prev, response.data.data]);
        setMessageText('');
        // Refresh chat list to update last message
        fetchChatList();
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
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatMessageTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderMessage = (message) => {
    const isMyMessage = message.senderId.email === currentUser?.email || 
                        message.senderId._id === userData?._id ||
                        message.senderId.email === userData?.email;
    const senderName = `${message.senderId.firstName} ${message.senderId.lastName}`;
    const time = formatMessageTime(message.createdAt);

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

  const filteredChatList = chatList.filter((chat) => {
    const clientName = `${chat.case.userId.firstName} ${chat.case.userId.lastName}`.toLowerCase();
    const caseTitle = chat.case.caseTitle.toLowerCase();
    const query = searchQuery.toLowerCase();
    return clientName.includes(query) || caseTitle.includes(query);
  });

  return (
    <Box style={{ height: '100vh', display: 'flex', backgroundColor: 'white' }}>
      {/* Left Sidebar - Chat List */}
      <Paper
        style={{
          width: '380px',
          borderRight: `1px solid #E0E0E0`,
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 0,
        }}
      >
        {/* Sidebar Header */}
        <Box p="lg" style={{ borderBottom: `1px solid #E0E0E0` }}>
          <Text size="xl" weight={700} mb="md" style={{ color: CHARCOAL }}>
            Messages
          </Text>
          <TextInput
            placeholder="Search conversations..."
            icon={<IconSearch size={16} />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            styles={{
              input: { backgroundColor: THEMED_LIGHT_BG, border: 'none' },
            }}
          />
        </Box>

        {/* Chat List */}
        <ScrollArea style={{ flex: 1 }}>
          {loading ? (
            <Center py="xl">
              <Loader size="md" color={PRIMARY_BROWN} />
            </Center>
          ) : filteredChatList.length === 0 ? (
            <Center py="xl">
              <Stack align="center" spacing="xs">
                <IconMessage size={48} color="#ccc" />
                <Text size="sm" color="dimmed">
                  No conversations
                </Text>
              </Stack>
            </Center>
          ) : (
            <Stack spacing={0}>
              {filteredChatList.map((chatItem) => (
                <Box
                  key={chatItem.case._id}
                  p="md"
                  style={{
                    cursor: 'pointer',
                    backgroundColor: selectedChat?.case._id === chatItem.case._id ? THEMED_LIGHT_BG : 'white',
                    borderBottom: `1px solid #F0F0F0`,
                    transition: 'background-color 0.2s ease',
                  }}
                  onClick={() => setSelectedChat(chatItem)}
                  onMouseEnter={(e) => {
                    if (selectedChat?.case._id !== chatItem.case._id) {
                      e.currentTarget.style.backgroundColor = '#FAFAFA';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedChat?.case._id !== chatItem.case._id) {
                      e.currentTarget.style.backgroundColor = 'white';
                    }
                  }}
                >
                  <Group spacing="md" align="flex-start">
                    <Avatar
                      size={48}
                      radius="xl"
                      color={PRIMARY_BROWN}
                      style={{ border: `2px solid ${PRIMARY_GOLD}` }}
                    >
                      <IconUser size={24} />
                    </Avatar>
                    <Box style={{ flex: 1, minWidth: 0 }}>
                      <Group position="apart" mb={4}>
                        <Text weight={700} size="sm" style={{ color: CHARCOAL }} lineClamp={1}>
                          {chatItem.case.userId.firstName} {chatItem.case.userId.lastName}
                        </Text>
                        {chatItem.lastMessage && (
                          <Text size="xs" color="dimmed">
                            {formatTime(chatItem.lastMessage.createdAt)}
                          </Text>
                        )}
                      </Group>
                      <Text size="xs" color="dimmed" mb={4} lineClamp={1}>
                        {chatItem.case.caseTitle}
                      </Text>
                      <Group spacing="xs">
                        {chatItem.lastMessage && (
                          <Text size="xs" color="dimmed" lineClamp={1} style={{ flex: 1 }}>
                            {chatItem.lastMessage.message}
                          </Text>
                        )}
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
                    </Box>
                  </Group>
                </Box>
              ))}
            </Stack>
          )}
        </ScrollArea>
      </Paper>

      {/* Right Side - Chat Messages */}
      <Box style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: THEMED_LIGHT_BG }}>
        {!selectedChat ? (
          <Center style={{ height: '100%' }}>
            <Stack align="center" spacing="md">
              <IconMessage size={80} color="#ccc" />
              <Text size="xl" weight={600} color="dimmed">
                Select a conversation
              </Text>
              <Text size="sm" color="dimmed">
                Choose a client from the list to start messaging
              </Text>
            </Stack>
          </Center>
        ) : (
          <>
            {/* Chat Header */}
            <Paper
              p="md"
              style={{
                borderBottom: `1px solid #E0E0E0`,
                backgroundColor: 'white',
              }}
            >
              <Group spacing="md">
                <Avatar
                  size={40}
                  radius="xl"
                  color={PRIMARY_BROWN}
                  style={{ border: `2px solid ${PRIMARY_GOLD}` }}
                >
                  <IconUser size={20} />
                </Avatar>
                <Box>
                  <Text weight={700} size="md" style={{ color: CHARCOAL }}>
                    {selectedChat.case.userId.firstName} {selectedChat.case.userId.lastName}
                  </Text>
                  <Group spacing="xs">
                    <Text size="xs" color="dimmed">
                      {selectedChat.case.caseTitle}
                    </Text>
                    <Text size="xs" color="dimmed">•</Text>
                    <Text size="xs" color="dimmed">
                      #{selectedChat.case.caseNumber}
                    </Text>
                  </Group>
                </Box>
              </Group>
            </Paper>

            {/* Messages Area */}
            <Box style={{ flex: 1, overflow: 'hidden' }}>
              {messagesLoading && messages.length === 0 ? (
                <Center style={{ height: '100%' }}>
                  <Stack align="center" spacing="md">
                    <Loader size="lg" color={PRIMARY_BROWN} />
                    <Text color="dimmed">Loading messages...</Text>
                  </Stack>
                </Center>
              ) : (
                <ScrollArea style={{ height: '100%' }} viewportRef={viewport}>
                  <Box p="lg">
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
                  </Box>
                </ScrollArea>
              )}
            </Box>

            {/* Input Area */}
            <Paper
              p="md"
              style={{
                borderTop: `1px solid #E0E0E0`,
                backgroundColor: 'white',
              }}
            >
              <Group spacing="md" align="center" noWrap>
                {/* Attachment Icons */}
                <Group spacing="xs" style={{ flexShrink: 0 }}>
                  <ActionIcon
                    size={36}
                    radius="xl"
                    variant="subtle"
                    color={MUTED_OLIVE}
                    onClick={() => notifications.show({
                      title: 'Coming Soon',
                      message: 'File attachment feature will be available soon',
                      color: 'blue',
                    })}
                  >
                    <IconPaperclip size={20} />
                  </ActionIcon>
                  <ActionIcon
                    size={36}
                    radius="xl"
                    variant="subtle"
                    color={MUTED_OLIVE}
                    onClick={() => notifications.show({
                      title: 'Coming Soon',
                      message: 'Image upload feature will be available soon',
                      color: 'blue',
                    })}
                  >
                    <IconPhoto size={20} />
                  </ActionIcon>
                </Group>

                {/* Input Box with Send Button Inside */}
                <Box
                  style={{
                    flex: 1,
                    position: 'relative',
                    backgroundColor: THEMED_LIGHT_BG,
                    borderRadius: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    paddingRight: '8px',
                  }}
                >
                  <Textarea
                    placeholder="Type a message..."
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyPress={handleKeyPress}
                    maxLength={1000}
                    autosize
                    minRows={1}
                    maxRows={4}
                    styles={{
                      root: { flex: 1 },
                      input: {
                        backgroundColor: 'transparent',
                        border: 'none',
                        padding: '10px 16px',
                        paddingRight: '50px',
                        resize: 'none',
                      },
                    }}
                  />
                  <ActionIcon
                    size={36}
                    radius="xl"
                    onClick={handleSend}
                    disabled={!messageText.trim() || sending}
                    loading={sending}
                    style={{
                      position: 'absolute',
                      right: '8px',
                      backgroundColor: !messageText.trim() || sending ? '#ccc' : PRIMARY_BROWN,
                      color: 'white',
                    }}
                  >
                    <IconSend size={18} />
                  </ActionIcon>
                </Box>
              </Group>
            </Paper>
          </>
        )}
      </Box>
    </Box>
  );
}