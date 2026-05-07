import { useEffect, useMemo, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Card,
  Grid,
  Group,
  Modal,
  Select,
  Stack,
  Text,
  TextInput,
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
import { createManagedProfile } from "@/api/admin/userManagement";
import {
  PRIMARY_GOLD,
  PRIMARY_BROWN,
  MUTED_OLIVE,
  CHARCOAL,
  BG,
  ACCENT_TAN,
} from "@utils/constants";
import { showSuccess } from "@utils/notification";

const formatRole = (role) =>
  role === "supervising_lawyer"
    ? "Supervising Lawyer"
    : role === "intern"
      ? "Legal Intern"
      : role
        ? role.charAt(0).toUpperCase() + role.slice(1)
        : "Staff";

const ROLE_OPTIONS = [
  { value: "secretary", label: "Secretary" },
  { value: "intern", label: "Legal Intern" },
  { value: "supervising_lawyer", label: "Supervising Lawyer" },
  { value: "director", label: "Director" },
];

const normalizeProfileValue = (value) => String(value || "").trim().toLowerCase();

const validateProfileDraft = (draft, profiles) => {
  const firstName = String(draft.firstName || "").trim();
  const lastName = String(draft.lastName || "").trim();
  const role = String(draft.role || "").trim();
  const startDate = String(draft.startDate || "").trim();
  const endDate = String(draft.endDate || "").trim();

  if (!firstName || !lastName || !role) {
    return "Please enter a first name, last name, and role.";
  }

  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return "Start Date and End Date must be valid dates.";
    }
    if (start.getTime() > end.getTime()) {
      return "End Date cannot be before the Start Date.";
    }
  }

  const duplicate = profiles.some((profile) =>
    normalizeProfileValue(profile.firstName) === normalizeProfileValue(firstName) &&
    normalizeProfileValue(profile.lastName) === normalizeProfileValue(lastName) &&
    normalizeProfileValue(profile.role) === normalizeProfileValue(role)
  );

  if (duplicate) {
    return "A profile with the same name and role already exists for this shared account.";
  }

  return "";
};

export default function ProfileSelection() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    userLoggedIn,
    loading,
    userData,
    currentUser,
    accountData,
    profiles,
    activeProfileId,
    selectProfile,
    refreshProfiles,
  } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittingProfileId, setSubmittingProfileId] = useState("");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [profileForm, setProfileForm] = useState({
    firstName: "",
    lastName: "",
    role: "",
    startDate: "",
    endDate: "",
  });

  useEffect(() => {
    const state = location.state;
    if (!state || !state.signupSuccess) return;

    showSuccess('Account Created', state.signupMessage || 'Choose or create a staff profile next.');
    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate]);

  const selectableProfiles = useMemo(
    () => profiles.filter((profile) => !profile.disabled),
    [profiles]
  );

  const handleOpenCreateModal = () => setCreateModalOpen(true);
  const handleCloseCreateModal = () => {
    setCreateModalOpen(false);
    setProfileForm({ firstName: "", lastName: "", role: "", startDate: "", endDate: "" });
    setCreateLoading(false);
  };

  const handleCreateProfile = async () => {
    const validationMessage = validateProfileDraft(profileForm, profiles);
    if (validationMessage) {
      notifications.show({
        title: "Profile details needed",
        message: validationMessage,
        color: "yellow",
      });
      return;
    }

    setCreateLoading(true);
    try {
      await createManagedProfile(profileForm);
      await refreshProfiles();
      notifications.show({
        title: "Profile created",
        message: "The new profile is ready for future logins and profile selection.",
        color: "green",
      });
      handleCloseCreateModal();
    } catch (error) {
      notifications.show({
        title: "Create failed",
        message: error?.response?.data?.message || "We couldn't create the profile right now.",
        color: "red",
      });
      setCreateLoading(false);
    }
  };
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
      setSubmittingProfileId(profileId);
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
      setSubmittingProfileId("");
    }
  };

  return (
    <Box
      style={{
        minHeight: "100vh",
        background: `linear-gradient(180deg, #F9F5EE 0%, ${BG} 100%)`,
        padding: "24px 16px",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600&family=DM+Sans:wght@400;500;600&display=swap');
        .profile-selection * { font-family: 'DM Sans', sans-serif; }

        .profile-selection .profile-menu-card {
          transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
        }

        .profile-selection .profile-menu-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 26px rgba(36, 22, 10, 0.08);
          border-color: rgba(139, 69, 19, 0.24);
        }

        @media (max-width: 768px) {
          .profile-selection .profile-page-title {
            font-size: 30px !important;
          }
        }
      `}</style>

      <Box className="profile-selection" maw={1180} mx="auto">
        <Group justify="space-between" align="flex-end" mb={18} wrap="wrap" gap="sm">
          <Group gap="sm" align="flex-start" wrap="nowrap">
            <ActionIcon
              variant="subtle"
              color="gray"
              size="md"
              onClick={handleBackToLogin}
              style={{ width: "fit-content" }}
            >
              <IconArrowLeft size={18} />
            </ActionIcon>

            <Box>
              <Text
                className="profile-page-title"
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 34,
                  fontWeight: 600,
                  color: CHARCOAL,
                  lineHeight: 1.05,
                }}
              >
                Choose a staff profile
              </Text>

              <Text size="sm" c={MUTED_OLIVE} maw={680} mt={6}>
                Pick the profile you want to use in this session.
              </Text>
            </Box>
          </Group>
        </Group>

        <Card
          radius="lg"
          shadow="xs"
          p="md"
          mb="md"
          style={{
            background: "white",
            border: "1px solid rgba(139, 69, 19, 0.1)",
          }}
        >
          <Group justify="space-between" align="center" wrap="wrap" gap="xs">
            <Box>
              <Text size="10px" fw={700} tt="uppercase" c={MUTED_OLIVE} lts={0.6}>
                Shared Account
              </Text>
              <Text fw={700} size="lg" mt={2} c={CHARCOAL}>
                {accountData?.email || currentUser?.email || "Signed-in account"}
              </Text>
            </Box>

            <Group gap="xs" wrap="wrap">
              <Badge
                radius="xl"
                variant="light"
                style={{
                  backgroundColor: accountData?.isVerified ? "#E8F8EE" : "#FFF4E6",
                  color: accountData?.isVerified ? "#2F6B3E" : "#A76414",
                  border: accountData?.isVerified ? "1px solid #B7E4C7" : "1px solid #FFD8A8",
                }}
              >
                {accountData?.isVerified ? "Verified" : "Verification pending"}
              </Badge>

              {(userData || activeProfile) && activeProfileId ? (
                <Badge
                  radius="xl"
                  variant="light"
                  style={{
                    backgroundColor: `${PRIMARY_GOLD}20`,
                    color: PRIMARY_BROWN,
                    border: `1px solid ${PRIMARY_GOLD}55`,
                  }}
                >
                  Current: {userData?.firstName || activeProfile?.firstName} {userData?.lastName || activeProfile?.lastName}
                </Badge>
              ) : (
                <Badge
                  radius="xl"
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
          </Group>
        </Card>

        <Group position="right" mb="md" style={{ width: "100%" }}>
          <Button
            size="sm"
            radius="md"
            onClick={handleOpenCreateModal}
            style={{ backgroundColor: PRIMARY_BROWN, color: "white" }}
          >
            Create Another Profile
          </Button>
        </Group>

        <Grid gutter={{ base: "sm", md: "md" }}>
          {selectableProfiles.map((profile) => (
            <Grid.Col key={profile.id} span={{ base: 12, sm: 6, lg: 4, xl: 3 }}>
              <Card
                className="profile-menu-card"
                radius="lg"
                shadow="xs"
                p="md"
                style={{
                  height: 228,
                  background:
                    activeProfileId === profile.id
                      ? "linear-gradient(165deg, rgba(139,69,19,0.07) 0%, rgba(196,171,125,0.14) 100%)"
                      : "white",
                  border:
                    activeProfileId === profile.id
                      ? `1px solid ${PRIMARY_GOLD}`
                      : "1px solid rgba(139, 69, 19, 0.1)",
                }}
              >
                <Stack h="100%" justify="space-between" gap="sm">
                  <Stack gap={10}>
                    <Group justify="space-between" align="flex-start" wrap="nowrap">
                      <Group gap="xs" align="flex-start" wrap="nowrap" style={{ minWidth: 0 }}>
                        <Box
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: "10px",
                            display: "grid",
                            placeItems: "center",
                            background: "rgba(196,171,125,0.16)",
                            color: PRIMARY_BROWN,
                            flexShrink: 0,
                          }}
                        >
                          <IconUserCircle size={22} />
                        </Box>

                        <Box style={{ minWidth: 0 }}>
                          <Text fw={700} size="sm" c={CHARCOAL} lh={1.3} truncate>
                            {profile.firstName} {profile.lastName}
                          </Text>
                          <Text size="xs" c={MUTED_OLIVE} mt={2} truncate>
                            {formatRole(profile.role)}
                          </Text>
                        </Box>
                      </Group>

                      {activeProfileId === profile.id && (
                        <Badge
                          radius="xl"
                          size="xs"
                          variant="filled"
                          style={{
                            backgroundColor: PRIMARY_BROWN,
                            flexShrink: 0,
                          }}
                        >
                          Active
                        </Badge>
                      )}
                    </Group>

                    <Stack gap={4}>
                      <Text size="xs" c={MUTED_OLIVE}>
                        <Text span fw={700} c={CHARCOAL}>Role:</Text> {formatRole(profile.role)}
                      </Text>
                      <Text size="xs" c={MUTED_OLIVE} truncate>
                        <Text span fw={700} c={CHARCOAL}>Account:</Text> {profile.email}
                      </Text>
                    </Stack>
                  </Stack>

                  <Button
                    fullWidth
                    size="sm"
                    radius="md"
                    rightSection={<IconChevronRight size={15} />}
                    loading={isSubmitting && submittingProfileId === profile.id}
                    disabled={isSubmitting && submittingProfileId !== profile.id}
                    onClick={() => handleSelectProfile(profile.id)}
                    style={{
                      backgroundColor: activeProfileId === profile.id ? PRIMARY_GOLD : PRIMARY_BROWN,
                      color: activeProfileId === profile.id ? CHARCOAL : "white",
                    }}
                  >
                    {activeProfileId === profile.id ? "Continue" : "Select Profile"}
                  </Button>
                </Stack>
              </Card>
            </Grid.Col>
          ))}

          {selectableProfiles.length === 0 && (
            <Grid.Col span={12}>
              <Card
                radius="lg"
                shadow="xs"
                p="lg"
                style={{
                  background: "white",
                  border: "1px dashed rgba(139, 69, 19, 0.25)",
                }}
              >
                <Stack gap={6} align="center" ta="center">
                  <IconUserCircle size={34} color={PRIMARY_BROWN} />
                  <Title order={4} c={CHARCOAL}>
                    No profiles available
                  </Title>
                  <Text c={MUTED_OLIVE} size="sm" maw={560}>
                    This shared account does not have any active profiles yet. Use the button above to create a new
                    staff profile for this account.
                  </Text>
                  <Text size="sm" c={MUTED_OLIVE}>
                    Once created, the profile will appear here for selection.
                  </Text>
                </Stack>
              </Card>
            </Grid.Col>
          )}
        </Grid>

        <Modal opened={createModalOpen} onClose={handleCloseCreateModal} title="Create another staff profile" centered>
          <Stack spacing="md">
            <TextInput
              label="First Name"
              placeholder="Enter first name"
              value={profileForm.firstName}
              onChange={(event) => {
                const nextValue = event.currentTarget.value;
                setProfileForm((prev) => ({ ...prev, firstName: nextValue }));
              }}
            />
            <TextInput
              label="Last Name"
              placeholder="Enter last name"
              value={profileForm.lastName}
              onChange={(event) => {
                const nextValue = event.currentTarget.value;
                setProfileForm((prev) => ({ ...prev, lastName: nextValue }));
              }}
            />
            <Select
              label="Role"
              placeholder="Choose a role"
              data={ROLE_OPTIONS}
              value={profileForm.role}
              onChange={(value) => setProfileForm((prev) => ({ ...prev, role: value || "" }))}
            />
            <Group grow>
              <TextInput
                label="Start Date"
                type="date"
                value={profileForm.startDate}
                onChange={(event) => {
                  const nextValue = event.currentTarget.value;
                  setProfileForm((prev) => ({ ...prev, startDate: nextValue }));
                }}
              />
              <TextInput
                label="End Date"
                type="date"
                value={profileForm.endDate}
                onChange={(event) => {
                  const nextValue = event.currentTarget.value;
                  setProfileForm((prev) => ({ ...prev, endDate: nextValue }));
                }}
              />
            </Group>
            <Group position="right" spacing="sm">
              <Button variant="outline" onClick={handleCloseCreateModal} disabled={createLoading}>
                Cancel
              </Button>
              <Button onClick={handleCreateProfile} loading={createLoading}>
                Create Profile
              </Button>
            </Group>
          </Stack>
        </Modal>
      </Box>
    </Box>
  );
}
