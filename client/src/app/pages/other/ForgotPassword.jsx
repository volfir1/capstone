import {
  Grid,
  Paper,
  Title,
  Text,
  Button,
  Box,
  TextInput,
  Anchor,
  Stack,
  Center,
} from "@mantine/core";
import {
  IconMail,
  IconArrowLeft,
  IconSend,
  IconScale,
  IconShieldCheck,
  IconClock,
} from "@tabler/icons-react";
import lawImage from "../../../assets/images/law.jpg";
import toast, { Toaster } from "react-hot-toast";
import { doPasswordReset } from "@/firebase/auth";
import { useState } from "react";
import { PRIMARY_GOLD, PRIMARY_BROWN, MUTED_OLIVE, THEMED_LIGHT_BG, CHARCOAL, ACCENT_TAN } from "@utils/constants";

export default function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await doPasswordReset(email);
            toast.success('Password reset email sent!');
        } catch (error) {
            toast.error('Failed to send password reset email');
        } finally {
            setLoading(false);
        }
    };

  return (
    <Box h="100vh" style={{ overflow: "hidden" }}>
        <Toaster />
      <Grid h="100%" gutter={0}>
        {/* Left Side - Hero Section */}
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
                  Account Recovery
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
                  Reset Your
                  <br />
                  <Text span c={PRIMARY_GOLD} inherit>Password</Text>
                </Title>
                <Text 
                  c="rgba(255, 255, 255, 0.95)" 
                  size="lg" 
                  mt="xl" 
                  maw={450} 
                  lh={1.7}
                  fw={400}
                >
                  Don't worry, we'll send you a secure link to reset your password and get you back on track. Your account security is our priority.
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
                    <IconShieldCheck size={22} color="white" stroke={2} />
                  </Box>
                  <Box>
                    <Text c="white" size="sm" fw={600} lh={1.3}>
                      Secure Process
                    </Text>
                    <Text c="rgba(255, 255, 255, 0.8)" size="xs" lh={1.4}>
                      Encrypted password reset link
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
                    <IconClock size={22} color="white" stroke={2} />
                  </Box>
                  <Box>
                    <Text c="white" size="sm" fw={600} lh={1.3}>
                      Quick Recovery
                    </Text>
                    <Text c="rgba(255, 255, 255, 0.8)" size="xs" lh={1.4}>
                      Get back to your account fast
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
                    <IconScale size={22} color="white" stroke={2} />
                  </Box>
                  <Box>
                    <Text c="white" size="sm" fw={600} lh={1.3}>
                      Protected Access
                    </Text>
                    <Text c="rgba(255, 255, 255, 0.8)" size="xs" lh={1.4}>
                      Your data stays confidential
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

        {/* Right Side - Forgot Password Form */}
        <Grid.Col span={6}>
          <Paper 
            h="100vh" 
            style={{ 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center",
              position: 'relative'
            }}
          >
            <Box 
              w={450} 
              p={40}
              style={{
                backgroundColor: "white",
                borderRadius: 12,
              }}
            >
              {/* Logo/Brand */}
              <Box mb={20} style={{ textAlign: "right" }}>
                <Text size="24px" fw={700} style={{ lineHeight: 1 }}>
                  <Text span style={{ color: PRIMARY_GOLD }}>Just</Text>
                  <Text span style={{ color: PRIMARY_BROWN }}>Reach</Text>
                </Text>
                <Text size="xs" style={{ color: MUTED_OLIVE, marginTop: 2, lineHeight: 1.2 }}>
                  Accessible Legal Services Network
                </Text>
              </Box>
             
              {/* Forgot Password Title */}
              <Box mb={32}>
                <Title order={2} size="24px" fw={600} style={{ color: CHARCOAL, marginBottom: 8 }}>
                  Forgot Password?
                </Title>
                <Text style={{ color: MUTED_OLIVE, fontSize: 14 }}>
                  Enter your email address and we'll send you a link to reset your password
                </Text>
              </Box>

              {/* Form */}
            <form onSubmit={handleSubmit}>
              <Stack spacing={20}>
                <Box>
                  <Text size="sm" fw={500} mb={8} style={{ color: CHARCOAL, fontSize: 13 }}>
                    Email Address
                  </Text>
                  <TextInput
                    leftSection={<IconMail size={16} stroke={1.5} style={{ color: ACCENT_TAN }} />}
                    placeholder="your.email@example.com"
                    size="md"
                    radius="md"
                    value={email}
                    required
                    type="email"
                    autoFocus
                    onChange={(e) => setEmail(e.target.value)}
                    styles={{
                      input: {
                        borderColor: THEMED_LIGHT_BG,
                        backgroundColor: "#FAFAF8",
                        fontSize: 14,
                        height: 48,
                        '&:focus': {
                          borderColor: PRIMARY_GOLD,
                          backgroundColor: "white",
                        },
                      },
                    }}
                  />
                </Box>

                <Button 
                  type="submit"
                  leftSection={<IconSend size={18} />}
                  size="md"
                  radius="md"
                  fullWidth
                  loading={loading}
                  styles={{
                    root: {
                      backgroundColor: PRIMARY_BROWN,
                      color: 'white',
                      fontWeight: 600,
                      fontSize: 14,
                      height: 48,
                      marginTop: 8,
                      border: 'none',
                      '&:hover': {
                        backgroundColor: PRIMARY_GOLD,
                      },
                    },
                  }}
                >
                  Send Reset Link
                </Button>

                <Center mt={16}>
                  <Anchor 
                    href="/login" 
                    fw={500}
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px',
                      color: PRIMARY_BROWN,
                      textDecoration: 'none',
                      fontSize: 14,
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = PRIMARY_GOLD}
                    onMouseLeave={(e) => e.currentTarget.style.color = PRIMARY_BROWN}
                  >
                    <IconArrowLeft size={16} />
                    Back to Login
                  </Anchor>
                </Center>

                <Center mt={8}>
                  <Text size="sm" style={{ color: MUTED_OLIVE, fontSize: 13 }}>
                    Don't have an account?{" "}
                    <Anchor 
                      href="/signup" 
                      fw={600}
                      style={{
                        color: PRIMARY_BROWN,
                        textDecoration: 'none',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.color = PRIMARY_GOLD}
                      onMouseLeave={(e) => e.currentTarget.style.color = PRIMARY_BROWN}
                    >
                      Sign up
                    </Anchor>
                  </Text>
                </Center>
              </Stack>
            </form>
            </Box>
          </Paper>
        </Grid.Col>
      </Grid>
    </Box>
  );
}