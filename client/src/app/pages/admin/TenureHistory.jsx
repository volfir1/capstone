import { useEffect, useMemo, useState } from "react";
import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Container,
  Group,
  Paper,
  ScrollArea,
  Stack,
  Table,
  Tabs,
  Text,
  Title,
  Tooltip,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  IconCalendarEvent,
  IconRefresh,
  IconRestore,
  IconUserCheck,
  IconUserCircle,
  IconUserMinus,
} from "@tabler/icons-react";

import { fetchProfileHistory, restoreManagedProfile } from "@/api/admin/userManagement";
import { useAuth } from "@/context/authContext";
import { BG, CHARCOAL, MUTED_OLIVE, PRIMARY_BROWN } from "@/utils/constants";

const ROLE_OPTIONS = [
  { value: "secretary", label: "Secretaries" },
  { value: "intern", label: "Interns" },
  { value: "supervising_lawyer", label: "Supervising Lawyers" },
  { value: "director", label: "Directors" },
];

const VIEW_OPTIONS = [
  { value: "current", label: "Current Tenure" },
  { value: "legacy", label: "Legacy Accounts" },
];

const ROLE_LABELS = {
  secretary: "Secretary",
  intern: "Legal Intern",
  supervising_lawyer: "Supervising Lawyer",
  director: "Director",
};

const PROFILE_MANAGER_ROLES = new Set(["secretary", "director"]);

const formatDate = (value, fallback = "Not set") => {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const getStatus = (profile) => {
  if (profile.archivedAt) return "Legacy";
  if (profile.disabled) return "Disabled";
  return "Active";
};

const getStatusColor = (status) => {
  if (status === "Active") return "green";
  if (status === "Legacy") return "gray";
  return "yellow";
};

export default function TenureHistory() {
  const { userData, activeProfileId, refreshProfiles } = useAuth();
  const [profiles, setProfiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeRole, setActiveRole] = useState(userData?.role || "intern");
  const [activeView, setActiveView] = useState("current");
  const [restoringId, setRestoringId] = useState("");

  const canManageProfiles = PROFILE_MANAGER_ROLES.has(userData?.role);
  const visibleRoleOptions = useMemo(
    () =>
      canManageProfiles
        ? ROLE_OPTIONS
        : ROLE_OPTIONS.filter((role) => role.value === userData?.role),
    [canManageProfiles, userData?.role]
  );

  const loadHistory = async () => {
    setIsLoading(true);
    setError("");
    try {
      const data = await fetchProfileHistory();
      setProfiles(Array.isArray(data) ? data : []);
    } catch (historyError) {
      setError(historyError.message || "Failed to load tenure history.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    if (userData?.role && ROLE_OPTIONS.some((role) => role.value === userData.role)) {
      setActiveRole(userData.role);
    }
  }, [userData?.role]);

  const profilesByRole = useMemo(() => {
    const buckets = Object.fromEntries(ROLE_OPTIONS.map((role) => [role.value, []]));

    profiles.forEach((profile) => {
      if (buckets[profile.role]) {
        buckets[profile.role].push(profile);
      }
    });

    Object.values(buckets).forEach((bucket) => {
      bucket.sort((left, right) => {
        const leftStatus = getStatus(left) === "Legacy" ? 1 : 0;
        const rightStatus = getStatus(right) === "Legacy" ? 1 : 0;
        if (leftStatus !== rightStatus) return leftStatus - rightStatus;
        return `${left.firstName} ${left.lastName}`.localeCompare(`${right.firstName} ${right.lastName}`);
      });
    });

    return buckets;
  }, [profiles]);

  const safeActiveRole = visibleRoleOptions.some((role) => role.value === activeRole)
    ? activeRole
    : visibleRoleOptions[0]?.value || userData?.role || "intern";
  const currentProfile = useMemo(() => {
    const matchedProfile = profiles.find((profile) => profile.id === activeProfileId || profile.id === userData?.id);
    return matchedProfile || userData || null;
  }, [activeProfileId, profiles, userData]);
  const currentProfileId = currentProfile?.id || activeProfileId || userData?.id || "";

  const visibleProfilesByRole = useMemo(() => {
    const buckets = Object.fromEntries(ROLE_OPTIONS.map((role) => [role.value, []]));

    Object.entries(profilesByRole).forEach(([role, roleProfiles]) => {
      buckets[role] = roleProfiles.filter((profile) => {
        const status = getStatus(profile);
        return status === "Legacy" || profile.id === currentProfileId;
      });
    });

    return buckets;
  }, [profilesByRole, currentProfileId]);

  const roleProfilesForActiveRole = visibleProfilesByRole[safeActiveRole] || [];
  const currentCount = roleProfilesForActiveRole.filter((profile) => profile.id === currentProfileId).length;
  const legacyCount = roleProfilesForActiveRole.filter((profile) => getStatus(profile) === "Legacy").length;
  const selectedProfiles = useMemo(() => {
    if (activeView === "legacy") {
      return roleProfilesForActiveRole.filter((profile) => getStatus(profile) === "Legacy");
    }

    return roleProfilesForActiveRole.filter((profile) => profile.id === currentProfileId);
  }, [activeView, roleProfilesForActiveRole, currentProfileId]);
  const currentProfileStatus = currentProfile ? getStatus(currentProfile) : "Active";
  const currentProfileName =
    `${currentProfile?.firstName || ""} ${currentProfile?.lastName || ""}`.trim() ||
    "Current profile";

  const handleRestore = async (profile) => {
    setRestoringId(profile.id);
    try {
      await restoreManagedProfile(profile.id);
      notifications.show({
        title: "Profile restored",
        message: `${profile.firstName} ${profile.lastName} is active again.`,
        color: "green",
      });
      await Promise.all([loadHistory(), refreshProfiles()]);
    } catch (restoreError) {
      notifications.show({
        title: "Restore failed",
        message: restoreError.message || "We couldn't restore this profile.",
        color: "red",
      });
    } finally {
      setRestoringId("");
    }
  };

  return (
    <Box bg={BG} mih="100vh" py="xl">
      <Container size="xl" px={{ base: "md", sm: "xl" }}>
        <Group justify="space-between" align="center" mb="lg" wrap="wrap">
          <Box>
            <Title order={3} c={CHARCOAL} lh={1.2}>
              Tenure History
            </Title>
            <Text size="sm" c={MUTED_OLIVE} mt={2}>
              Review current tenure and legacy staff profiles by role.
            </Text>
          </Box>

          <Tooltip label="Refresh history">
            <ActionIcon size="md" variant="subtle" color="gray" onClick={loadHistory} radius="md">
              <IconRefresh size={18} />
            </ActionIcon>
          </Tooltip>
        </Group>

        <Paper
          shadow="xs"
          p={{ base: "md", sm: "lg" }}
          mb="lg"
          radius="lg"
          bg="white"
          style={{
            border: `1px solid ${PRIMARY_BROWN}30`,
            backgroundColor: "#FFF8EE",
          }}
        >
          <Group justify="space-between" align="flex-start" wrap="wrap" gap="lg">
            <Group gap="md" align="flex-start" wrap="nowrap">
              <Box
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: 12,
                  display: "grid",
                  placeItems: "center",
                  backgroundColor: `${PRIMARY_BROWN}14`,
                  color: PRIMARY_BROWN,
                  flexShrink: 0,
                }}
              >
                <IconUserCircle size={26} stroke={1.8} />
              </Box>

              <Stack gap={6}>
                <Group gap="xs" wrap="wrap">
                  <Text size="xs" fw={700} tt="uppercase" c={MUTED_OLIVE}>
                    Your Active Tenure
                  </Text>
                  <Badge color={getStatusColor(currentProfileStatus)} variant="light" radius="xl">
                    {currentProfileStatus}
                  </Badge>
                </Group>
                <Title order={4} c={CHARCOAL} lh={1.2}>
                  {currentProfileName}
                </Title>
                <Text size="sm" c={MUTED_OLIVE}>
                  {ROLE_LABELS[currentProfile?.role] || "Profile"}
                </Text>
              </Stack>
            </Group>

            <Group gap="lg" wrap="wrap">
              <Stack gap={4}>
                <Group gap={6} c={MUTED_OLIVE}>
                  <IconCalendarEvent size={15} />
                  <Text size="xs" fw={700} tt="uppercase">
                    Start Date
                  </Text>
                </Group>
                <Text fw={700} c={CHARCOAL}>
                  {formatDate(currentProfile?.startDate)}
                </Text>
              </Stack>

              <Stack gap={4}>
                <Group gap={6} c={MUTED_OLIVE}>
                  <IconCalendarEvent size={15} />
                  <Text size="xs" fw={700} tt="uppercase">
                    End Date
                  </Text>
                </Group>
                <Text fw={700} c={CHARCOAL}>
                  {formatDate(currentProfile?.endDate, currentProfileStatus === "Legacy" ? "Missing" : "Present")}
                </Text>
              </Stack>
            </Group>
          </Group>
        </Paper>

        <Paper shadow="xs" p={{ base: "md", sm: "lg" }} mb="lg" radius="lg" bg="white" style={{ border: "1px solid #F0F0F0" }}>
          <Stack gap="md">
            <ScrollArea type="scroll" scrollbarSize={0} offsetScrollbars={false}>
              <Tabs
                value={safeActiveRole}
                onChange={(value) => setActiveRole(value || safeActiveRole)}
                styles={{ tab: { fontSize: "13px", padding: "10px 14px", whiteSpace: "nowrap" } }}
              >
                <Tabs.List style={{ flexWrap: "nowrap" }}>
                  {visibleRoleOptions.map((role) => (
                    <Tabs.Tab
                      key={role.value}
                      value={role.value}
                      style={{
                        color: safeActiveRole === role.value ? PRIMARY_BROWN : MUTED_OLIVE,
                        fontWeight: safeActiveRole === role.value ? 600 : 400,
                      }}
                    >
                      {role.label} ({visibleProfilesByRole[role.value]?.length || 0})
                    </Tabs.Tab>
                  ))}
                </Tabs.List>
              </Tabs>
            </ScrollArea>

            <ScrollArea type="scroll" scrollbarSize={0} offsetScrollbars={false}>
              <Tabs
                value={activeView}
                onChange={(value) => setActiveView(value || "current")}
                styles={{ tab: { fontSize: "13px", padding: "10px 14px", whiteSpace: "nowrap" } }}
              >
                <Tabs.List style={{ flexWrap: "nowrap" }}>
                  {VIEW_OPTIONS.map((view) => (
                    <Tabs.Tab
                      key={view.value}
                      value={view.value}
                      style={{
                        color: activeView === view.value ? PRIMARY_BROWN : MUTED_OLIVE,
                        fontWeight: activeView === view.value ? 600 : 400,
                      }}
                    >
                      {view.label} ({view.value === "current" ? currentCount : legacyCount})
                    </Tabs.Tab>
                  ))}
                </Tabs.List>
              </Tabs>
            </ScrollArea>

            <Group gap="sm" wrap="wrap">
              <Badge leftSection={<IconUserCheck size={13} />} color="green" variant="light">
                Current {currentCount}
              </Badge>
              <Badge leftSection={<IconUserMinus size={13} />} color="gray" variant="light">
                Legacy {legacyCount}
              </Badge>
            </Group>
          </Stack>
        </Paper>

        <Paper shadow="xs" radius="lg" style={{ backgroundColor: "white", border: "1px solid #E5E7EB", overflow: "hidden" }}>
          <Box style={{ overflowX: "auto" }}>
            <Table>
              <Table.Thead>
                <Table.Tr style={{ backgroundColor: "#F9FAFB" }}>
                  {["Profile", "Role", "Status", "Start Date", "End Date", "Actions"].map((heading, index) => (
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
              <Table.Tbody>
                {selectedProfiles.map((profile) => {
                  const status = getStatus(profile);
                  const fullName = `${profile.firstName} ${profile.lastName}`.trim();

                  return (
                    <Table.Tr key={profile.id} style={{ borderBottom: "1px solid #E5E7EB" }}>
                      <Table.Td style={{ padding: "14px 20px" }}>
                        <Stack gap={4}>
                          <Text fw={600} size="sm" c={CHARCOAL}>
                            {fullName || "Unnamed profile"}
                          </Text>
                          <Text size="xs" c={MUTED_OLIVE}>
                            {profile.email}
                          </Text>
                        </Stack>
                      </Table.Td>
                      <Table.Td style={{ padding: "14px 20px" }}>
                        <Text size="sm" c={CHARCOAL}>
                          {ROLE_LABELS[profile.role] || "Profile"}
                        </Text>
                      </Table.Td>
                      <Table.Td style={{ padding: "14px 20px" }}>
                        <Badge color={getStatusColor(status)} variant="light" radius="xl">
                          {status}
                        </Badge>
                      </Table.Td>
                      <Table.Td style={{ color: MUTED_OLIVE, fontSize: "14px", padding: "14px 20px" }}>
                        {formatDate(profile.startDate)}
                      </Table.Td>
                      <Table.Td style={{ color: MUTED_OLIVE, fontSize: "14px", padding: "14px 20px" }}>
                        {formatDate(profile.endDate, status === "Legacy" ? "Missing" : "Present")}
                      </Table.Td>
                      <Table.Td style={{ padding: "14px 20px", textAlign: "right" }}>
                        {canManageProfiles && status === "Legacy" ? (
                          <Button
                            size="xs"
                            variant="light"
                            leftSection={<IconRestore size={14} />}
                            loading={restoringId === profile.id}
                            onClick={() => handleRestore(profile)}
                          >
                            Restore
                          </Button>
                        ) : (
                          <Text size="xs" c={MUTED_OLIVE}>
                            -
                          </Text>
                        )}
                      </Table.Td>
                    </Table.Tr>
                  );
                })}
              </Table.Tbody>
            </Table>
          </Box>

          {isLoading && (
            <Box ta="center" py={60} style={{ color: MUTED_OLIVE, fontSize: "14px" }}>
              Loading tenure records...
            </Box>
          )}

          {!isLoading && !error && selectedProfiles.length === 0 && activeView === "current" && (
            <Box ta="center" py={60} style={{ color: MUTED_OLIVE, fontSize: "14px" }}>
              No current tenure record for this role yet
            </Box>
          )}

          {!isLoading && !error && selectedProfiles.length === 0 && activeView === "legacy" && (
            <Box ta="center" py={60} style={{ color: MUTED_OLIVE, fontSize: "14px" }}>
              No legacy profiles for this role yet
            </Box>
          )}

          {error && (
            <Box ta="center" py={60}>
              <Text c="red" fw={500}>
                {error}
              </Text>
            </Box>
          )}
        </Paper>
      </Container>
    </Box>
  );
}
