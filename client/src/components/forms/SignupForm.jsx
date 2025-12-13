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
  Group,
  Progress,
} from "@mantine/core";
import {
  IconMail,
  IconLock,
  IconUser,
  IconUserPlus,
  IconArrowRight,
  IconArrowLeft,
} from "@tabler/icons-react";
import { useState } from "react";
import { SocialLoginButton } from "../buttons/SocialLoginButton";
import { signupValidationRules } from "@/utils/validation";
import { PRIMARY_GOLD, PRIMARY_BROWN, MUTED_OLIVE, THEMED_LIGHT_BG, CHARCOAL, ACCENT_TAN } from "@utils/constants";
import { Loaders } from "../ui/Loader";
import { checkEmailExists } from "@/features/auth/auth";
import toast from "react-hot-toast";


export const SignupForm = ({
  register,
  handleSubmit,
  errors,
  password,
  isRegistering,
  errorMessage,
  onSubmit,
  onGoogleSignup,
  trigger,
  getValues,
}) => {
  const [step, setStep] = useState(1);
  const [isValidating, setIsValidating] = useState(false);

  const handleNext = async (e) => {
    e.preventDefault();
    
    if (!trigger) {
      console.warn("Trigger function not provided");
      return;
    }

    setIsValidating(true);

    try {
      let isValid = false;

      if (step === 1) {
        // Validate both first and last name
        isValid = await trigger(["firstName", "lastName"]);
        console.log("Step 1 validation result:", isValid);
      } else if (step === 2) {
        // Validate email format first
        isValid = await trigger("email");
        console.log("Step 2 validation result:", isValid);
        
        // If email format is valid, check if it exists in database
        if (isValid) {
          const email = getValues("email");
          try {
            const response = await checkEmailExists(email);
            
            if (response.exists) {
              toast.error("This email is already registered. Please use a different email or login.");
              isValid = false;
            } else {
              toast.success("Email is available!");
            }
          } catch (error) {
            console.error("Error checking email:", error);
            toast.error("Unable to verify email. Please try again.");
            isValid = false;
          }
        }
      } else if (step === 3) {
        // Username is optional, so always allow next
        // But if user entered something, validate it
        const username = getValues("username");
        if (username && username.trim() !== "") {
          isValid = await trigger("username");
          console.log("Step 3 validation result (with username):", isValid);
        } else {
          isValid = true; // Username is optional
          console.log("Step 3 validation result (no username):", isValid);
        }
      }

      // Only proceed if validation passed
      if (isValid) {
        console.log("Validation passed, moving to step", step + 1);
        setStep(step + 1);
      } else {
        console.log("Validation failed, staying on step", step);
      }
    } catch (error) {
      console.error("Validation error:", error);
    } finally {
      setIsValidating(false);
    }
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const progressValue = (step / 4) * 100;

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
      <Box mb={20} style={{ textAlign: "right" }}>
        <Text size="24px" fw={700} style={{ lineHeight: 1 }}>
          <Text span style={{ color: PRIMARY_GOLD }}>Just</Text>
          <Text span style={{ color: PRIMARY_BROWN }}>Reach</Text>
        </Text>
        <Text size="xs" style={{ color: MUTED_OLIVE, marginTop: 2, lineHeight: 1.2 }}>
          Accessible Legal Services Network
        </Text>
      </Box>

      {/* Progress Bar */}
      <Progress 
        value={progressValue} 
        size="sm" 
        radius="xl"
        mb={24}
        styles={{
          bar: {
            backgroundColor: PRIMARY_GOLD,
          },
          root: {
            backgroundColor: THEMED_LIGHT_BG,
          },
        }}
      />

      {/* Register Title */}
      <Box mb={32}>
        <Title order={2} size="24px" fw={600} style={{ color: CHARCOAL, marginBottom: 6 }}>
          {step === 1 && "Create Account"}
          {step === 2 && "Your Email"}
          {step === 3 && "Choose Username"}
          {step === 4 && "Secure Your Account"}
        </Title>
        <Text style={{ color: MUTED_OLIVE, fontSize: 13 }}>
          {step === 1 && "Let's start with your name"}
          {step === 2 && "Enter your email address"}
          {step === 3 && "Pick a unique username (optional)"}
          {step === 4 && "Create a strong password"}
        </Text>
      </Box>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack spacing={20}>
          {/* Step 1: Name and Social Login */}
          {step === 1 && (
            <>
              <Box>
                <Text size="sm" fw={500} mb={8} style={{ color: CHARCOAL, fontSize: 13 }}>
                  First Name
                </Text>
                <TextInput
                  leftSection={<IconUser size={16} stroke={1.5} style={{ color: ACCENT_TAN }} />}
                  placeholder="First name"
                  size="md"
                  radius="md"
                  autoFocus
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
                  error={errors.firstName?.message}
                  {...register("firstName", signupValidationRules.firstName)}
                />
              </Box>

              <Box>
                <Text size="sm" fw={500} mb={8} style={{ color: CHARCOAL, fontSize: 13 }}>
                  Last Name
                </Text>
                <TextInput
                  leftSection={<IconUser size={16} stroke={1.5} style={{ color: ACCENT_TAN }} />}
                  placeholder="Last name"
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
                  error={errors.lastName?.message}
                  {...register("lastName", signupValidationRules.lastName)}
                />
              </Box>

              {isValidating ? (
                <Loaders size="45" speed="1.75" color={PRIMARY_BROWN} height={48} />
              ) : (
                <Button
                  rightSection={<IconArrowRight size={18} />}
                  size="md"
                  radius="md"
                  fullWidth
                  onClick={handleNext}
                  type="button"
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
                  Next
                </Button>
              )}

              <Divider
                label={
                  <Text size="xs" fw={500} style={{ color: MUTED_OLIVE, fontSize: 10 }}>
                    OR CONTINUE WITH
                  </Text>
                }
                labelPosition="center"
                my={8}
                color={THEMED_LIGHT_BG}
              />

              <SocialLoginButton
                onClick={onGoogleSignup}
                loading={isRegistering}
                variant="signup"
              />

              <Center mt={16}>
                <Text size="sm" style={{ color: MUTED_OLIVE, fontSize: 13 }}>
                  Already have an account?{" "}
                  <Anchor 
                    href="/auth/login" 
                    fw={600}
                    style={{ 
                      color: PRIMARY_BROWN,
                      textDecoration: "none",
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = PRIMARY_GOLD}
                    onMouseLeave={(e) => e.currentTarget.style.color = PRIMARY_BROWN}
                  >
                    Sign in
                  </Anchor>
                </Text>
              </Center>

              <Center mt={12}>
                <Text size="sm" style={{ color: MUTED_OLIVE, fontSize: 13 }}>
                  Attorney?{" "}
                  <Anchor 
                    href="/auth/attorneysignup" 
                    fw={600}
                    style={{ 
                      color: PRIMARY_BROWN,
                      textDecoration: "none",
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = PRIMARY_GOLD}
                    onMouseLeave={(e) => e.currentTarget.style.color = PRIMARY_BROWN}
                  >
                    Register as attorney
                  </Anchor>
                </Text>
              </Center>
            </>
          )}

          {/* Step 2: Email */}
          {step === 2 && (
            <>
              <Box>
                <Text size="sm" fw={500} mb={8} style={{ color: CHARCOAL, fontSize: 13 }}>
                  Email Address
                </Text>
                <TextInput
                  leftSection={<IconMail size={16} stroke={1.5} style={{ color: ACCENT_TAN }} />}
                  placeholder="your.email@example.com"
                  size="md"
                  radius="md"
                  autoFocus
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
                  {...register("email", signupValidationRules.email)}
                />
              </Box>

              {isValidating ? (
                <Loaders size="45" speed="1.75" color={PRIMARY_BROWN} height={48} />
              ) : (
                <Group grow>
                  <Button
                    leftSection={<IconArrowLeft size={18} />}
                    size="md"
                    radius="md"
                    onClick={handleBack}
                    type="button"
                    variant="outline"
                    styles={{
                      root: {
                        borderColor: PRIMARY_BROWN,
                        color: PRIMARY_BROWN,
                        fontWeight: 600,
                        fontSize: 14,
                        height: 48,
                        '&:hover': {
                          backgroundColor: THEMED_LIGHT_BG,
                        },
                      },
                    }}
                  >
                    Back
                  </Button>

                  <Button
                    rightSection={<IconArrowRight size={18} />}
                    size="md"
                    radius="md"
                    onClick={handleNext}
                    type="button"
                    styles={{
                      root: {
                        backgroundColor: PRIMARY_BROWN,
                        color: 'white',
                        fontWeight: 600,
                        fontSize: 14,
                        height: 48,
                        border: 'none',
                        '&:hover': {
                          backgroundColor: PRIMARY_GOLD,
                        },
                      },
                    }}
                  >
                    Next
                  </Button>
                </Group>
              )}
            </>
          )}

          {/* Step 3: Username */}
          {step === 3 && (
            <>
              <Box>
                <Text size="sm" fw={500} mb={8} style={{ color: CHARCOAL, fontSize: 13 }}>
                  Username (Optional)
                </Text>
                <TextInput
                  leftSection={<IconUser size={16} stroke={1.5} style={{ color: ACCENT_TAN }} />}
                  placeholder="Choose a username"
                  size="md"
                  radius="md"
                  autoFocus
                  description="Optional - your email will be used if not provided"
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
                  error={errors.username?.message}
                  {...register("username", signupValidationRules.username)}
                />
              </Box>

              {isValidating ? (
                <Loaders size="45" speed="1.75" color={PRIMARY_BROWN} height={48} />
              ) : (
                <Group grow>
                  <Button
                    leftSection={<IconArrowLeft size={18} />}
                    size="md"
                    radius="md"
                    onClick={handleBack}
                    type="button"
                    variant="outline"
                    styles={{
                      root: {
                        borderColor: PRIMARY_BROWN,
                        color: PRIMARY_BROWN,
                        fontWeight: 600,
                        fontSize: 14,
                        height: 48,
                        '&:hover': {
                          backgroundColor: THEMED_LIGHT_BG,
                        },
                      },
                    }}
                  >
                    Back
                  </Button>

                  <Button
                    rightSection={<IconArrowRight size={18} />}
                    size="md"
                    radius="md"
                    onClick={handleNext}
                    type="button"
                    styles={{
                      root: {
                        backgroundColor: PRIMARY_BROWN,
                        color: 'white',
                        fontWeight: 600,
                        fontSize: 14,
                        height: 48,
                        border: 'none',
                        '&:hover': {
                          backgroundColor: PRIMARY_GOLD,
                        },
                      },
                    }}
                  >
                    Next
                  </Button>
                </Group>
              )}
            </>
          )}

          {/* Step 4: Password */}
          {step === 4 && (
            <>
              <Box>
                <Text size="sm" fw={500} mb={8} style={{ color: CHARCOAL, fontSize: 13 }}>
                  Password
                </Text>
                <PasswordInput
                  leftSection={<IconLock size={16} stroke={1.5} style={{ color: ACCENT_TAN }} />}
                  placeholder="Create password"
                  size="md"
                  radius="md"
                  autoFocus
                  description="Min 6 chars with uppercase, lowercase & number"
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
                  {...register("password", signupValidationRules.password)}
                />
              </Box>

              <Box>
                <Text size="sm" fw={500} mb={8} style={{ color: CHARCOAL, fontSize: 13 }}>
                  Confirm Password
                </Text>
                <PasswordInput
                  leftSection={<IconLock size={16} stroke={1.5} style={{ color: ACCENT_TAN }} />}
                  placeholder="Confirm password"
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
                  error={errors.confirmPassword?.message}
                  {...register(
                    "confirmPassword",
                    signupValidationRules.confirmPassword(password)
                  )}
                />
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

              <Group grow>
                <Button
                  leftSection={<IconArrowLeft size={18} />}
                  size="md"
                  radius="md"
                  onClick={handleBack}
                  type="button"
                  variant="outline"
                  disabled={isRegistering}
                  styles={{
                    root: {
                      borderColor: PRIMARY_BROWN,
                      color: PRIMARY_BROWN,
                      fontWeight: 600,
                      fontSize: 14,
                      height: 48,
                      '&:hover': {
                        backgroundColor: THEMED_LIGHT_BG,
                      },
                    },
                  }}
                >
                  Back
                </Button>

                <Button
                  leftSection={<IconUserPlus size={18} />}
                  size="md"
                  radius="md"
                  type="submit"
                  loading={isRegistering}
                  styles={{
                    root: {
                      backgroundColor: PRIMARY_BROWN,
                      color: 'white',
                      fontWeight: 600,
                      fontSize: 14,
                      height: 48,
                      border: 'none',
                      '&:hover': {
                        backgroundColor: PRIMARY_GOLD,
                      },
                    },
                  }}
                >
                  Create Account
                </Button>
              </Group>
            </>
          )}
        </Stack>
      </form>
    </Box>
  );
};