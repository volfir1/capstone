import {
  Paper,
  Title,
  Text,
  Button,
  Box,
  Stack,
  Center,
} from "@mantine/core";
import {
  IconHome,
  IconArrowLeft,
  IconSearch,
} from "@tabler/icons-react";

export default function PageNotFound() {
  const handleGoBack = () => {
    window.history.back();
  };

  return (
    <Box h="100vh" style={{ overflow: "hidden" }}>
      <Paper 
        h="100vh" 
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: `linear-gradient(135deg, rgba(126, 48, 225, 0.1), rgba(226, 110, 229, 0.1))`,
          position: 'relative'
        }}
      >
        {/* Logo/Brand */}
        <Box style={{ position: 'absolute', top: 20, right: 20 }}>
          <Text size="xl" c="#E26EE5">
            Just<span style={{ color: "#7E30E1" }}>Reach</span>
          </Text>
        </Box>

        <Center>
          <Stack align="center" gap="lg" maw={500} ta="center">
            {/* 404 Number */}
            <Title 
              order={1} 
              size="5rem" 
              fw={900} 
              c="#7E30E1" 
              lts={-2}
              style={{
                background: `linear-gradient(135deg, #7E30E1, #E26EE5)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}
            >
              404
            </Title>

            {/* Main Message */}
            <Box>
              <Title order={2} size="2rem" fw={700} mb="md" c="dark">
                Oops! Page Not Found
              </Title>
              <Text size="md" c="dimmed" lh={1.6} maw={450}>
                The page you're looking for seems to have wandered off. 
                Don't worry, even the best legal minds sometimes take a wrong turn.
              </Text>
            </Box>

            {/* Illustration/Icon */}
            <Box 
              w={80} 
              h={80} 
              style={{
                borderRadius: '50%',
                background: `linear-gradient(135deg, rgba(126, 48, 225, 0.1), rgba(226, 110, 229, 0.1))`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '3px solid #E26EE5'
              }}
            >
              <IconSearch size={32} color="#7E30E1" stroke={1.5} />
            </Box>

            {/* Action Buttons */}
            <Stack align="center" gap="md" mt="lg">
              <Button 
                leftSection={<IconHome size={18} />}
                size="md"
                radius="md"
                gradient={{ from: '#7E30E1', to: '#E26EE5' }}
                variant="gradient"
                w={220}
              >
                Go to Homepage
              </Button>

              <Button 
                leftSection={<IconArrowLeft size={18} />}
                variant="outline"
                size="md"
                radius="md"
                color="#7E30E1"
                w={220}
                onClick={handleGoBack}
              >
                Go Back
              </Button>
            </Stack>

            {/* Additional Help */}
            <Box mt="xl" p="lg" style={{ 
              border: '1px solid #E26EE5', 
              borderRadius: '12px',
              background: 'rgba(226, 110, 229, 0.05)'
            }}>
              <Text size="sm" c="dimmed" ta="center">
                Need help? Contact our support team or try searching for what you need.
              </Text>
            </Box>
          </Stack>
        </Center>
      </Paper>
    </Box>
  );
}