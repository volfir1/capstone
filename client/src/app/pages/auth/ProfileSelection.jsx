import { useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Card,
  Grid,
  Group,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  IconArrowLeft,
  IconChevronRight,
  IconUserCircle,
} from "@tabler/icons-react";

import { useAuth } from "@/context/authContext";
import { Loaders } from "@/components/ui/Loader";
import { doSignOut } from "@/firebase/auth";
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

export default function ProfileSelection() {
  const navigate = useNavigate();
  const {
    userLoggedIn,
    loading,
    userData,
    currentUser,
    accountData,
    profiles,
    activeProfileId,
    selectProfile,
  } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectableProfiles = useMemo(
    () => profiles.filter((profile) => !profile.disabled),
    [profiles]
  );
  const activeProfile = useMemo(
    () => selectableProfiles.find((profile) => profile.id === activeProfileId) || null,
    [activeProfileId, selectableProfiles]
  );

  const handleBackToLogin = async () => {
    await doSignOut();
    navigate("/auth/admin", { replace: true });
  };

  if (loading) {
    return <Loaders height={window.innerHeight} />;
  }

  if (!userLoggedIn) {
    return <Navigate to="/auth/admin" replace />;
  }

  const handleSelectProfile = async (profileId) => {
    try {
      setIsSubmitting(true);
      await selectProfile(profileId);
      navigate("/auth/profile-pin", { replace: true });
    } catch (error) {
      notifications.show({
        title: "Profile selection failed",
        message: error?.response?.data?.message || "We couldn't open that staff profile.",
        color: "red",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

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
        .profile-selection * { font-family: 'DM Sans', sans-serif; }
      `}</style>

      <Box className="profile-selection" maw={1120} mx="auto">
        <Group justify="space-between" align="flex-start" mb={32}>
          <Stack gap={10}>
            <ActionIcon
              variant="subtle"
              color="gray"
              size="lg"
              onClick={handleBackToLogin}
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
              Choose a staff profile
            </Text>

            <Text size="md" c={MUTED_OLIVE} maw={700}>
              One SOLA account can hold multiple staff identities. Pick the profile you want to use for this session.
            </Text>
          </Stack>
        </Group>

        <Card
          radius="xl"
          shadow="sm"
          p="xl"
          mb="xl"
          style={{
            background: "white",
            border: "1px solid rgba(139, 69, 19, 0.08)",
          }}
        >
          <Group justify="space-between" align="center" wrap="wrap" gap="md">
            <Box>
              <Text size="sm" fw={700} tt="uppercase" c={MUTED_OLIVE}>
                Shared Account
              </Text>
              <Title order={4} mt={4} c={CHARCOAL}>
                {accountData?.email || currentUser?.email || "Signed-in account"}
              </Title>
              <Text size="sm" c={MUTED_OLIVE} mt={6}>
                {accountData?.isVerified ? "Verified" : "Verification pending"}
              </Text>
            </Box>

            {(userData || activeProfile) && activeProfileId ? (
              <Badge
                radius="xl"
                size="lg"
                variant="light"
                style={{
                  backgroundColor: `${PRIMARY_GOLD}20`,
                  color: PRIMARY_BROWN,
                  border: `1px solid ${PRIMARY_GOLD}50`,
                }}
              >
                Current: {userData?.firstName || activeProfile?.firstName} {userData?.lastName || activeProfile?.lastName}
              </Badge>
            ) : (
              <Badge
                radius="xl"
                size="lg"
                variant="light"
                style={{
                  backgroundColor: `${ACCENT_TAN}20`,
                  color: MUTED_OLIVE,
                  border: `1px solid ${ACCENT_TAN}50`,
                }}
              >
                No active profile selected
              </Badge>
            )}
          </Group>
        </Card>

        <Grid gutter="lg">
          {selectableProfiles.map((profile) => (
            <Grid.Col key={profile.id} span={{ base: 12, md: 6 }}>
              <Card
                radius="xl"
                shadow="sm"
                p="xl"
                style={{
                  height: "100%",
                  background:
                    activeProfileId === profile.id
                      ? "linear-gradient(160deg, rgba(139,69,19,0.08) 0%, rgba(196,171,125,0.16) 100%)"
                      : "white",
                  border:
                    activeProfileId === profile.id
                      ? `1px solid ${PRIMARY_GOLD}`
                      : "1px solid rgba(139, 69, 19, 0.08)",
                }}
              >
                <Group justify="space-between" align="flex-start" mb="lg">
                  <Group gap="md" align="flex-start">
                    <Box
                      style={{
                        width: 52,
                        height: 52,
                        borderRadius: "50%",
                        display: "grid",
                        placeItems: "center",
                        background: "rgba(196,171,125,0.18)",
                        color: PRIMARY_BROWN,
                      }}
                    >
                      <IconUserCircle size={28} />
                    </Box>

                    <Box>
                      <Text size="xl" fw={700} c={CHARCOAL}>
                        {profile.firstName} {profile.lastName}
                      </Text>
                      <Text size="sm" c={MUTED_OLIVE} mt={4}>
                        {formatRole(profile.role)}
                      </Text>
                    </Box>
                  </Group>

                  {activeProfileId === profile.id && (
                    <Badge
                      radius="xl"
                      variant="filled"
                      style={{ backgroundColor: PRIMARY_BROWN }}
                    >
                      Active
                    </Badge>
                  )}
                </Group>

                <Stack gap={8} mb="xl">
                  <Text size="sm" c={MUTED_OLIVE}>
                    <strong style={{ color: CHARCOAL }}>Role:</strong> {formatRole(profile.role)}
                  </Text>
                  <Text size="sm" c={MUTED_OLIVE}>
                    <strong style={{ color: CHARCOAL }}>Account:</strong> {profile.email}
                  </Text>
                </Stack>

                <Button
                  fullWidth
                  rightSection={<IconChevronRight size={16} />}
                  loading={isSubmitting}
                  onClick={() => handleSelectProfile(profile.id)}
                  style={{
                    backgroundColor: activeProfileId === profile.id ? PRIMARY_GOLD : PRIMARY_BROWN,
                    color: activeProfileId === profile.id ? CHARCOAL : "white",
                  }}
                >
                  {activeProfileId === profile.id ? "Continue with this profile" : "Use this profile"}
                </Button>
              </Card>
            </Grid.Col>
          ))}

          {selectableProfiles.length === 0 && (
            <Grid.Col span={12}>
              <Card
                radius="xl"
                shadow="sm"
                p="xl"
                style={{
                  background: "white",
                  border: "1px dashed rgba(139, 69, 19, 0.25)",
                }}
              >
                <Stack gap="sm" align="center" ta="center">
                  <IconUserCircle size={42} color={PRIMARY_BROWN} />
                  <Title order={4} c={CHARCOAL}>
                    No profiles available
                  </Title>
                  <Text c={MUTED_OLIVE} maw={560}>
                    This shared account does not have any active profiles yet. Profiles can now be created only from
                    the Manage Profiles page of an existing signed-in profile for this same account.
                  </Text>
                  <Text size="sm" c={MUTED_OLIVE}>
                    Sign out and use an account that already has a profile, or ask your office administrator to add one.
                  </Text>
                </Stack>
              </Card>
            </Grid.Col>
          )}
        </Grid>
      </Box>
    </Box>
  );
}
