/* Chat UI disabled: Attorney messenger component is commented out per checklist.
   To restore, revert this file to the previous implementation. */

import React from 'react';

export default function AttorneyMessenger() {
  // Chat disabled — render nothing to remove UI.
  return null;
}
    const senderName = `${message.senderId.firstName} ${message.senderId.lastName}`;
    const senderRole = message.senderId.role || message.senderRole;
    const displayName = senderRole && senderRole !== 'user' ? 
      `${senderName} (${senderRole.charAt(0).toUpperCase() + senderRole.slice(1)})` : 
      senderName;
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
            {displayName}
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
                        {chatItem.lastMessage ? (
                          <Text size="xs" color="dimmed" lineClamp={1} style={{ flex: 1 }}>
                            {chatItem.lastMessage.message}
                          </Text>
                        ) : (
                          <Text size="xs" color="dimmed" lineClamp={1} style={{ flex: 1, fontStyle: 'italic' }}>
                            No messages yet - Click to start conversation
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
                  <Group spacing="xs" align="center">
                    <Text weight={700} size="md" style={{ color: CHARCOAL }}>
                      {selectedChat.case.userId.firstName} {selectedChat.case.userId.lastName}
                    </Text>
                    {selectedChat.roleThread && (
                      <Badge 
                        size="sm" 
                        style={{ 
                          backgroundColor: PRIMARY_GOLD, 
                          color: CHARCOAL,
                          textTransform: 'capitalize'
                        }}
                      >
                        {selectedChat.roleThread} Thread
                      </Badge>
                    )}
                  </Group>
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