import {
  Paper,
  Title,
  Text,
  Button,
  Box,
  TextInput,
  PasswordInput,
  Anchor,
  Stack,
  Divider,
  Center,
} from "@mantine/core";
import { IconMail, IconLock, IconLogin2 } from "@tabler/icons-react";
import { SocialLoginButton } from "../buttons/SocialLoginButton";
import { loginValidationRules } from "@/utils/validation";
import { PRIMARY_GOLD, PRIMARY_BROWN, MUTED_OLIVE, THEMED_LIGHT_BG, CHARCOAL, ACCENT_TAN } from "@utils/constants";

// NO HOOK IMPORT HERE - only receives props
export const LoginForm = ({
  register,
  handleSubmit,
  errors,
  isSigningIn,
  errorMessage,
  onSubmit,
  onGoogleSignIn,
}) => {
  return (
    <Box 
      w={450} 
      p={40}
      style={{
        backgroundColor: "white",
        borderRadius: 12,
      }}
    >
      {/* Logo/Brand */}
      <Box mb={32} style={{ textAlign: "right" }}>
        <Text size="28px" fw={700} style={{ lineHeight: 1 }}>
          <Text span style={{ color: PRIMARY_GOLD }}>Just</Text>
          <Text span style={{ color: PRIMARY_BROWN }}>Reach</Text>
        </Text>
        <Text size="xs" style={{ color: MUTED_OLIVE, marginTop: 4, lineHeight: 1.2 }}>
          Accessible Legal Services Network
        </Text>
      </Box>

      {/* Login Title */}
      <Box mb={32}>
        <Title order={2} size="26px" fw={600} style={{ color: CHARCOAL, marginBottom: 8 }}>
          Welcome Back
        </Title>
        <Text style={{ color: MUTED_OLIVE, fontSize: 14 }}>
          Sign in to access your legal assistance
        </Text>
      </Box>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack spacing={20}>
          <Box>
            <Text size="sm" fw={500} mb={8} style={{ color: CHARCOAL }}>
              Email Address
            </Text>
            <TextInput
              leftSection={<IconMail size={18} stroke={1.5} style={{ color: ACCENT_TAN }} />}
              placeholder="lester@gmail.com"
              size="md"
              radius="md"
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
              error={errors.email?.message}
              {...register("email", loginValidationRules.email)}
            />
          </Box>

          <Box>
            <Text size="sm" fw={500} mb={8} style={{ color: CHARCOAL }}>
              Password
            </Text>
            <PasswordInput
              leftSection={<IconLock size={18} stroke={1.5} style={{ color: ACCENT_TAN }} />}
              placeholder="Enter your password"
              size="md"
              radius="md"
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
                innerInput: {
                  fontSize: 14,
                },
              }}
              error={errors.password?.message}
              {...register("password", loginValidationRules.password)}
            />
          </Box>

          <Box style={{ textAlign: "right", marginTop: -4 }}>
            <Anchor
              href="/forgot-password"
              size="sm"
              fw={500}
              style={{ 
                color: PRIMARY_BROWN,
                textDecoration: "none",
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = PRIMARY_GOLD}
              onMouseLeave={(e) => e.currentTarget.style.color = PRIMARY_BROWN}
            >
              Forgot your password?
            </Anchor>
          </Box>

          {errorMessage && (
            <Box 
              p={12}
              style={{ 
                backgroundColor: '#FEE2E2', 
                borderRadius: 8,
                border: '1px solid #FCA5A5',
              }}
            >
              <Text size="sm" fw={500} style={{ color: '#DC2626' }}>
                {errorMessage}
              </Text>
            </Box>
          )}

          <Button
            leftSection={<IconLogin2 size={20} />}
            size="md"
            radius="md"
            fullWidth
            type="submit"
            loading={isSigningIn}
            styles={{
              root: {
                backgroundColor: PRIMARY_BROWN,
                color: 'white',
                fontWeight: 600,
                fontSize: 15,
                height: 48,
                marginTop: 8,
                border: 'none',
                '&:hover': {
                  backgroundColor: PRIMARY_GOLD,
                },
              },
            }}
          >
            Sign In to Continue
          </Button>

          <Divider
            label={
              <Text size="xs" fw={500} style={{ color: MUTED_OLIVE }}>
                OR CONTINUE WITH
              </Text>
            }
            labelPosition="center"
            my={8}
            styles={{
              label: {
                fontSize: 11,
                letterSpacing: 0.5,
              },
            }}
            color={THEMED_LIGHT_BG}
          />

          <SocialLoginButton 
            onClick={onGoogleSignIn} 
            loading={isSigningIn}
            variant="login"
          />

          <Center mt={16}>
            <Text size="sm" style={{ color: MUTED_OLIVE }}>
              New to JustReach?{" "}
              <Anchor 
                href="/signup" 
                fw={600}
                style={{ 
                  color: PRIMARY_BROWN,
                  textDecoration: "none",
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = PRIMARY_GOLD}
                onMouseLeave={(e) => e.currentTarget.style.color = PRIMARY_BROWN}
              >
                Create an account
              </Anchor>
            </Text>
          </Center>
        </Stack>
      </form>
    </Box>
  );
};