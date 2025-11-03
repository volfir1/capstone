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
} from "@tabler/icons-react";
import lawImage from "../../../assets/images/law.jpg";
import toast, { Toaster } from "react-hot-toast";
import { doPasswordReset } from "@/firebase/auth";
import { useState } from "react";

export default function ForgotPassword() {
    const [email, setEmail] = useState(""); // Add email state
    const [loading, setLoading] = useState(false); // Add loading state

    const handleSubmit = async (e) =>{
        e.preventDefault()
        setLoading(true)
        try{
            await doPasswordReset(email)
            toast.success('Password reset email sent!')
        }catch(error){
            toast.error('Failed to send password reset email')
        }finally{
            setLoading(false)
        }
    }

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
              backgroundImage: `linear-gradient(135deg, rgba(126, 48, 225, 0.8), rgba(226, 110, 229, 0.8)), url(${lawImage})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              padding: "4rem",
            }}
          >
            <Box>
              <Title order={1} c="white" size="3.5rem" fw={700} lts={-1}>
                RESET PASSWORD
              </Title>
              <Text c="white" size="xl" mt="lg" maw={400} lh={1.6}>
                Don't worry, we'll send you a secure link to reset your password and get you back on track.
              </Text>
            </Box>
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
            <Box w={450}>
              {/* Logo/Brand */}
              <Text size="xl" ta={"right"} c={"#E26EE5"} mb={'20'}>
                Just<span style={{ color: "#7E30E1" }}>Reach</span>
              </Text>
             
              {/* Forgot Password Title */}
              <Box mb="xl">
                <Title order={2} size="2rem" fw={600} mb="xs">
                  Forgot Password?
                </Title>
                <Text c="dimmed" size="md">
                  Enter your email address and we'll send you a link to reset your password
                </Text>
              </Box>

              {/* Form */}
            <form onSubmit={handleSubmit}>
              <Stack gap="lg" >
                <TextInput
                  leftSection={<IconMail size={20} stroke={1.5} />}
                  label="Email Address"
                  placeholder="Enter your email"
                  size="md"
                  radius="md"
                  value={email}
                  required
                  type="email"
                  onChange={(e) => setEmail(e.target.value)}
                  styles={{
                    label: { fontWeight: 500, marginBottom: 8 }
                  }}
                />

                <Button 
                  type="submit"
                  leftSection={<IconSend size={20} />}
                  size="md"
                  radius="md"
                  gradient={{ from: '#7E30E1', to: '#E26EE5' }}
                  variant="gradient"
                  fullWidth
                  mt="md"
                  loading={loading}
                >
                  Send Reset Link
                </Button>

                <Center mt="xl">
                  <Anchor 
                    href="/login" 
                    c="#7E30E1" 
                    fw={500}
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px',
                     
                    }}
                    
                  >
                    <IconArrowLeft size={16} />
                    Back to Login
                  </Anchor>
                </Center>

                <Center mt="lg">
                  <Text size="sm" c="dimmed" ta="center">
                    Don't have an account?{" "}
                    <Anchor href="/signup" c="#7E30E1" fw={500} >
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