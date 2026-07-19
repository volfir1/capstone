import { Grid, Paper, Title, Text, Box, Stack } from "@mantine/core";
import { IconScale, IconShieldCheck, IconUsers } from "@tabler/icons-react";
import lawImage from "../../../../assets/images/law.jpg";
import { PRIMARY_GOLD, PRIMARY_BROWN, CHARCOAL, THEMED_LIGHT_BG } from "@utils/constants";

export const LoginHero = () => {
  return (
    <Grid.Col span={6}>
      <Paper
        h="100vh"
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          backgroundImage: `linear-gradient(135deg, rgba(139, 69, 19, 0.92), rgba(196, 171, 125, 0.88)), url(${lawImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          padding: "4rem",
          position: "relative",
        }}
      >
        {/* Decorative Element */}
        <Box
          style={{
            position: "absolute",
            top: 40,
            left: 40,
            width: 60,
            height: 4,
            backgroundColor: PRIMARY_GOLD,
            borderRadius: 2,
          }}
        />

        <Stack spacing="xl">
          {/* Main Heading */}
          <Box>
            <Text 
              size="sm" 
              fw={600} 
              tt="uppercase" 
              lts={2}
              c={PRIMARY_GOLD}
              mb="md"
            >
              Legal Services Network
            </Text>
            <Title 
              order={1} 
              c="white" 
              size="3.2rem" 
              fw={700} 
              lh={1.15}
              style={{ 
                textShadow: "0 2px 12px rgba(0, 0, 0, 0.3)",
                letterSpacing: "-0.5px",
              }}
            >
              Welcome Back to
              <br />
              <Text span c={PRIMARY_GOLD} inherit>JustReach</Text>
            </Title>
            <Text 
              c="rgba(255, 255, 255, 0.95)" 
              size="lg" 
              mt="xl" 
              maw={450} 
              lh={1.7}
              fw={400}
            >
              Access your legal assistance dashboard and continue your journey towards justice. Your trusted partner in accessible legal services.
            </Text>
          </Box>

          {/* Feature Pills */}
          <Stack spacing="md" mt="xl">
            <Box
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "12px 20px",
                backgroundColor: "rgba(255, 255, 255, 0.12)",
                backdropFilter: "blur(10px)",
                borderRadius: 12,
                border: "1px solid rgba(255, 255, 255, 0.2)",
                maxWidth: 380,
              }}
            >
              <Box
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  backgroundColor: PRIMARY_GOLD,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <IconScale size={22} color="white" stroke={2} />
              </Box>
              <Box>
                <Text c="white" size="sm" fw={600} lh={1.3}>
                  Expert Legal Guidance
                </Text>
                <Text c="rgba(255, 255, 255, 0.8)" size="xs" lh={1.4}>
                  Professional support when you need it
                </Text>
              </Box>
            </Box>

            <Box
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "12px 20px",
                backgroundColor: "rgba(255, 255, 255, 0.12)",
                backdropFilter: "blur(10px)",
                borderRadius: 12,
                border: "1px solid rgba(255, 255, 255, 0.2)",
                maxWidth: 380,
              }}
            >
              <Box
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  backgroundColor: PRIMARY_GOLD,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <IconShieldCheck size={22} color="white" stroke={2} />
              </Box>
              <Box>
                <Text c="white" size="sm" fw={600} lh={1.3}>
                  Secure & Confidential
                </Text>
                <Text c="rgba(255, 255, 255, 0.8)" size="xs" lh={1.4}>
                  Your information is protected
                </Text>
              </Box>
            </Box>

            <Box
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "12px 20px",
                backgroundColor: "rgba(255, 255, 255, 0.12)",
                backdropFilter: "blur(10px)",
                borderRadius: 12,
                border: "1px solid rgba(255, 255, 255, 0.2)",
                maxWidth: 380,
              }}
            >
              <Box
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  backgroundColor: PRIMARY_GOLD,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <IconUsers size={22} color="white" stroke={2} />
              </Box>
              <Box>
                <Text c="white" size="sm" fw={600} lh={1.3}>
                  Community Support
                </Text>
                <Text c="rgba(255, 255, 255, 0.8)" size="xs" lh={1.4}>
                  Join thousands seeking justice
                </Text>
              </Box>
            </Box>
          </Stack>
        </Stack>

        {/* Bottom decorative element */}
        <Box
          style={{
            position: "absolute",
            bottom: 40,
            left: 40,
            right: 40,
            height: 1,
            backgroundColor: "rgba(196, 171, 125, 0.3)",
          }}
        />
      </Paper>
    </Grid.Col>
  );
};