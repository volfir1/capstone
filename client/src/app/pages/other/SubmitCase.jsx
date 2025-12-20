import React from 'react';
import {
  Container,
  Paper,
  Box,
  Title,
  Group,
  Text,
} from '@mantine/core';
import { IconScale } from '@tabler/icons-react';
import { 
  PRIMARY_BROWN, 
  MUTED_OLIVE, 
  THEMED_LIGHT_BG, 
  CHARCOAL, 
} from "@/utils/constants";
import CaseForm from '@/components/forms/CaseForm';

export default function SubmitCase() {
  const handleSubmit = (formData) => {
    console.log('Form submitted with data:', formData);
    // Handle form submission here
  };

  return (
    <Box bg={THEMED_LIGHT_BG} mih="100vh" py="xl">
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
        {/* Header Section */}
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
          <Group gap="md" align="center">
            <Box
              style={{
                width: 48,
                height: 48,
                borderRadius: '12px',
                background: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <IconScale size={24} color={PRIMARY_BROWN} stroke={2.5} />
            </Box>
            <Box>
              <Title order={2} c="white" mb={4}>
                Submit a Legal Case
              </Title>
              <Text c="rgba(255, 255, 255, 0.9)" size="sm" fw={500}>
                Please provide detailed information about your case. All fields marked with an asterisk (*) are required.
              </Text>
            </Box>
          </Group>
        </Paper>

        {/* Form Section */}
        <Paper shadow="xs" p="xl" radius="lg" bg="white">
          <Box maw={900} mx="auto">
            <CaseForm onSubmit={handleSubmit} />
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}