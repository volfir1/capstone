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
import lawImage from "../../../assets/images/law.jpg";
import { PRIMARY_GOLD, PRIMARY_BROWN, MUTED_OLIVE,  CHARCOAL } from "@utils/constants";

export default function PageNotFound() {
  const handleGoBack = () => {
    window.history.back();
  };

  const handleGoHome = () => {
    window.location.href = "/";
  };

  return (
    <Box h="100vh" style={{ overflow: "hidden" }}>
      <Paper 
        h="100vh" 
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundImage: `linear-gradient(135deg, rgba(139, 69, 19, 0.85), rgba(196, 171, 125, 0.85)), url(${lawImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          position: 'relative'
        }}
      >
        {/* Logo/Brand */}
        <Box style={{ position: 'absolute', top: 24, right: 24 }}>
          <Text size="20px" fw={700} style={{ lineHeight: 1 }}>
            <Text span style={{ color: PRIMARY_GOLD }}>Just</Text>
            <Text span style={{ color: "white" }}>Reach</Text>
          </Text>
        </Box>

        <Center>
          <Stack align="center" spacing="lg" maw={500} ta="center">
            {/* 404 Number */}
            <Title 
              order={1} 
              size="5rem" 
              fw={900}
              lts={-3}
              style={{
                color: PRIMARY_GOLD,
                textShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
                lineHeight: 1,
                marginBottom: 8,
              }}
            >
              404
            </Title>

            {/* Main Message */}
            <Box
              p={24}
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.95)",
                borderRadius: 12,
                border: `2px solid ${PRIMARY_GOLD}`,
                backdropFilter: "blur(10px)",
              }}
            >
              <Title order={2} size="22px" fw={700} mb={12} style={{ color: CHARCOAL }}>
                Oops! Page Not Found
              </Title>
              <Text size="sm" style={{ color: MUTED_OLIVE, fontSize: 14 }} lh={1.6}>
                The page you're looking for seems to have wandered off. 
                Don't worry, even the best legal minds sometimes take a wrong turn.
              </Text>
            </Box>

            {/* Illustration/Icon */}
            <Box 
              w={70} 
              h={70} 
              style={{
                borderRadius: '50%',
                background: PRIMARY_GOLD,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: `3px solid white`,
                boxShadow: "0 4px 16px rgba(0, 0, 0, 0.2)",
              }}
            >
              <IconSearch size={32} color="white" stroke={2} />
            </Box>

            {/* Action Buttons */}
            <Stack align="center" spacing="sm" mt="md" w="100%">
              <Button 
                leftSection={<IconHome size={18} />}
                size="md"
                radius="md"
                w={220}
                onClick={handleGoHome}
                styles={{
                  root: {
                    backgroundColor: PRIMARY_BROWN,
                    color: 'white',
                    fontWeight: 600,
                    fontSize: 14,
                    height: 44,
                    border: 'none',
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
                    '&:hover': {
                      backgroundColor: PRIMARY_GOLD,
                      transform: 'translateY(-2px)',
                      boxShadow: "0 6px 16px rgba(0, 0, 0, 0.3)",
                    },
                  },
                }}
              >
                Go to Homepage
              </Button>

              <Button 
                leftSection={<IconArrowLeft size={18} />}
                variant="outline"
                size="md"
                radius="md"
                w={220}
                onClick={handleGoBack}
                styles={{
                  root: {
                    borderColor: 'white',
                    color: 'white',
                    fontWeight: 600,
                    fontSize: 14,
                    height: 44,
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(10px)',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      borderColor: PRIMARY_GOLD,
                      transform: 'translateY(-2px)',
                    },
                  },
                }}
              >
                Go Back
              </Button>
            </Stack>

            {/* Additional Help */}
            <Box 
              mt="md" 
              p={16}
              style={{ 
                border: `2px solid ${PRIMARY_GOLD}`, 
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(10px)',
                maxWidth: 420,
              }}
            >
              <Text size="xs" style={{ color: MUTED_OLIVE, fontSize: 12 }} ta="center" fw={500}>
                Need help? Contact our support team or visit our homepage to find what you're looking for.
              </Text>
            </Box>
          </Stack>
        </Center>
      </Paper>
    </Box>
  );
}