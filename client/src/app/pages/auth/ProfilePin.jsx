import { useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import {
  ActionIcon,
  Alert,
  Badge,
  Box,
  Button,
  Card,
  Group,
  PasswordInput,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  IconArrowLeft,
  IconKey,
  IconLock,
  IconShieldCheck,
} from "@tabler/icons-react";

import { useAuth } from "@/context/authContext";
import { Loaders } from "@/components/ui/Loader";
import {
  PRIMARY_GOLD,
  PRIMARY_BROWN,
  MUTED_OLIVE,
  CHARCOAL,
  BG,
  ACCENT_TAN,
} from "@utils/constants";

const formatRole = (role) =>
  role === "supervising_lawyer"
    ? "Supervising Lawyer"
    : role === "intern"
      ? "Legal Intern"
      : role
        ? role.charAt(0).toUpperCase() + role.slice(1)
        : "Staff";

const normalizePinInput = (value) => String(value || "").replace(/\D/g, "").slice(0, 6);
const isValidPin = (value) => /^\d{4,6}$/.test(String(value || "").trim());

const formatLockedUntil = (value) => {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
};

export default function ProfilePin() {
  const navigate = useNavigate();
  const {
    userLoggedIn,
    loading,
    currentUser,
    accountData,
    profiles,
    activeProfileId,
    pinStatus,
    requiresPinSetup,
    setupActiveProfilePin,
    verifyActiveProfilePin,
    clearSelectedProfile,
  } = useAuth();
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedProfile = useMemo(
    () => profiles.find((profile) => profile.id === activeProfileId) || null,
    [activeProfileId, profiles]
  );

  if (loading) {
    return <Loaders height={window.innerHeight} />;
  }

  if (!userLoggedIn) {
    return <Navigate to="/auth/admin" replace />;
  }

  if (!selectedProfile) {
    return <Navigate to="/auth/profiles" replace />;
  }

  const handleChooseDifferentProfile = () => {
    clearSelectedProfile();
    navigate("/auth/profiles", { replace: true });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSubmitting) return;

    const normalizedPin = normalizePinInput(pin);
    const normalizedConfirmPin = normalizePinInput(confirmPin);

    if (!isValidPin(normalizedPin)) {
      setErrorMessage("PIN must be 4 to 6 digits.");
      return;
    }

    if (requiresPinSetup && normalizedPin !== normalizedConfirmPin) {
      setErrorMessage("PIN confirmation does not match.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      if (requiresPinSetup) {
        await setupActiveProfilePin(normalizedPin);
        notifications.show({
          title: "PIN created",
          message: "Your profile PIN is ready. You can now continue to the dashboard.",
          color: "teal",
        });
      } else {
        await verifyActiveProfilePin(normalizedPin);
        notifications.show({
          title: "Profile unlocked",
          message: "PIN verified successfully.",
          color: "teal",
        });
      }

      navigate("/admin", { replace: true });
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        (requiresPinSetup
          ? "We couldn't create the PIN for this profile."
          : "We couldn't verify that PIN.");
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const lockedLabel = formatLockedUntil(pinStatus?.lockedUntil);

  return (
    <Box
      style={{
        minHeight: "100vh",
        background: `linear-gradient(180deg, #F9F5EE 0%, ${BG} 100%)`,
        padding: "40px 24px",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600&family=DM+Sans:wght@400;500;600&display=swap');
        .profile-pin * { font-family: 'DM Sans', sans-serif; }
      `}</style>

      <Box className="profile-pin" maw={1120} mx="auto">
        <Group justify="space-between" align="flex-start" mb={32}>
          <Stack gap={10}>
            <ActionIcon
              variant="subtle"
              color="gray"
              size="lg"
              onClick={handleChooseDifferentProfile}
              style={{ width: "fit-content" }}
            >
              <IconArrowLeft size={18} />
            </ActionIcon>

            <Text
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 36,
                fontWeight: 600,
                color: CHARCOAL,
                lineHeight: 1.1,
              }}
            >
              {requiresPinSetup ? "Create a profile PIN" : "Unlock this profile"}
            </Text>

            <Text size="md" c={MUTED_OLIVE} maw={720}>
              {requiresPinSetup
                ? "This profile does not have a PIN yet. Create a numeric PIN before continuing to the dashboard."
                : "Enter this profile's PIN to continue into the SOLA dashboard."}
            </Text>
          </Stack>
        </Group>

        <Group align="stretch" gap="lg">
          <Card
            radius="xl"
            shadow="sm"
            p="xl"
            style={{
              flex: "1 1 380px",
              background: "white",
              border: "1px solid rgba(139, 69, 19, 0.08)",
            }}
          >
            <Stack gap="lg">
              <Box>
                <Text size="sm" fw={700} tt="uppercase" c={MUTED_OLIVE}>
                  Selected Profile
                </Text>
                <Title order={3} mt={6} c={CHARCOAL}>
                  {selectedProfile.firstName} {selectedProfile.lastName}
                </Title>
                <Group gap="sm" mt={10}>
                  <Badge
                    radius="xl"
                    variant="light"
                    style={{
                      backgroundColor: `${PRIMARY_GOLD}20`,
                      color: PRIMARY_BROWN,
                      border: `1px solid ${PRIMARY_GOLD}50`,
                    }}
                  >
                    {formatRole(selectedProfile.role)}
                  </Badge>
                  <Badge
                    radius="xl"
                    variant="light"
                    style={{
                      backgroundColor: `${ACCENT_TAN}20`,
                      color: MUTED_OLIVE,
                      border: `1px solid ${ACCENT_TAN}50`,
                    }}
                  >
                    {accountData?.email || currentUser?.email || "Shared account"}
                  </Badge>
                </Group>
              </Box>

              <Stack gap={10}>
                <Group gap="sm" wrap="nowrap" align="flex-start">
                  <IconShieldCheck size={18} color={PRIMARY_BROWN} />
                  <Text size="sm" c={MUTED_OLIVE}>
                    {requiresPinSetup
                      ? "Older and newly created profiles both need their own PIN. This PIN belongs only to the selected profile, not the shared Gmail account."
                      : "The shared Gmail login stays the same, but each profile unlocks with its own PIN."}
                  </Text>
                </Group>
                <Group gap="sm" wrap="nowrap" align="flex-start">
                  <IconKey size={18} color={PRIMARY_BROWN} />
                  <Text size="sm" c={MUTED_OLIVE}>
                    PINs must be numeric and 4 to 6 digits long.
                  </Text>
                </Group>
              </Stack>
            </Stack>
          </Card>

          <Card
            radius="xl"
            shadow="sm"
            p="xl"
            style={{
              flex: "1 1 420px",
              background: "white",
              border: "1px solid rgba(139, 69, 19, 0.08)",
            }}
          >
            <form onSubmit={handleSubmit}>
              <Stack gap="md">
                {pinStatus?.isLocked && lockedLabel && (
                  <Alert color="red" radius="md" title="PIN temporarily locked">
                    Too many incorrect attempts were entered. Try again after {lockedLabel}.
                  </Alert>
                )}

                {errorMessage && (
                  <Alert color="red" radius="md" title="PIN error">
                    {errorMessage}
                  </Alert>
                )}

                {!requiresPinSetup && !pinStatus?.isLocked && (
                  <Text size="sm" c={MUTED_OLIVE}>
                    {typeof pinStatus?.remainingAttempts === "number" && pinStatus.maxAttempts
                      ? `${pinStatus.remainingAttempts} attempt${pinStatus.remainingAttempts === 1 ? "" : "s"} remaining before lockout.`
                      : "Enter the numeric PIN for this profile."}
                  </Text>
                )}

                <PasswordInput
                  label={requiresPinSetup ? "Create PIN" : "Enter PIN"}
                  placeholder="4 to 6 digits"
                  leftSection={<IconLock size={16} />}
                  value={pin}
                  onChange={(event) => setPin(normalizePinInput(event.currentTarget.value))}
                  inputMode="numeric"
                  maxLength={6}
                  disabled={isSubmitting || !!pinStatus?.isLocked}
                />

                {requiresPinSetup && (
                  <PasswordInput
                    label="Confirm PIN"
                    placeholder="Re-enter the PIN"
                    leftSection={<IconLock size={16} />}
                    value={confirmPin}
                    onChange={(event) => setConfirmPin(normalizePinInput(event.currentTarget.value))}
                    inputMode="numeric"
                    maxLength={6}
                    disabled={isSubmitting || !!pinStatus?.isLocked}
                  />
                )}

                <Group justify="space-between" mt="sm">
                  <Button
                    variant="subtle"
                    color="gray"
                    onClick={handleChooseDifferentProfile}
                    disabled={isSubmitting}
                  >
                    Choose another profile
                  </Button>

                  <Button
                    type="submit"
                    loading={isSubmitting}
                    disabled={!!pinStatus?.isLocked}
                    style={{
                      backgroundColor: PRIMARY_BROWN,
                      color: "white",
                    }}
                  >
                    {requiresPinSetup ? "Create PIN and Continue" : "Unlock Profile"}
                  </Button>
                </Group>
              </Stack>
            </form>
          </Card>
        </Group>
      </Box>
    </Box>
  );
}
