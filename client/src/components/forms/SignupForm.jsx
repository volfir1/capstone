import {
  Anchor,
  Box,
  Button,
  Divider,
  PasswordInput,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import {
  IconArrowLeft,
  IconLock,
  IconMail,
  IconShieldCheck,
} from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";

import { SocialLoginButton } from "../buttons/SocialLoginButton";
import { signupValidationRules } from "@/utils/validation";
import {
  ACCENT_TAN,
  CHARCOAL,
  MUTED_OLIVE,
  PRIMARY_BROWN,
  PRIMARY_GOLD,
} from "@utils/constants";

export const SignupForm = ({
  register,
  handleSubmit,
  errors,
  password,
  isRegistering,
  errorMessage,
  onSubmit,
  onGoogleSignup,
}) => {
  const navigate = useNavigate();

  return (
    <Box style={{ minHeight: "100vh", display: "flex", overflow: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600&family=DM+Sans:wght@400;500;600&display=swap');

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
        }

        .form-input .mantine-TextInput-input:focus,
        .form-input .mantine-PasswordInput-input:focus {
          border-color: ${PRIMARY_BROWN} !important;
          box-shadow: 0 0 0 3px rgba(139,69,19,0.09) !important;
          background: #fff !important;
        }

        .signup-btn {
          background: ${PRIMARY_BROWN} !important;
          height: 54px !important;
          font-size: 13px !important;
          font-weight: 600 !important;
          letter-spacing: 1.3px !important;
          text-transform: uppercase !important;
          border-radius: 4px !important;
          border: none !important;
        }

        @media (max-width: 768px) {
          .signup-side { display: none !important; }
          .signup-main { padding: 56px 20px 40px !important; }
          .signup-back-btn { top: 16px !important; left: 16px !important; }
        }
      `}</style>

      <Box
        className="signup-side"
        style={{
          width: "42%",
          background: `linear-gradient(160deg, ${PRIMARY_BROWN} 0%, #5C2D0A 100%)`,
          color: "white",
          padding: "48px 52px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        <Box>
          <Box style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 48 }}>
            <img src="/sola_logo.png" alt="SOLA Logo" style={{ width: 40, height: 40, objectFit: "contain" }} />
            <Box>
              <Text style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 600, color: "#fff", lineHeight: 1.1 }}>
                SOLA
              </Text>
              <Text style={{ fontSize: 9, color: "rgba(196,171,125,0.8)", letterSpacing: 2.5, textTransform: "uppercase" }}>
                Sebastinian Office of Legal Aid
              </Text>
            </Box>
          </Box>

          <Text style={{ fontFamily: "'Playfair Display', serif", fontSize: 38, fontWeight: 500, lineHeight: 1.2, marginBottom: 16 }}>
            Create the shared
            <br />
            SOLA account
          </Text>
          <Text style={{ fontSize: 14, color: "rgba(255,255,255,0.68)", lineHeight: 1.75, maxWidth: 290 }}>
            This sign-up creates the main login only. After signing in, you'll choose or create the staff profiles that act like separate office identities.
          </Text>

          <Stack gap={14} mt={40}>
            {[
              "One Gmail or email login for the office",
              "Multiple staff profiles under the same account",
              "Each profile keeps its own role and signature",
            ].map((item) => (
              <Box key={item} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <IconShieldCheck size={16} color={PRIMARY_GOLD} />
                <Text size="sm" c="rgba(255,255,255,0.82)">{item}</Text>
              </Box>
            ))}
          </Stack>
        </Box>

        <Text size="xs" c="rgba(255,255,255,0.35)">
          © {new Date().getFullYear()} SOLA
        </Text>
      </Box>

      <Box
        className="signup-form signup-main"
        style={{
          flex: 1,
          backgroundColor: "#FAF8F5",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 24px",
          position: "relative",
        }}
      >
        <Button
          variant="subtle"
          size="xs"
          className="signup-back-btn"
          leftSection={<IconArrowLeft size={14} />}
          onClick={() => navigate("/")}
          style={{ position: "absolute", top: 24, left: 24, color: MUTED_OLIVE, fontSize: 12 }}
        >
          Back to Home
        </Button>

        <Box style={{ width: "100%", maxWidth: 420 }}>
          <Stack gap={28}>
            <Box>
              <Text style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 500, color: CHARCOAL, marginBottom: 8 }}>
                Create account
              </Text>
              <Text style={{ fontSize: 15, color: MUTED_OLIVE, fontWeight: 300, lineHeight: 1.6 }}>
                Set up the main login first. Staff profiles can be added right after sign-in.
              </Text>
            </Box>

            {errorMessage && (
              <Box style={{ padding: "10px 14px", borderRadius: 4, background: "#FFF0F0", border: "1px solid #FFCDD2" }}>
                <Text style={{ fontSize: 13, color: "#C62828" }}>{errorMessage}</Text>
              </Box>
            )}

            <form onSubmit={handleSubmit(onSubmit)}>
              <Stack gap={16}>
                <Box className="form-input">
                  <label className="field-label">Email Address</label>
                  <TextInput
                    leftSection={<IconMail size={16} color={ACCENT_TAN} />}
                    placeholder="office@gmail.com"
                    error={errors.email?.message}
                    {...register("email", signupValidationRules.email)}
                  />
                </Box>

                <Box className="form-input">
                  <label className="field-label">Password</label>
                  <PasswordInput
                    leftSection={<IconLock size={16} color={ACCENT_TAN} />}
                    placeholder="Create a strong password"
                    error={errors.password?.message}
                    {...register("password", signupValidationRules.password)}
                  />
                </Box>

                <Box className="form-input">
                  <label className="field-label">Confirm Password</label>
                  <PasswordInput
                    leftSection={<IconLock size={16} color={ACCENT_TAN} />}
                    placeholder="Re-enter your password"
                    error={errors.confirmPassword?.message}
                    {...register("confirmPassword", signupValidationRules.confirmPassword(password))}
                  />
                </Box>

                <Button type="submit" loading={isRegistering} className="signup-btn" fullWidth mt={4}>
                  Create Shared Account
                </Button>

                <Divider
                  label={<Text style={{ fontSize: 11, color: MUTED_OLIVE, letterSpacing: 1, textTransform: "uppercase" }}>or continue with</Text>}
                  labelPosition="center"
                  color="#DDD5C8"
                />

                <SocialLoginButton onClick={onGoogleSignup} loading={isRegistering} variant="signup" />

                <Text size="sm" c={MUTED_OLIVE} ta="center">
                  Already have the shared account?{" "}
                  <Anchor href="/auth/admin" fw={600} c={PRIMARY_BROWN} underline="never">
                    Sign in
                  </Anchor>
                </Text>
              </Stack>
            </form>
          </Stack>
        </Box>
      </Box>
    </Box>
  );
};
