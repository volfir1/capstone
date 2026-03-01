import { useNavigate } from 'react-router-dom';
import {
  TextInput,
  PasswordInput,
  Button,
  Text,
  Box,
  Anchor,
  Stack,
  Divider,
} from '@mantine/core';
import { IconMail, IconLock, IconArrowLeft } from '@tabler/icons-react';
import {
  PRIMARY_GOLD,
  PRIMARY_BROWN,
  MUTED_OLIVE,
  CHARCOAL,
  ACCENT_TAN,
} from '@utils/constants';
import { useLogin } from '@/hooks/auth/useLogin';

const ROLE_LABELS = {
  secretary: 'Secretary',
  supervising_lawyer: 'Supervising Lawyer',
  director: 'Director',
  intern: 'Legal Intern',
};

export default function AdminLogin() {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    errors,
    isSigningIn,
    errorMessage,
    handleEmailSignIn,
    handleGoogleSignIn,
  } = useLogin();

  return (
    <Box style={{ minHeight: '100vh', display: 'flex', overflow: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600&family=DM+Sans:wght@300;400;500&display=swap');

        .office-login * { font-family: 'DM Sans', sans-serif; }

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
          font-size: 16px !important;
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
        .form-input .mantine-PasswordInput-innerInput { height: 100% !important; }

        .sign-in-btn {
          background: ${PRIMARY_BROWN} !important;
          height: 56px !important;
          font-size: 14px !important;
          font-weight: 500 !important;
          letter-spacing: 1.6px !important;
          text-transform: uppercase !important;
          border-radius: 4px !important;
          transition: opacity 0.18s !important;
          border: none !important;
        }
        .sign-in-btn:hover:not(:disabled) { opacity: 0.85 !important; }

        .google-btn {
          height: 56px !important;
          border: 1.5px solid #DDD5C8 !important;
          border-radius: 4px !important;
          background: #fff !important;
          color: ${CHARCOAL} !important;
          font-size: 15px !important;
          font-weight: 400 !important;
          transition: border-color 0.18s, background 0.18s !important;
        }
        .google-btn:hover:not(:disabled) {
          border-color: ${ACCENT_TAN} !important;
          background: #FDFBF8 !important;
        }

        .left-panel-fade { animation: panelIn 0.6s ease both; }
        .form-fade { animation: formIn 0.5s 0.1s ease both; }

        @keyframes panelIn {
          from { opacity: 0; transform: translateX(-20px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes formIn {
          from { opacity: 0; transform: translateY(12px); }
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
          <img src="/sola_logo.png" alt="SOLA Logo" style={{ width: 40, height: 40, objectFit: 'contain' }} />
          <Box>
            <Text style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 600, color: '#fff', lineHeight: 1.1 }}>SOLA</Text>
            <Text style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 9, color: 'rgba(196,171,125,0.8)', letterSpacing: 2.5, textTransform: 'uppercase' }}>Sebastinian Office of Legal Aid</Text>
          </Box>
        </Box>

        {/* Center content */}
        <Box>
          <Text style={{ fontFamily: "'Playfair Display', serif", fontSize: 36, fontWeight: 500, color: '#fff', lineHeight: 1.25, marginBottom: 16 }}>
            SOLA<br />Staff Portal
          </Text>
          <Text style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 300, color: 'rgba(255,255,255,0.6)', lineHeight: 1.7, maxWidth: 260 }}>
            Secure access for SOLA office staff — secretaries, interns, supervising lawyers, and the director.
          </Text>
          <Box style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 32 }}>
            {Object.values(ROLE_LABELS).map((label) => (
              <Box key={label} style={{ padding: '5px 14px', borderRadius: 20, border: `1px solid rgba(196,171,125,0.35)`, background: 'rgba(196,171,125,0.1)' }}>
                <Text style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: PRIMARY_GOLD }}>{label}</Text>
              </Box>
            ))}
          </Box>
        </Box>

        <Text style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
          © {new Date().getFullYear()} SOLA — Sebastinian Office of Legal Aid
        </Text>
      </Box>

      {/* ── Right Panel ── */}
      <Box
        className="office-login"
        style={{ flex: 1, backgroundColor: '#FAF8F5', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', position: 'relative' }}
      >
        <Button
          variant="subtle"
          size="xs"
          leftSection={<IconArrowLeft size={14} />}
          onClick={() => navigate('/')}
          style={{ position: 'absolute', top: 24, left: 24, color: MUTED_OLIVE, fontSize: 12 }}
        >
          Back to Home
        </Button>

        <Box className="form-fade" style={{ width: '100%', maxWidth: 400 }}>
          <Stack gap={28}>
            {/* Header */}
            <Box>
              <Text style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 500, color: CHARCOAL, marginBottom: 8 }}>
                Welcome back
              </Text>
              <Text style={{ fontSize: 15, color: MUTED_OLIVE, fontWeight: 300, lineHeight: 1.5 }}>
                Sign in to access the office dashboard
              </Text>
            </Box>

            {/* Error message */}
            {errorMessage && (
              <Box style={{ padding: '10px 14px', borderRadius: 4, background: '#FFF0F0', border: '1px solid #FFCDD2' }}>
                <Text style={{ fontSize: 13, color: '#C62828' }}>{errorMessage}</Text>
              </Box>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit(handleEmailSignIn)}>
              <Stack gap={16}>
                <Box className="form-input">
                  <label className="field-label">Email address</label>
                  <TextInput
                    {...register('email', {
                      required: 'Email is required',
                      pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: 'Invalid email' },
                    })}
                    placeholder="you@example.com"
                    leftSection={<IconMail size={15} color={ACCENT_TAN} />}
                    error={errors.email?.message}
                    disabled={isSigningIn}
                  />
                </Box>

                <Box className="form-input">
                  <Box style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <label className="field-label" style={{ marginBottom: 0 }}>Password</label>
                    <Anchor
                      component="button"
                      type="button"
                      onClick={() => navigate('/forgot-password')}
                      style={{ fontSize: 13, color: MUTED_OLIVE, textDecoration: 'none' }}
                    >
                      Forgot password?
                    </Anchor>
                  </Box>
                  <PasswordInput
                    {...register('password', {
                      required: 'Password is required',
                      minLength: { value: 6, message: 'Minimum 6 characters' },
                    })}
                    placeholder="••••••••"
                    leftSection={<IconLock size={15} color={ACCENT_TAN} />}
                    error={errors.password?.message}
                    disabled={isSigningIn}
                  />
                </Box>

                <Button type="submit" fullWidth loading={isSigningIn} className="sign-in-btn" mt={4}>
                  {isSigningIn ? 'Signing in…' : 'Sign in'}
                </Button>
              </Stack>
            </form>

            <Box style={{ textAlign: 'center' }}>
              <Text style={{ fontSize: 13, color: MUTED_OLIVE }}>
                No account?{' '}
                <Anchor
                  component="button"
                  type="button"
                  onClick={() => navigate('/auth/signup')}
                  style={{ fontSize: 13, color: PRIMARY_BROWN, fontWeight: 600, textDecoration: 'none', marginLeft: 6 }}
                >
                  Sign up
                </Anchor>
              </Text>
            </Box>

            <Divider
              label={<Text style={{ fontSize: 11, color: MUTED_OLIVE, letterSpacing: 1, textTransform: 'uppercase' }}>or continue with</Text>}
              labelPosition="center"
              color="#DDD5C8"
            />

            <Button
              fullWidth
              onClick={handleGoogleSignIn}
              loading={isSigningIn}
              className="google-btn"
              leftSection={
                !isSigningIn && (
                  <svg width="18" height="18" viewBox="0 0 18 18">
                    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                    <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                    <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
                  </svg>
                )
              }
            >
              {isSigningIn ? 'Connecting…' : 'Sign in with Google'}
            </Button>
          </Stack>
        </Box>
      </Box>
    </Box>
  );
}