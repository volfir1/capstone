import {
  Title,
  Text,
  Button,
  Box,
  TextInput,
  PasswordInput,
  Stack,
  Divider,
  Group,
  Anchor,
} from "@mantine/core";
import {
  IconMail,
  IconLock,
  IconUser,
  IconUserPlus,
  IconArrowRight,
  IconArrowLeft,
  IconScale,
  IconShieldCheck,
} from "@tabler/icons-react";
import { useState } from "react";
import { useNavigate } from 'react-router-dom';
import { SocialLoginButton } from "../buttons/SocialLoginButton";
import { signupValidationRules } from "@/utils/validation";
import { PRIMARY_GOLD, PRIMARY_BROWN, MUTED_OLIVE, THEMED_LIGHT_BG, CHARCOAL, ACCENT_TAN } from "@utils/constants";
import { Loaders } from "../ui/Loader";
import { checkEmailExists } from "@/features/auth/auth";
import { verificationNotif, pendingRoleNotif, showError } from "@utils/notification";

const STEPS = [
  { title: "Create Account",     subtitle: "Let's start with your name" },
  { title: "Your Email",         subtitle: "Enter your email address" },
  { title: "Choose Username",    subtitle: "Pick a unique username (optional)" },
  { title: "Secure Your Account", subtitle: "Create a strong password" },
];

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
  const navigate = useNavigate();

  const handleNext = async (e) => {
    e.preventDefault();
    if (!trigger) return;
    setIsValidating(true);
    try {
      let isValid = false;
      if (step === 1) {
        isValid = await trigger(["firstName", "lastName"]);
      } else if (step === 2) {
        isValid = await trigger("email");
        if (isValid) {
          try {
            const response = await checkEmailExists(getValues("email"));
            if (response.exists) {
              showError('Email Taken', 'This email is already registered. Please use a different email or log in.');
              isValid = false;
            }
          } catch {
            showError('Verification Failed', 'Unable to verify email. Please try again.');
            isValid = false;
          }
        }
      } else if (step === 3) {
        const username = getValues("username");
        isValid = username?.trim() ? await trigger("username") : true;
      }
      if (isValid) setStep(s => s + 1);
    } catch (err) {
      console.error("Validation error:", err);
    } finally {
      setIsValidating(false);
    }
  };

  const handleBack = () => setStep(s => s - 1);

  const handleEmailSubmit = handleSubmit(async (values) => {
    try {
      const res = await onSubmit(values);
      if (res !== false) { verificationNotif(); navigate('/'); }
    } catch (err) {
      console.error('Signup submit error:', err);
    }
  });

  const handleGoogleSignupClick = async (e) => {
    try {
      await onGoogleSignup(e);
      pendingRoleNotif();
      navigate('/');
    } catch (err) {
      console.error('Google signup error:', err);
    }
  };

  const currentStep = STEPS[step - 1];

  return (
    <Box style={{ minHeight: '100vh', display: 'flex', overflow: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600&family=DM+Sans:wght@300;400;500&display=swap');

        .signup-form * { font-family: 'DM Sans', sans-serif; }

        .field-label {
          font-size: 13px;
          font-weight: 500;
          letter-spacing: 1px;
          text-transform: uppercase;
          color: ${MUTED_OLIVE};
          margin-bottom: 8px;
          display: block;
        }

        .form-input .mantine-TextInput-input,
        .form-input .mantine-PasswordInput-input {
          border: 1px solid #DDD5C8 !important;
          border-radius: 4px !important;
          height: 54px !important;
          font-size: 15px !important;
          color: ${CHARCOAL} !important;
          background: #FDFBF8 !important;
          transition: border-color 0.18s ease, box-shadow 0.18s ease !important;
        }
        .form-input .mantine-TextInput-input:focus,
        .form-input .mantine-PasswordInput-input:focus {
          border-color: ${PRIMARY_BROWN} !important;
          box-shadow: 0 0 0 3px rgba(139,69,19,0.09) !important;
          background: #fff !important;
        }
        .form-input .mantine-PasswordInput-innerInput { height: 100% !important; font-size: 15px !important; }
        .form-input .mantine-InputWrapper-description { font-size: 11px !important; color: ${MUTED_OLIVE} !important; }

        .next-btn {
          background: ${PRIMARY_BROWN} !important;
          height: 54px !important;
          font-size: 13px !important;
          font-weight: 500 !important;
          letter-spacing: 1.4px !important;
          text-transform: uppercase !important;
          border-radius: 4px !important;
          border: none !important;
          transition: opacity 0.18s !important;
        }
        .next-btn:hover:not(:disabled) { opacity: 0.86 !important; }

        .back-btn {
          height: 54px !important;
          font-size: 13px !important;
          font-weight: 500 !important;
          letter-spacing: 1.4px !important;
          text-transform: uppercase !important;
          border-radius: 4px !important;
          border: 1.5px solid #DDD5C8 !important;
          color: ${MUTED_OLIVE} !important;
          background: transparent !important;
          transition: border-color 0.18s, background 0.18s !important;
        }
        .back-btn:hover { border-color: ${PRIMARY_BROWN} !important; color: ${PRIMARY_BROWN} !important; }

        /* Progress dots */
        .step-dots { display: flex; gap: 8px; align-items: center; }
        .step-dot {
          width: 8px; height: 8px; border-radius: 50%;
          background: #E0D8CE;
          transition: all 0.25s ease;
        }
        .step-dot.active { background: ${PRIMARY_BROWN}; width: 24px; border-radius: 4px; }
        .step-dot.done { background: ${PRIMARY_GOLD}; }

        .left-panel-fade { animation: panelIn 0.6s ease both; }
        .form-fade { animation: formIn 0.5s 0.1s ease both; }
        .step-fade { animation: stepIn 0.3s ease both; }

        @keyframes panelIn {
          from { opacity: 0; transform: translateX(-20px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes formIn {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes stepIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* ── Left Panel ── */}
      <Box
        className="left-panel-fade"
        style={{
          width: '42%',
          background: `linear-gradient(160deg, ${PRIMARY_BROWN} 0%, #5C2D0A 100%)`,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '48px 52px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative rings */}
        <Box style={{ position: 'absolute', top: -80, right: -80, width: 280, height: 280, borderRadius: '50%', border: `1px solid rgba(196,171,125,0.15)`, pointerEvents: 'none' }} />
        <Box style={{ position: 'absolute', top: -40, right: -40, width: 180, height: 180, borderRadius: '50%', border: `1px solid rgba(196,171,125,0.1)`, pointerEvents: 'none' }} />
        <Box style={{ position: 'absolute', bottom: -60, left: -60, width: 240, height: 240, borderRadius: '50%', border: `1px solid rgba(196,171,125,0.12)`, pointerEvents: 'none' }} />

        {/* Brand */}
        <Box style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Box style={{ width: 40, height: 40, borderRadius: 8, background: 'rgba(196,171,125,0.2)', border: `1px solid ${PRIMARY_GOLD}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IconScale size={20} color={PRIMARY_GOLD} stroke={1.5} />
          </Box>
          <Box>
            <Text style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 600, color: '#fff', lineHeight: 1.1 }}>JustReach</Text>
            <Text style={{ fontSize: 9, color: 'rgba(196,171,125,0.8)', letterSpacing: 2.5, textTransform: 'uppercase' }}>Legal Services</Text>
          </Box>
        </Box>

        {/* Center content */}
        <Box>
          <Text style={{ fontFamily: "'Playfair Display', serif", fontSize: 36, fontWeight: 500, color: '#fff', lineHeight: 1.25, marginBottom: 16 }}>
            Join<br />JustReach
          </Text>
          <Text style={{ fontSize: 14, fontWeight: 300, color: 'rgba(255,255,255,0.6)', lineHeight: 1.7, maxWidth: 260 }}>
            Create your account to access accessible legal services in the Philippines.
          </Text>

          {/* Step indicators */}
          <Box style={{ marginTop: 40 }}>
            {STEPS.map((s, i) => (
              <Box key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, opacity: step === i + 1 ? 1 : 0.4, transition: 'opacity 0.25s' }}>
                <Box style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: step > i + 1 ? PRIMARY_GOLD : step === i + 1 ? 'rgba(196,171,125,0.3)' : 'rgba(255,255,255,0.1)',
                  border: `1px solid ${step >= i + 1 ? PRIMARY_GOLD : 'rgba(196,171,125,0.25)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  {step > i + 1
                    ? <IconShieldCheck size={14} color="#fff" stroke={2} />
                    : <Text style={{ fontSize: 11, color: step === i + 1 ? PRIMARY_GOLD : 'rgba(255,255,255,0.4)', fontWeight: 600 }}>{i + 1}</Text>
                  }
                </Box>
                <Text style={{ fontSize: 12, color: step === i + 1 ? '#fff' : 'rgba(255,255,255,0.45)', fontWeight: step === i + 1 ? 500 : 300 }}>
                  {s.title}
                </Text>
              </Box>
            ))}
          </Box>
        </Box>

        <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
          © {new Date().getFullYear()} JustReach Legal Services
        </Text>
      </Box>

      {/* ── Right Panel ── */}
      <Box
        className="signup-form"
        style={{ flex: 1, backgroundColor: '#FAF8F5', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', position: 'relative' }}
      >
        <Box className="form-fade" style={{ width: '100%', maxWidth: 420 }}>

          {/* Step header */}
          <Box mb={32} className="step-fade" key={step}>
            {/* Step dots */}
            <Box className="step-dots" style={{ marginBottom: 20 }}>
              {STEPS.map((_, i) => (
                <Box key={i} className={`step-dot${step === i + 1 ? ' active' : step > i + 1 ? ' done' : ''}`} />
              ))}
            </Box>
            <Text style={{ fontFamily: "'Playfair Display', serif", fontSize: 30, fontWeight: 500, color: CHARCOAL, marginBottom: 6, lineHeight: 1.2 }}>
              {currentStep.title}
            </Text>
            <Text style={{ fontSize: 14, color: MUTED_OLIVE, fontWeight: 300 }}>
              {currentStep.subtitle}
            </Text>
          </Box>

          <form onSubmit={handleEmailSubmit}>
            <Stack gap={18}>

              {/* Step 1: Name + Google */}
              {step === 1 && (
                <Box className="step-fade" key="step1">
                  <Stack gap={16}>
                    <Box className="form-input">
                      <label className="field-label">First Name</label>
                      <TextInput
                        leftSection={<IconUser size={16} color={ACCENT_TAN} />}
                        placeholder="First name"
                        autoFocus
                        error={errors.firstName?.message}
                        {...register("firstName", signupValidationRules.firstName)}
                      />
                    </Box>
                    <Box className="form-input">
                      <label className="field-label">Last Name</label>
                      <TextInput
                        leftSection={<IconUser size={16} color={ACCENT_TAN} />}
                        placeholder="Last name"
                        error={errors.lastName?.message}
                        {...register("lastName", signupValidationRules.lastName)}
                      />
                    </Box>

                    {isValidating
                      ? <Loaders size="45" speed="1.75" color={PRIMARY_BROWN} height={54} />
                      : (
                        <Button rightSection={<IconArrowRight size={16} />} fullWidth onClick={handleNext} type="button" className="next-btn" mt={4}>
                          Continue
                        </Button>
                      )
                    }

                    <Divider
                      label={<Text style={{ fontSize: 11, color: MUTED_OLIVE, letterSpacing: 1, textTransform: 'uppercase' }}>or sign up with</Text>}
                      labelPosition="center"
                      color="#DDD5C8"
                    />

                    <SocialLoginButton onClick={handleGoogleSignupClick} loading={isRegistering} variant="signup" />
                  </Stack>
                </Box>
              )}

              {/* Step 2: Email */}
              {step === 2 && (
                <Box className="step-fade" key="step2">
                  <Stack gap={16}>
                    <Box className="form-input">
                      <label className="field-label">Email Address</label>
                      <TextInput
                        leftSection={<IconMail size={16} color={ACCENT_TAN} />}
                        placeholder="you@example.com"
                        autoFocus
                        error={errors.email?.message}
                        {...register("email", signupValidationRules.email)}
                      />
                    </Box>
                    {isValidating
                      ? <Loaders size="45" speed="1.75" color={PRIMARY_BROWN} height={54} />
                      : (
                        <Group grow>
                          <Button leftSection={<IconArrowLeft size={16} />} onClick={handleBack} type="button" className="back-btn">Back</Button>
                          <Button rightSection={<IconArrowRight size={16} />} onClick={handleNext} type="button" className="next-btn">Continue</Button>
                        </Group>
                      )
                    }
                  </Stack>
                </Box>
              )}

              {/* Step 3: Username */}
              {step === 3 && (
                <Box className="step-fade" key="step3">
                  <Stack gap={16}>
                    <Box className="form-input">
                      <label className="field-label">Username <Text span style={{ color: MUTED_OLIVE, fontSize: 11, fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</Text></label>
                      <TextInput
                        leftSection={<IconUser size={16} color={ACCENT_TAN} />}
                        placeholder="Choose a username"
                        autoFocus
                        description="Your email will be used as login if left empty"
                        error={errors.username?.message}
                        {...register("username", signupValidationRules.username)}
                      />
                    </Box>
                    {isValidating
                      ? <Loaders size="45" speed="1.75" color={PRIMARY_BROWN} height={54} />
                      : (
                        <Group grow>
                          <Button leftSection={<IconArrowLeft size={16} />} onClick={handleBack} type="button" className="back-btn">Back</Button>
                          <Button rightSection={<IconArrowRight size={16} />} onClick={handleNext} type="button" className="next-btn">Continue</Button>
                        </Group>
                      )
                    }
                  </Stack>
                </Box>
              )}

              {/* Step 4: Password */}
              {step === 4 && (
                <Box className="step-fade" key="step4">
                  <Stack gap={16}>
                    <Box className="form-input">
                      <label className="field-label">Password</label>
                      <PasswordInput
                        leftSection={<IconLock size={16} color={ACCENT_TAN} />}
                        placeholder="Create a password"
                        autoFocus
                        description="Min 6 characters with uppercase, lowercase & number"
                        error={errors.password?.message}
                        {...register("password", signupValidationRules.password)}
                      />
                    </Box>
                    <Box className="form-input">
                      <label className="field-label">Confirm Password</label>
                      <PasswordInput
                        leftSection={<IconLock size={16} color={ACCENT_TAN} />}
                        placeholder="Confirm your password"
                        error={errors.confirmPassword?.message}
                        {...register("confirmPassword", signupValidationRules.confirmPassword(password))}
                      />
                    </Box>

                    {errorMessage && (
                      <Box style={{ padding: '10px 14px', borderRadius: 4, background: '#FFF0F0', border: '1px solid #FFCDD2' }}>
                        <Text style={{ fontSize: 13, color: '#C62828' }}>{errorMessage}</Text>
                      </Box>
                    )}

                    <Group grow mt={4}>
                      <Button leftSection={<IconArrowLeft size={16} />} onClick={handleBack} type="button" className="back-btn" disabled={isRegistering}>
                        Back
                      </Button>
                      <Button leftSection={<IconUserPlus size={16} />} type="submit" loading={isRegistering} className="next-btn">
                        Create Account
                      </Button>
                    </Group>
                  </Stack>
                </Box>
              )}

            </Stack>
          </form>

          {/* Footer */}
          <Text style={{ fontSize: 13, color: MUTED_OLIVE, textAlign: 'center', marginTop: 28 }}>
            Already have an account?{' '}
            <Anchor
              component="button"
              type="button"
              onClick={() => navigate('/auth/admin')}
              style={{ color: PRIMARY_BROWN, fontWeight: 500, textDecoration: 'none' }}
            >
              Sign in
            </Anchor>
          </Text>

        </Box>
      </Box>
    </Box>
  );
};