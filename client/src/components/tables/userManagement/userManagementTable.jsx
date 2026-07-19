import {
  Table,
  Paper,
  Group,
  Select,
  Stack,
  Text,
  Box,
  Badge,
  ActionIcon,
  Tooltip,
  Title,
  Container,
  Menu,
  Modal,
  Button,
  Tabs,
  Pagination,
  ScrollArea,
  Divider,
  TextInput,
  Card,
  SimpleGrid,
} from "@mantine/core";
import {
  IconCircleFilled,
  IconDots,
  IconEdit,
  IconKey,
  IconLock,
  IconLockOpen,
  IconMail,
  IconPlus,
  IconRefresh,
  IconTrash,
  IconUsers,
} from "@tabler/icons-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { notifications } from "@mantine/notifications";

import { useProfiles } from "@/hooks/admin/users";
import { useAuth } from "@/context/authContext";
import UserManagementSkeleton from "@/components/skeleton/UserManagementSkeleton";
import UserSearchFilter from "@/components/search/userSearch";
import {
  createManagedProfile,
  deleteManagedProfile,
  resetManagedProfilePin,
  sendPasswordReset,
  toggleUserStatus,
  updateManagedProfile,
} from "@/api/admin/userManagement";
import {
  PRIMARY_BROWN,
  MUTED_OLIVE,
  BG,
  CHARCOAL,
  ACCENT_TAN,
} from "@/utils/constants";

const ROLE_OPTIONS = [
  { value: "secretary", label: "Secretary" },
  { value: "intern", label: "Legal Intern" },
  { value: "supervising_lawyer", label: "Supervising Lawyer" },
  { value: "director", label: "Director" },
];

const ROLE_LABELS = {
  secretary: "Secretary",
  intern: "Legal Intern",
  supervising_lawyer: "Supervising Lawyer",
  director: "Director",
};

const ROLE_STYLES = {
  secretary: { backgroundColor: `${PRIMARY_BROWN}12`, color: PRIMARY_BROWN, border: `${PRIMARY_BROWN}30` },
  intern: { backgroundColor: "#E7F5FF", color: "#1864AB", border: "#74C0FC" },
  supervising_lawyer: { backgroundColor: "#E6FCF5", color: "#087F5B", border: "#63E6BE" },
  director: { backgroundColor: "#FFF4E6", color: "#C16A00", border: "#FFD8A8" },
};

const EMPTY_FORM = {
  firstName: "",
  lastName: "",
  role: "",
  startDate: "",
  endDate: "",
};

const formatRole = (role) => ROLE_LABELS[role] || "Profile";

const getRoleBadgeStyle = (role) => {
  const style = ROLE_STYLES[role] || {
    backgroundColor: `${ACCENT_TAN}25`,
    color: CHARCOAL,
    border: `${ACCENT_TAN}70`,
  };

  return {
    backgroundColor: style.backgroundColor,
    color: style.color,
    border: `1px solid ${style.border}`,
    fontWeight: 600,
  };
};

const normalizeProfileValue = (value) => String(value || "").trim().toLowerCase();

const toDateInputValue = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 10);
};

const getTodayInputValue = () => toDateInputValue(new Date());

const formatDisplayDate = (value, fallback = "Not set") => {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const validateProfileDraft = (draft, profiles, editingId = "") => {
  const firstName = String(draft.firstName || "").trim();
  const lastName = String(draft.lastName || "").trim();
  const role = String(draft.role || "").trim();

  if (!firstName || !lastName || !role) {
    return "Please enter a first name, last name, and role.";
  }

  if (draft.startDate && draft.endDate && new Date(draft.startDate) > new Date(draft.endDate)) {
    return "Start Date cannot be after End Date.";
  }

  const duplicate = profiles.some((profile) => {
    if (profile.id === editingId) return false;

    return (
      normalizeProfileValue(profile.firstName) === normalizeProfileValue(firstName) &&
      normalizeProfileValue(profile.lastName) === normalizeProfileValue(lastName) &&
      normalizeProfileValue(profile.role) === normalizeProfileValue(role)
    );
  });

  if (duplicate) {
    return "A profile with the same name and role already exists for this shared account.";
  }

  return "";
};

function ProfileCard({ row, onEdit, onResetPin, onToggleStatus, onDelete }) {
  return (
    <Box
      px="md"
      py="sm"
      style={{
        backgroundColor: row.disabled ? "#FEF2F2" : "white",
        opacity: row.disabled ? 0.74 : 1,
      }}
    >
      <Group justify="space-between" align="flex-start" wrap="nowrap" mb={8}>
        <Box style={{ minWidth: 0 }}>
          <Group gap={8} wrap="wrap" mb={2}>
            <Text fw={600} size="sm" c={CHARCOAL} truncate>
              {row.name}
            </Text>
            {row.isCurrent && (
              <Badge size="xs" radius="xl" variant="light" color="green">
                Current Session
              </Badge>
            )}
            {!row.isCurrent && row.isLastUsed && (
              <Badge size="xs" radius="xl" variant="light" color="yellow">
                Last Used
              </Badge>
            )}
          </Group>
          <Text size="xs" c={MUTED_OLIVE} truncate>
            {formatRole(row.role)}
          </Text>
          <Text size="xs" c={MUTED_OLIVE} truncate mt={2}>
            {row.email}
          </Text>
        </Box>

        <Menu shadow="md" width={220} position="bottom-end">
          <Menu.Target>
            <ActionIcon
              variant="light"
              size="md"
              radius="md"
              color="gray"
              style={{ border: "1px solid #E5E7EB", flexShrink: 0 }}
            >
              <IconDots size={16} stroke={1.5} />
            </ActionIcon>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Label>Profile Actions</Menu.Label>
            <Menu.Item leftSection={<IconEdit size={16} />} onClick={() => onEdit(row)}>
              Edit Profile
            </Menu.Item>
            <Menu.Item leftSection={<IconKey size={16} />} onClick={() => onResetPin(row)}>
              Reset PIN
            </Menu.Item>
            <Menu.Item
              leftSection={row.disabled ? <IconLockOpen size={16} /> : <IconLock size={16} />}
              onClick={() => onToggleStatus(row)}
            >
              {row.disabled ? "Enable Profile" : "Disable Profile"}
            </Menu.Item>
            <Menu.Divider />
            <Menu.Item color="red" leftSection={<IconTrash size={16} />} onClick={() => onDelete(row)}>
              Archive Profile
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </Group>

      <Group gap="sm" wrap="wrap">
        <Badge size="sm" radius="sm" variant="light" style={getRoleBadgeStyle(row.role)}>
          {formatRole(row.role)}
        </Badge>

        <Group gap={4} wrap="nowrap">
          <IconCircleFilled
            size={8}
            style={{ color: row.status === "Active" ? "#22C55E" : "#9CA3AF" }}
          />
          <Text size="xs" fw={500} c={row.status === "Active" ? "#16A34A" : "#6B7280"}>
            {row.status}
          </Text>
        </Group>

        <Text size="xs" c={MUTED_OLIVE}>
          Start {row.startDateLabel}
        </Text>
        <Text size="xs" c={MUTED_OLIVE}>
          End {row.endDateLabel}
        </Text>
        <Text size="xs" c={row.pinStatus === "PIN ready" ? "#2F6B3E" : MUTED_OLIVE}>
          {row.pinStatus}
        </Text>
      </Group>
    </Box>
  );
}

export default function UserManagementTable() {
  const navigate = useNavigate();
  const { profiles, isLoading, error, refetch } = useProfiles();
  const {
    accountData,
    activeProfileId,
    refreshProfiles,
    refreshUserData,
    clearSelectedProfile,
    markActiveProfilePinReset,
  } = useAuth();

  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState("10");
  const [actionLoading, setActionLoading] = useState(false);

  const [profileModalOpened, setProfileModalOpened] = useState(false);
  const [profileModalMode, setProfileModalMode] = useState("create");
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [profileForm, setProfileForm] = useState(EMPTY_FORM);

  const [deleteModalOpened, setDeleteModalOpened] = useState(false);
  const [profileToDelete, setProfileToDelete] = useState(null);
  const [archiveEndDate, setArchiveEndDate] = useState("");
  const [pinResetModalOpened, setPinResetModalOpened] = useState(false);
  const [profileToResetPin, setProfileToResetPin] = useState(null);

  const tableData = useMemo(
    () =>
      profiles.map((profile) => ({
        id: profile.id,
        name: `${profile.firstName} ${profile.lastName}`.trim(),
        firstName: profile.firstName,
        lastName: profile.lastName,
        email: profile.email,
        role: profile.role,
        startDate: toDateInputValue(profile.startDate),
        endDate: toDateInputValue(profile.endDate),
        startDateLabel: formatDisplayDate(profile.startDate),
        endDateLabel: formatDisplayDate(profile.endDate, "Present"),
        status: profile.disabled ? "Inactive" : "Active",
        disabled: profile.disabled || false,
        isCurrent: activeProfileId === profile.id,
        isLastUsed: accountData?.lastSelectedProfileId === profile.id,
        pinStatus: !profile.pinEnabled || profile.pinResetRequired ? "PIN setup needed" : "PIN ready",
        date: formatDisplayDate(profile.createdAt),
      })),
    [profiles, activeProfileId, accountData?.lastSelectedProfileId]
  );

  const filteredData = useMemo(() => {
    const searchFiltered = tableData.filter((item) => {
      const haystack = `${item.name} ${item.email} ${formatRole(item.role)}`.toLowerCase();
      return haystack.includes(searchQuery.toLowerCase());
    });

    return searchFiltered.filter((item) => {
      if (activeTab === "all") return true;
      if (activeTab === "inactive") return item.disabled === true;
      return item.role === activeTab && item.disabled === false;
    });
  }, [tableData, searchQuery, activeTab]);

  const perPage = parseInt(rowsPerPage, 10);
  const totalPages = Math.max(1, Math.ceil(filteredData.length / perPage));
  const safePage = Math.min(page, totalPages);
  const paginatedData = filteredData.slice((safePage - 1) * perPage, safePage * perPage);

  const tabDefs = [
    { value: "all", shortLabel: "All", fullLabel: "All Profiles", count: tableData.length },
    { value: "secretary", shortLabel: "Sec.", fullLabel: "Secretaries", count: tableData.filter((p) => p.role === "secretary" && !p.disabled).length },
    { value: "intern", shortLabel: "Interns", fullLabel: "Interns", count: tableData.filter((p) => p.role === "intern" && !p.disabled).length },
    { value: "supervising_lawyer", shortLabel: "Sup.", fullLabel: "Sup. Lawyers", count: tableData.filter((p) => p.role === "supervising_lawyer" && !p.disabled).length },
    { value: "director", shortLabel: "Dir.", fullLabel: "Directors", count: tableData.filter((p) => p.role === "director" && !p.disabled).length },
    { value: "inactive", shortLabel: "Inactive", fullLabel: "Inactive", count: tableData.filter((p) => p.disabled).length },
  ];

  const syncProfileViews = async () => {
    await Promise.all([refetch(), refreshProfiles()]);
  };

  const resetProfileModal = () => {
    setProfileModalOpened(false);
    setProfileModalMode("create");
    setSelectedProfile(null);
    setProfileForm(EMPTY_FORM);
  };

  const handleOpenCreateModal = () => {
    setProfileModalMode("create");
    setSelectedProfile(null);
    setProfileForm(EMPTY_FORM);
    setProfileModalOpened(true);
  };

  const handleOpenEditModal = (profile) => {
    setProfileModalMode("edit");
    setSelectedProfile(profile);
    setProfileForm({
      firstName: profile.firstName,
      lastName: profile.lastName,
      role: profile.role,
      startDate: profile.startDate,
      endDate: profile.endDate,
    });
    setProfileModalOpened(true);
  };

  const handleSaveProfile = async () => {
    const validationMessage = validateProfileDraft(
      profileForm,
      profiles,
      profileModalMode === "edit" ? selectedProfile?.id : ""
    );

    if (validationMessage) {
      notifications.show({
        title: "Profile details needed",
        message: validationMessage,
        color: "yellow",
      });
      return;
    }

    setActionLoading(true);
    try {
      if (profileModalMode === "create") {
        await createManagedProfile(profileForm);
        notifications.show({
          title: "Profile created",
          message: "The new profile is ready for future logins and profile selection.",
          color: "green",
        });
      } else if (selectedProfile) {
        await updateManagedProfile(selectedProfile.id, profileForm);
        notifications.show({
          title: "Profile updated",
          message: "Profile details were updated successfully.",
          color: "green",
        });

        if (selectedProfile.isCurrent) {
          await refreshUserData();
        }
      }

      await syncProfileViews();
      resetProfileModal();
    } catch (saveError) {
      notifications.show({
        title: profileModalMode === "create" ? "Create failed" : "Update failed",
        message: saveError.message || "We couldn't save the profile right now.",
        color: "red",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleStatus = async (profile) => {
    const isDisabling = !profile.disabled;
    setActionLoading(true);
    try {
      await toggleUserStatus(profile.id, isDisabling);
      notifications.show({
        title: isDisabling ? "Profile disabled" : "Profile enabled",
        message: `${profile.name} is now ${isDisabling ? "inactive" : "active"}.`,
        color: "green",
      });

      if (profile.isCurrent && isDisabling) {
        clearSelectedProfile();
        await refreshProfiles();
        navigate("/auth/profiles", { replace: true });
        return;
      }

      await syncProfileViews();
    } catch (toggleError) {
      notifications.show({
        title: "Status update failed",
        message: toggleError.message || "We couldn't update this profile's status.",
        color: "red",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmDelete = (profile) => {
    setProfileToDelete(profile);
    setArchiveEndDate(profile.endDate || getTodayInputValue());
    setDeleteModalOpened(true);
  };

  const handleConfirmResetPin = (profile) => {
    setProfileToResetPin(profile);
    setPinResetModalOpened(true);
  };

  const handleResetProfilePin = async () => {
    if (!profileToResetPin) return;

    setActionLoading(true);
    try {
      await resetManagedProfilePin(profileToResetPin.id);
      notifications.show({
        title: "Profile PIN reset",
        message: `${profileToResetPin.name} will need to create a new PIN on the next access.`,
        color: "green",
      });

      const wasCurrentProfile = profileToResetPin.isCurrent;
      setPinResetModalOpened(false);
      setProfileToResetPin(null);

      if (wasCurrentProfile) {
        await syncProfileViews();
        markActiveProfilePinReset();
        navigate("/auth/profile-pin", { replace: true });
        return;
      }

      await syncProfileViews();
    } catch (resetError) {
      notifications.show({
        title: "PIN reset failed",
        message: resetError.message || "We couldn't reset this profile PIN.",
        color: "red",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteProfile = async () => {
    if (!profileToDelete) return;

    if (!archiveEndDate) {
      notifications.show({
        title: "End Date needed",
        message: "Set the profile End Date before moving it to legacy history.",
        color: "yellow",
      });
      return;
    }

    if (profileToDelete.startDate && new Date(profileToDelete.startDate) > new Date(archiveEndDate)) {
      notifications.show({
        title: "Check tenure dates",
        message: "End Date cannot be before the profile Start Date.",
        color: "yellow",
      });
      return;
    }

    setActionLoading(true);
    try {
      await deleteManagedProfile(profileToDelete.id, { endDate: archiveEndDate });
      notifications.show({
        title: "Profile archived",
        message: `${profileToDelete.name} has been moved to legacy history.`,
        color: "green",
      });

      const wasCurrentProfile = profileToDelete.isCurrent;
      setDeleteModalOpened(false);
      setProfileToDelete(null);
      setArchiveEndDate("");

      if (wasCurrentProfile) {
        clearSelectedProfile();
        await refreshProfiles();
        navigate("/auth/profiles", { replace: true });
        return;
      }

      await syncProfileViews();
    } catch (deleteError) {
      notifications.show({
        title: "Archive failed",
        message: deleteError.message || "We couldn't archive this profile.",
        color: "red",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetSharedPassword = async () => {
    if (!accountData?.email) {
      notifications.show({
        title: "Missing account email",
        message: "We couldn't find the shared login email for this account.",
        color: "yellow",
      });
      return;
    }

    setActionLoading(true);
    try {
      await sendPasswordReset(accountData.email);
      notifications.show({
        title: "Password reset sent",
        message: `A reset link was sent to ${accountData.email}.`,
        color: "green",
      });
    } catch (resetError) {
      notifications.show({
        title: "Reset failed",
        message: resetError.message || "We couldn't send the password reset email.",
        color: "red",
      });
    } finally {
      setActionLoading(false);
    }
  };

  if (isLoading) return <UserManagementSkeleton />;

  if (error) {
    return (
      <Box style={{ textAlign: "center", padding: "40px" }}>
        <Text c="red" fw={500}>
          Error: {error}
        </Text>
      </Box>
    );
  }

  const rows = paginatedData.map((row) => (
    <Table.Tr
      key={row.id}
      className="user-row"
      style={{
        backgroundColor: row.disabled ? "#FEF2F2" : "white",
        borderBottom: "1px solid #E5E7EB",
        opacity: row.disabled ? 0.74 : 1,
      }}
    >
      <Table.Td style={{ padding: "14px 20px" }}>
        <Stack gap={4}>
          <Text fw={600} style={{ color: CHARCOAL, fontSize: "14px" }}>
            {row.name}
          </Text>
          <Text size="xs" c={MUTED_OLIVE}>
            {row.email}
          </Text>
        </Stack>
      </Table.Td>
      <Table.Td style={{ padding: "14px 20px" }}>
        <Badge size="sm" radius="sm" variant="light" style={getRoleBadgeStyle(row.role)}>
          {formatRole(row.role)}
        </Badge>
      </Table.Td>
      <Table.Td style={{ padding: "14px 20px" }}>
        <Group gap={6} wrap="wrap">
          <Badge size="sm" radius="xl" variant="light" color={row.disabled ? "gray" : "green"}>
            {row.status}
          </Badge>
          {row.isCurrent && (
            <Badge size="sm" radius="xl" variant="light" color="green">
              Current Session
            </Badge>
          )}
          {!row.isCurrent && row.isLastUsed && (
            <Badge size="sm" radius="xl" variant="light" color="yellow">
              Last Used
            </Badge>
          )}
          <Badge size="sm" radius="xl" variant="light" color={row.pinStatus === "PIN ready" ? "teal" : "yellow"}>
            {row.pinStatus}
          </Badge>
        </Group>
      </Table.Td>
      <Table.Td style={{ color: MUTED_OLIVE, fontSize: "14px", padding: "14px 20px" }}>
        {row.startDateLabel}
      </Table.Td>
      <Table.Td style={{ color: MUTED_OLIVE, fontSize: "14px", padding: "14px 20px" }}>
        {row.endDateLabel}
      </Table.Td>
      <Table.Td style={{ padding: "14px 20px" }}>
        <Group gap={8} justify="flex-end">
          <Menu shadow="md" width={220} position="bottom-end">
            <Menu.Target>
              <ActionIcon variant="light" size="md" radius="md" color="gray" style={{ border: "1px solid #E5E7EB" }}>
                <IconDots size={16} stroke={1.5} />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Label>Profile Actions</Menu.Label>
              <Menu.Item leftSection={<IconEdit size={16} />} onClick={() => handleOpenEditModal(row)}>
                Edit Profile
              </Menu.Item>
              <Menu.Item leftSection={<IconKey size={16} />} onClick={() => handleConfirmResetPin(row)}>
                Reset PIN
              </Menu.Item>
              <Menu.Item
                leftSection={row.disabled ? <IconLockOpen size={16} /> : <IconLock size={16} />}
                onClick={() => handleToggleStatus(row)}
              >
                {row.disabled ? "Enable Profile" : "Disable Profile"}
              </Menu.Item>
              <Menu.Divider />
              <Menu.Item color="red" leftSection={<IconTrash size={16} />} onClick={() => handleConfirmDelete(row)}>
                Archive Profile
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <>
      <Modal
        opened={profileModalOpened}
        onClose={resetProfileModal}
        title={profileModalMode === "create" ? "Add Profile" : "Edit Profile"}
        centered
      >
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            {profileModalMode === "create"
              ? "Create another staff profile under this shared account."
              : `Update the details for ${selectedProfile?.name || "this profile"}.`}
          </Text>
          <TextInput
            label="First Name"
            placeholder="Enter first name"
            value={profileForm.firstName}
            onChange={(event) => {
              const nextValue = event.currentTarget.value;
              setProfileForm((current) => ({
                ...current,
                firstName: nextValue,
              }))
            }}
          />
          <TextInput
            label="Last Name"
            placeholder="Enter last name"
            value={profileForm.lastName}
            onChange={(event) => {
              const nextValue = event.currentTarget.value;
              setProfileForm((current) => ({
                ...current,
                lastName: nextValue,
              }))
            }}
          />
          <Select
            label="Assigned Role"
            placeholder="Choose a role"
            data={ROLE_OPTIONS}
            value={profileForm.role}
            onChange={(value) =>
              setProfileForm((current) => ({
                ...current,
                role: value || "",
              }))
            }
            allowDeselect={false}
          />
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
            <TextInput
              type="date"
              label="Start Date"
              value={profileForm.startDate}
              onChange={(event) => {
                const nextValue = event.currentTarget.value;
                setProfileForm((current) => ({
                  ...current,
                  startDate: nextValue,
                }))
              }}
            />
            <TextInput
              type="date"
              label="End Date"
              value={profileForm.endDate}
              onChange={(event) => {
                const nextValue = event.currentTarget.value;
                setProfileForm((current) => ({
                  ...current,
                  endDate: nextValue,
                }))
              }}
            />
          </SimpleGrid>
          <Group justify="flex-end" mt="md">
            <Button variant="outline" onClick={resetProfileModal} disabled={actionLoading}>
              Cancel
            </Button>
            <Button onClick={handleSaveProfile} loading={actionLoading} style={{ backgroundColor: PRIMARY_BROWN }}>
              {profileModalMode === "create" ? "Create Profile" : "Save Changes"}
            </Button>
          </Group>
        </Stack>
      </Modal>

      <Modal
        opened={pinResetModalOpened}
        onClose={() => {
          if (actionLoading) return;
          setPinResetModalOpened(false);
          setProfileToResetPin(null);
        }}
        title="Reset Profile PIN"
        centered
      >
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            Reset the PIN for <strong>{profileToResetPin?.name}</strong>?
          </Text>
          <Text size="sm" c="dimmed">
            The next time this profile is selected, it will be asked to create a new PIN before entering the dashboard.
          </Text>
          {profileToResetPin?.isCurrent && (
            <Text size="sm" c="red">
              This is the profile currently being used. Resetting it will immediately send this session to the PIN setup screen.
            </Text>
          )}
          <Group justify="flex-end" mt="md">
            <Button
              variant="outline"
              onClick={() => {
                setPinResetModalOpened(false);
                setProfileToResetPin(null);
              }}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button leftSection={<IconKey size={16} />} loading={actionLoading} onClick={handleResetProfilePin}>
              Reset PIN
            </Button>
          </Group>
        </Stack>
      </Modal>

      <Modal
        opened={deleteModalOpened}
        onClose={() => {
          if (actionLoading) return;
          setDeleteModalOpened(false);
          setProfileToDelete(null);
          setArchiveEndDate("");
        }}
        title="Archive Profile"
        centered
      >
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            Move <strong>{profileToDelete?.name}</strong> from active profiles to legacy history?
          </Text>
          <Text size="sm" c="dimmed">
            This removes the profile from future profile selection and records the End Date below.
          </Text>
          <TextInput
            type="date"
            label="End Date"
            value={archiveEndDate}
            onChange={(event) => setArchiveEndDate(event.currentTarget.value)}
            required
          />
          {profileToDelete?.isCurrent && (
            <Text size="sm" c="red">
              This is the profile currently being used. Archiving it will send this session back to profile selection.
            </Text>
          )}
          <Group justify="flex-end" mt="md">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteModalOpened(false);
                setProfileToDelete(null);
                setArchiveEndDate("");
              }}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button color="red" loading={actionLoading} onClick={handleDeleteProfile}>
              Archive Profile
            </Button>
          </Group>
        </Stack>
      </Modal>

      <Box bg={BG} mih="100vh" py="xl">
        <style>{`
          ::-webkit-scrollbar { width: 8px; }
          ::-webkit-scrollbar-track { background: transparent; }
          ::-webkit-scrollbar-thumb { background: ${MUTED_OLIVE}; border-radius: 4px; }
          ::-webkit-scrollbar-thumb:hover { background: ${PRIMARY_BROWN}; }
          * { scrollbar-width: thin; scrollbar-color: ${MUTED_OLIVE} transparent; }
          .user-row:hover { background: #F9FAFB !important; }
        `}</style>

        <Container size="xl" px={{ base: "md", sm: "xl" }}>
          <Group justify="space-between" align="center" mb="lg" wrap="wrap">
            <Box>
              <Title order={3} c={CHARCOAL} lh={1.2}>
                Manage Profiles
              </Title>
              <Text size="sm" c={MUTED_OLIVE} mt={2}>
                Add, update, disable, and archive role-based profiles under the shared SOLA login.
              </Text>
            </Box>

            <Group gap="sm" wrap="wrap">
              <Button
                variant="outline"
                leftSection={<IconMail size={16} />}
                onClick={handleResetSharedPassword}
                loading={actionLoading}
              >
                Reset Login Password
              </Button>
              <Button
                leftSection={<IconPlus size={16} />}
                onClick={handleOpenCreateModal}
                style={{ backgroundColor: PRIMARY_BROWN }}
              >
                Add Profile
              </Button>
              <Tooltip label="Refresh profiles">
                <ActionIcon size="md" variant="subtle" color="gray" onClick={() => refetch()} radius="md">
                  <IconRefresh size={18} />
                </ActionIcon>
              </Tooltip>
            </Group>
          </Group>

          <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md" mb="lg">
            <Card radius="lg" p="lg" style={{ border: "1px solid #EDE7DD" }}>
              <Group justify="space-between" align="flex-start">
                <Box>
                  <Text size="xs" fw={700} tt="uppercase" c={MUTED_OLIVE}>
                    Shared Login
                  </Text>
                  <Text fw={600} c={CHARCOAL} mt={6}>
                    {accountData?.email || "Signed-in account"}
                  </Text>
                </Box>
                <IconUsers size={20} color={PRIMARY_BROWN} />
              </Group>
            </Card>

            <Card radius="lg" p="lg" style={{ border: "1px solid #EDE7DD" }}>
              <Text size="xs" fw={700} tt="uppercase" c={MUTED_OLIVE}>
                Total Profiles
              </Text>
              <Title order={3} c={CHARCOAL} mt={8}>
                {tableData.length}
              </Title>
            </Card>

            <Card radius="lg" p="lg" style={{ border: "1px solid #EDE7DD" }}>
              <Text size="xs" fw={700} tt="uppercase" c={MUTED_OLIVE}>
                Active Profiles
              </Text>
              <Title order={3} c={CHARCOAL} mt={8}>
                {tableData.filter((profile) => !profile.disabled).length}
              </Title>
            </Card>

            <Card radius="lg" p="lg" style={{ border: "1px solid #EDE7DD" }}>
              <Text size="xs" fw={700} tt="uppercase" c={MUTED_OLIVE}>
                Current Session
              </Text>
              <Text fw={600} c={CHARCOAL} mt={8}>
                {tableData.find((profile) => profile.isCurrent)?.name || "No profile selected"}
              </Text>
            </Card>
          </SimpleGrid>

          <Paper shadow="xs" p={{ base: "md", sm: "lg" }} mb="lg" radius="lg" bg="white" style={{ border: "1px solid #F0F0F0" }}>
            <Stack gap="md">
              <UserSearchFilter
                value={searchQuery}
                onChange={(event) => {
                  setSearchQuery(event.target.value);
                  setPage(1);
                }}
              />

              <ScrollArea type="scroll" scrollbarSize={0} offsetScrollbars={false}>
                <Tabs
                  value={activeTab}
                  onChange={(value) => {
                    setActiveTab(value || "all");
                    setPage(1);
                  }}
                  styles={{
                    tab: {
                      fontSize: "13px",
                      padding: "10px 14px",
                      whiteSpace: "nowrap",
                    },
                  }}
                >
                  <Tabs.List style={{ flexWrap: "nowrap" }}>
                    {tabDefs.map((tab) => (
                      <Tabs.Tab
                        key={tab.value}
                        value={tab.value}
                        style={{
                          color: activeTab === tab.value ? PRIMARY_BROWN : MUTED_OLIVE,
                          fontWeight: activeTab === tab.value ? 600 : 400,
                        }}
                      >
                        <Text component="span" hiddenFrom="sm">
                          {tab.shortLabel} ({tab.count})
                        </Text>
                        <Text component="span" visibleFrom="sm">
                          {tab.fullLabel} ({tab.count})
                        </Text>
                      </Tabs.Tab>
                    ))}
                  </Tabs.List>
                </Tabs>
              </ScrollArea>
            </Stack>
          </Paper>

          <Paper
            shadow="xs"
            radius="lg"
            visibleFrom="sm"
            style={{ backgroundColor: "white", border: "1px solid #E5E7EB", overflow: "hidden" }}
          >
            <Box style={{ overflowX: "auto" }}>
              <Table>
                <Table.Thead>
                  <Table.Tr style={{ backgroundColor: "#F9FAFB" }}>
                    {["Profile", "Assigned Role", "Status", "Start Date", "End Date", "Actions"].map((heading, index) => (
                      <Table.Th
                        key={heading}
                        style={{
                          color: MUTED_OLIVE,
                          fontWeight: 600,
                          fontSize: "11px",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                          padding: "12px 20px",
                          borderBottom: "1px solid #E5E7EB",
                          textAlign: index === 5 ? "right" : "left",
                        }}
                      >
                        {heading}
                      </Table.Th>
                    ))}
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>{rows}</Table.Tbody>
              </Table>
            </Box>
            {filteredData.length === 0 && (
              <Box ta="center" py={60} style={{ color: MUTED_OLIVE, fontSize: "14px" }}>
                No profiles match this view
              </Box>
            )}
          </Paper>

          <Paper
            shadow="xs"
            radius="lg"
            hiddenFrom="sm"
            style={{ backgroundColor: "white", border: "1px solid #E5E7EB", overflow: "hidden" }}
          >
            {paginatedData.length > 0 ? (
              <Stack gap={0}>
                {paginatedData.map((row, index) => (
                  <Box key={row.id}>
                    <ProfileCard
                      row={row}
                      onEdit={handleOpenEditModal}
                      onResetPin={handleConfirmResetPin}
                      onToggleStatus={handleToggleStatus}
                      onDelete={handleConfirmDelete}
                    />
                    {index < paginatedData.length - 1 && <Divider color="#F3F4F6" />}
                  </Box>
                ))}
              </Stack>
            ) : (
              <Box ta="center" py={60} style={{ color: MUTED_OLIVE, fontSize: "14px" }}>
                No profiles match this view
              </Box>
            )}
          </Paper>

          <Paper
            shadow="xs"
            p={{ base: "md", sm: "sm" }}
            px={{ base: "md", sm: "lg" }}
            mt="lg"
            radius="lg"
            bg="white"
            style={{ border: "1px solid #F0F0F0" }}
          >
            <Stack gap="xs">
              <Group justify="space-between" align="center" wrap="wrap" gap="sm">
                <Text size="sm" c={MUTED_OLIVE}>
                  Showing{" "}
                  {filteredData.length === 0 ? 0 : Math.min((safePage - 1) * perPage + 1, filteredData.length)}
                  –{Math.min(safePage * perPage, filteredData.length)} of {filteredData.length} profiles
                </Text>
                <Select
                  size="xs"
                  radius="md"
                  value={rowsPerPage}
                  onChange={(value) => {
                    setRowsPerPage(value || "10");
                    setPage(1);
                  }}
                  data={[
                    { value: "10", label: "10 / page" },
                    { value: "25", label: "25 / page" },
                    { value: "50", label: "50 / page" },
                  ]}
                  style={{ width: 110 }}
                  styles={{ input: { border: "1px solid #E5E7EB", fontSize: "12px" } }}
                  allowDeselect={false}
                />
              </Group>

              {totalPages > 1 && (
                <Group justify="flex-end">
                  <Pagination
                    total={totalPages}
                    value={safePage}
                    onChange={setPage}
                    size="sm"
                    radius="md"
                    color={PRIMARY_BROWN}
                    withEdges={false}
                  />
                </Group>
              )}
            </Stack>
          </Paper>
        </Container>
      </Box>
    </>
  );
}
