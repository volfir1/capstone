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
    <Box bg="white" mih="100vh">
      <Container size="xl" p={0}>
        {/* Header Section */}
        <Paper 
          shadow="none" 
          p="xl" 
          mb={0} 
          bg="white" 
          style={{ 
            borderTop: `4px solid ${PRIMARY_BROWN}`, 
            borderBottom: `1px solid ${THEMED_LIGHT_BG}` 
          }}
        >
          <Group mb="md">
            <IconScale size={32} color={PRIMARY_BROWN} />
            <Title order={2} c={CHARCOAL}>
              Submit a Legal Case
            </Title>
          </Group>
          <Text size="sm" c={MUTED_OLIVE}>
            Please provide detailed information about your case. All fields marked with an asterisk (*) are required.
          </Text>
        </Paper>

        {/* Form Section */}
        <Paper shadow="none" p="xl" bg="white" mb={0}>
          <Box maw={900} mx="auto">
            <CaseForm onSubmit={handleSubmit} />
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}