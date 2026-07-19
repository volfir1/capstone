import { useState, useRef, useEffect } from 'react';
import {
  Container,
  Paper,
  TextInput,
  ActionIcon,
  Stack,
  Group,
  Text,
  Box,
  Button,
  LoadingOverlay,
  Badge,
  ScrollArea,
} from '@mantine/core';
import { IconSend, IconRobot, IconUser, IconArrowLeft } from '@tabler/icons-react';
import { useNavigate } from 'react-router';
import axios from 'axios';

export default function AIChatbot() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([
    {
      id: '1',
      text: "Hello! 👋 I'm JustReach AI. I can provide general legal information about Philippine law. How can I help you today?",
      isBot: true,
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const viewport = useRef(null);

  const sendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage = {
      id: Date.now().toString(),
      text: inputText,
      isBot: false,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await axios.post(`/api/ai-assistant/message`, {
        message: inputText,
      });

      const botMessage = {
        id: (Date.now() + 1).toString(),
        text: response.data.data.message,
        isBot: true,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error('Chatbot error:', error);
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        text: 'Sorry, I encountered an error. Please try again.',
        isBot: true,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    if (viewport.current) {
      viewport.current.scrollTo({ top: viewport.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const suggestedQuestions = [
    "What are my rights as an employee?",
    "How do I file a labor complaint?",
    "Ano ang minimum wage sa Pilipinas?",
  ];

  return (
    <Container size="lg" style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Paper shadow="sm" p="md" mb="md" mt="md">
        <Group justify="space-between">
          <Group>
            <ActionIcon 
              variant="subtle" 
              size="lg" 
              onClick={() => navigate('/')}
            >
              <IconArrowLeft size={20} />
            </ActionIcon>
            <IconRobot size={28} color="#C4AB7D" />
            <div>
              <Text size="lg" fw={600}>JustReach AI</Text>
              <Group gap={4}>
                <Badge color="green" size="xs" circle />
                <Text size="xs" c="dimmed">Online</Text>
              </Group>
            </div>
          </Group>
          <Text size="sm" c="dimmed">General Legal Information</Text>
        </Group>
      </Paper>

      {/* Chat Area */}
      <Paper 
        shadow="sm" 
        p="md" 
        style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}
      >
        <LoadingOverlay visible={isLoading} />
        
        <ScrollArea 
          viewportRef={viewport}
          style={{ flex: 1 }}
          type="scroll"
        >
          <Stack gap="md" pb="md">
            {messages.map((message) => (
              <Group
                key={message.id}
                align="flex-start"
                justify={message.isBot ? 'flex-start' : 'flex-end'}
                wrap="nowrap"
              >
                {message.isBot && (
                  <Box
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      backgroundColor: '#C4AB7D',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <IconRobot size={20} color="white" />
                  </Box>
                )}

                <Paper
                  p="md"
                  style={{
                    maxWidth: '70%',
                    backgroundColor: message.isBot ? '#f8f9fa' : '#C4AB7D',
                    color: message.isBot ? '#000' : '#fff',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  <Text size="sm">{message.text}</Text>
                </Paper>

                {!message.isBot && (
                  <Box
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      backgroundColor: '#228be6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <IconUser size={20} color="white" />
                  </Box>
                )}
              </Group>
            ))}
          </Stack>

          {/* Suggested Questions (show only initially) */}
          {messages.length === 1 && (
            <Box mt="xl">
              <Text size="sm" fw={500} mb="sm">Try asking:</Text>
              <Stack gap="xs">
                {suggestedQuestions.map((question, index) => (
                  <Button
                    key={index}
                    variant="light"
                    color="gray"
                    size="sm"
                    onClick={() => setInputText(question)}
                    style={{ justifyContent: 'flex-start', textAlign: 'left' }}
                  >
                    {question}
                  </Button>
                ))}
              </Stack>
            </Box>
          )}
        </ScrollArea>

        {/* Input Area */}
        <Box mt="md">
          <Group gap="xs" align="flex-end">
            <TextInput
              placeholder="Type your question..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyPress}
              style={{ flex: 1 }}
              size="md"
              maxLength={500}
              disabled={isLoading}
            />
            <ActionIcon
              size={42}
              color="yellow.6"
              variant="filled"
              onClick={sendMessage}
              disabled={!inputText.trim() || isLoading}
            >
              <IconSend size={20} />
            </ActionIcon>
          </Group>
          <Text size="xs" c="dimmed" mt="xs">
            ⚠️ This AI provides general information only, not legal advice
          </Text>
        </Box>
      </Paper>
    </Container>
  );
}
