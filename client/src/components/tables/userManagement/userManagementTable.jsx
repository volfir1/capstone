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
} from "@mantine/core";
import {
  IconDots,
  IconUsers,
  IconUserPlus,
  IconShield,
  IconMail,
  IconLock,
  IconLockOpen,
  IconRefresh,
  IconCircleFilled,
} from "@tabler/icons-react";
import { useState } from "react";
import { useUsers } from "@/hooks/admin/users";
import { filterUsers } from "@/utils/userManagementUtils";
import { useSearch } from "@/utils/userManagementUtils";
import UserManagementSkeleton from "@/components/skeleton/UserManagementSkeleton";
import UserSearchFilter from "@/components/search/userSearch";
import {
  PRIMARY_GOLD,
  PRIMARY_BROWN,
  MUTED_OLIVE,
  BG,
  CHARCOAL,
  ACCENT_TAN,
} from "@/utils/constants";
import {
  updateUserRole,
  toggleUserStatus,
  sendPasswordReset,
} from "@/api/admin/userManagement";
import { notifications } from "@mantine/notifications";

// ── Shared helpers ──────────────────────────────────────────────────────────
const getRoleBadgeStyle = (role) => ({
  backgroundColor: role === "secretary" ? `${PRIMARY_BROWN}15` : `${MUTED_OLIVE}15`,
  color: role === "secretary" ? PRIMARY_BROWN : MUTED_OLIVE,
  fontWeight: 600,
  textTransform: "capitalize",
  border: `1px solid ${role === "secretary" ? `${PRIMARY_BROWN}30` : `${MUTED_OLIVE}30`}`,
});

const formatRole = (role) =>
  role === "supervising_lawyer" ? "Sup. Lawyer" : role;

// ── Mobile Card Row ─────────────────────────────────────────────────────────
function UserCard({ row, onOpenRoleModal, onSendPasswordReset, onToggleStatus }) {
  return (
    <Box
      px="md"
      py="sm"
      style={{
        backgroundColor: row.disabled ? "#FEF2F2" : "white",
        opacity: row.disabled ? 0.7 : 1,
      }}
    >
      {/* Top: name + email + action menu */}
      <Group justify="space-between" align="flex-start" wrap="nowrap" mb={8}>
        <Box style={{ minWidth: 0 }}>
          <Text fw={600} size="sm" c={CHARCOAL} truncate>{row.name}</Text>
          <Text size="xs" c={MUTED_OLIVE} truncate mt={2}>{row.email}</Text>
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
            <Menu.Label>User Actions</Menu.Label>
            <Menu.Item leftSection={<IconShield size={16} />} onClick={() => onOpenRoleModal(row)}>
              Change Role
            </Menu.Item>
            <Menu.Item leftSection={<IconMail size={16} />} onClick={() => onSendPasswordReset(row.email, row.name)}>
              Send Password Reset
            </Menu.Item>
            <Menu.Divider />
            <Menu.Item
              leftSection={row.disabled ? <IconLockOpen size={16} /> : <IconLock size={16} />}
              color={row.disabled ? "green" : "red"}
              onClick={() => onToggleStatus(row.id, row.name, row.disabled, row.role)}
            >
              {row.disabled ? "Enable Account" : "Disable Account"}
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </Group>

      {/* Bottom: role badge + status dot + joined date */}
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

        <Text size="xs" c={MUTED_OLIVE}>Joined {row.date}</Text>
      </Group>
    </Box>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────
export default function UserManagementTable() {
  const { users, isLoading, error, refetch } = useUsers();
  const { searchQuery, setSearchQuery } = useSearch();
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("user");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState("10");

  const [roleModalOpened, setRoleModalOpened] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null);

  const handleOpenRoleModal = (user) => {
    setSelectedUser(user);
    setSelectedRole(user.role);
    setRoleModalOpened(true);
  };

  const handleChangeRole = async () => {
    if (!selectedUser || !selectedRole) return;
    setActionLoading(true);
    try {
      await updateUserRole(selectedUser.id, selectedRole);
      notifications.show({ title: "Success", message: `User role updated to ${selectedRole}`, color: "green" });
      setRoleModalOpened(false);
      refetch();
    } catch (error) {
      notifications.show({ title: "Error", message: error.message || "Failed to update user role", color: "red" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendPasswordReset = async (email, name) => {
    try {
      await sendPasswordReset(email);
      notifications.show({ title: "Success", message: `Password reset email sent to ${name}`, color: "green" });
    } catch (error) {
      notifications.show({ title: "Error", message: error.message || "Failed to send password reset", color: "red" });
    }
  };

  const handleToggleStatus = async (userId, name, currentlyDisabled, userRole) => {
    const action = currentlyDisabled ? "enable" : "disable";
    try {
      await toggleUserStatus(userId, !currentlyDisabled);
      notifications.show({ title: "Success", message: `${name}'s account has been ${action}d`, color: "green" });
      // After disabling → switch to inactive tab
      // After enabling → switch back to the user's role tab
      setActiveTab(currentlyDisabled ? (userRole || "user") : "inactive");
      setPage(1);
      refetch();
    } catch (error) {
      notifications.show({ title: "Error", message: error.message || `Failed to ${action} account`, color: "red" });
    }
  };

  const tableData = users.map((user) => ({
    id: user._id,
    name: `${user.firstName} ${user.lastName}`,
    email: user.email,
    role: user.role,
    // Disabled flag is the single source of truth — isVerified does not gate role tabs
    status: user.disabled ? "Inactive" : "Active",
    disabled: user.disabled || false,
    date: new Date(user.createdAt).toLocaleDateString("en-US", {
      month: "numeric",
      day: "numeric",
      year: "numeric",
    }),
  }));

  const searchFiltered = tableData.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredData = searchFiltered.filter((item) => {
    if (activeTab === "inactive") return item.disabled === true;
    // Role tabs show only non-disabled users with matching role
    return item.role === activeTab && item.disabled === false;
  });

  const perPage = parseInt(rowsPerPage);
  const totalPages = Math.ceil(filteredData.length / perPage);
  const paginatedData = filteredData.slice((page - 1) * perPage, page * perPage);

  const handleDelete = (id) => {
    alert(`(Demo) Deleting user with ID: ${id}`);
  };

  if (isLoading) return <UserManagementSkeleton />;

  if (error) {
    return (
      <Box style={{ textAlign: "center", padding: "40px" }}>
        <Text c="red" fw={500}>Error: {error}</Text>
      </Box>
    );
  }

  // ── Desktop table rows ────────────────────────────────────────────────────
  const rows = paginatedData.map((row) => (
    <Table.Tr
      key={row.id}
      className="user-row"
      style={{
        backgroundColor: row.disabled ? "#FEF2F2" : "white",
        borderBottom: "1px solid #E5E7EB",
        opacity: row.disabled ? 0.7 : 1,
      }}
    >
      <Table.Td fw={500} style={{ color: CHARCOAL, fontSize: "14px", padding: "14px 20px" }}>
        {row.name}
      </Table.Td>
      <Table.Td style={{ color: MUTED_OLIVE, fontSize: "14px", padding: "14px 20px" }}>
        {row.email}
      </Table.Td>
      <Table.Td style={{ padding: "14px 20px" }}>
        <Badge size="sm" radius="sm" variant="light" style={getRoleBadgeStyle(row.role)}>
          {formatRole(row.role)}
        </Badge>
      </Table.Td>
      <Table.Td style={{ padding: "14px 20px" }}>
        <Group gap={6} wrap="nowrap">
          <IconCircleFilled size={8} style={{ color: row.status === "Active" ? "#22C55E" : "#9CA3AF" }} />
          <Text size="sm" fw={500} c={row.status === "Active" ? "#16A34A" : "#6B7280"}>
            {row.status}
          </Text>
        </Group>
      </Table.Td>
      <Table.Td style={{ color: MUTED_OLIVE, fontSize: "14px", padding: "14px 20px" }}>
        {row.date}
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
              <Menu.Label>User Actions</Menu.Label>
              <Menu.Item leftSection={<IconShield size={16} />} onClick={() => handleOpenRoleModal(row)}>
                Change Role
              </Menu.Item>
              <Menu.Item leftSection={<IconMail size={16} />} onClick={() => handleSendPasswordReset(row.email, row.name)}>
                Send Password Reset
              </Menu.Item>
              <Menu.Divider />
              <Menu.Item
                leftSection={row.disabled ? <IconLockOpen size={16} /> : <IconLock size={16} />}
                color={row.disabled ? "green" : "red"}
                onClick={() => handleToggleStatus(row.id, row.name, row.disabled, row.role)}
              >
                {row.disabled ? "Enable Account" : "Disable Account"}
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </Table.Td>
    </Table.Tr>
  ));

  // ── Tab definitions ───────────────────────────────────────────────────────
  const tabDefs = [
    { value: "user",               shortLabel: "Clients",  fullLabel: "Clients",          count: tableData.filter((u) => u.role === "user"               && !u.disabled).length },
    { value: "secretary",          shortLabel: "Sec.",     fullLabel: "Secretaries",       count: tableData.filter((u) => u.role === "secretary"          && !u.disabled).length },
    { value: "intern",             shortLabel: "Interns",  fullLabel: "Interns",           count: tableData.filter((u) => u.role === "intern"             && !u.disabled).length },
    { value: "director",           shortLabel: "Dir.",     fullLabel: "Directors",         count: tableData.filter((u) => u.role === "director"           && !u.disabled).length },
    { value: "supervising_lawyer", shortLabel: "Sup.",     fullLabel: "Sup. Lawyers",      count: tableData.filter((u) => u.role === "supervising_lawyer" && !u.disabled).length },
    { value: "inactive",           shortLabel: "Inactive", fullLabel: "Inactive",          count: tableData.filter((u) => u.disabled === true).length },
  ];

  return (
    <>
      {/* ── Role Change Modal ── */}
      <Modal opened={roleModalOpened} onClose={() => setRoleModalOpened(false)} title="Change User Role" centered>
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            Change role for: <strong>{selectedUser?.name}</strong>
          </Text>
          <Select
            label="New Role"
            placeholder="Select role"
            data={[
              { value: "user", label: "User (Client)" },
              { value: "secretary", label: "Secretary" },
              { value: "intern", label: "Intern" },
              { value: "director", label: "Director" },
              { value: "supervising_lawyer", label: "Supervising Lawyer" },
            ]}
            value={selectedRole}
            onChange={setSelectedRole}
          />
          <Group justify="flex-end" mt="md">
            <Button variant="outline" onClick={() => setRoleModalOpened(false)} disabled={actionLoading}>
              Cancel
            </Button>
            <Button onClick={handleChangeRole} loading={actionLoading} style={{ backgroundColor: PRIMARY_BROWN }}>
              Update Role
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

        <Container size="xl" px={{ base: 'md', sm: 'xl' }}>

          {/* ── A. Page Header ── */}
          <Group justify="space-between" align="center" mb="lg">
            <Box>
              <Title order={3} c={CHARCOAL} lh={1.2}>Users Management</Title>
              <Text size="sm" c={MUTED_OLIVE} mt={2}>Manage and view all users in your system</Text>
            </Box>
            <Tooltip label="Refresh users">
              <ActionIcon size="md" variant="subtle" color="gray" onClick={() => refetch()} loading={isLoading} radius="md">
                <IconRefresh size={18} />
              </ActionIcon>
            </Tooltip>
          </Group>

          {/* ── B. Controls: Search + Tabs ── */}
          <Paper shadow="xs" p={{ base: 'md', sm: 'lg' }} mb="lg" radius="lg" bg="white" style={{ border: "1px solid #F0F0F0" }}>
            <Stack gap="md">
              {/* B1. Search — full width, no maxWidth cap */}
              <UserSearchFilter
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              />

              {/* B2. Tabs — scrollable on mobile, no wrap */}
              <ScrollArea type="scroll" scrollbarSize={0} offsetScrollbars={false}>
                <Tabs
                  value={activeTab}
                  onChange={(val) => { setActiveTab(val); setPage(1); }}
                  styles={{
                    tab: {
                      fontSize: "13px",
                      padding: "10px 14px",
                      whiteSpace: "nowrap",
                    },
                  }}
                >
                  <Tabs.List style={{ flexWrap: "nowrap" }}>
                    {tabDefs.map((t) => (
                      <Tabs.Tab
                        key={t.value}
                        value={t.value}
                        style={{
                          color: activeTab === t.value ? PRIMARY_BROWN : MUTED_OLIVE,
                          fontWeight: activeTab === t.value ? 600 : 400,
                        }}
                      >
                        {/* Short label on mobile, full label on sm+ */}
                        <Text component="span" hiddenFrom="sm">{t.shortLabel} ({t.count})</Text>
                        <Text component="span" visibleFrom="sm">{t.fullLabel} ({t.count})</Text>
                      </Tabs.Tab>
                    ))}
                  </Tabs.List>
                </Tabs>
              </ScrollArea>
            </Stack>
          </Paper>

          {/* ── C. Table (desktop) / Cards (mobile) ── */}

          {/* DESKTOP: full table, sm and above */}
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
                    {["Name", "Email", "Role", "Status", "Date Joined", "Actions"].map((h, i) => (
                      <Table.Th
                        key={h}
                        style={{
                          color: MUTED_OLIVE,
                          fontWeight: 600,
                          fontSize: "11px",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                          padding: "12px 20px",
                          borderBottom: "1px solid #E5E7EB",
                          textAlign: i === 5 ? "right" : "left",
                        }}
                      >
                        {h}
                      </Table.Th>
                    ))}
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>{rows}</Table.Tbody>
              </Table>
            </Box>
            {filteredData.length === 0 && !isLoading && (
              <Box ta="center" py={60} style={{ color: MUTED_OLIVE, fontSize: "14px" }}>
                No users found
              </Box>
            )}
          </Paper>

          {/* MOBILE: card list, below sm */}
          <Paper
            shadow="xs"
            radius="lg"
            hiddenFrom="sm"
            style={{ backgroundColor: "white", border: "1px solid #E5E7EB", overflow: "hidden" }}
          >
            {paginatedData.length > 0 ? (
              <Stack gap={0}>
                {paginatedData.map((row, idx) => (
                  <Box key={row.id}>
                    <UserCard
                      row={row}
                      onOpenRoleModal={handleOpenRoleModal}
                      onSendPasswordReset={handleSendPasswordReset}
                      onToggleStatus={handleToggleStatus}
                    />
                    {idx < paginatedData.length - 1 && <Divider color="#F3F4F6" />}
                  </Box>
                ))}
              </Stack>
            ) : (
              <Box ta="center" py={60} style={{ color: MUTED_OLIVE, fontSize: "14px" }}>
                No users found
              </Box>
            )}
          </Paper>

          {/* ── D. Footer / Pagination ── */}
          <Paper
            shadow="xs"
            p={{ base: 'md', sm: 'sm' }}
            px={{ base: 'md', sm: 'lg' }}
            mt="lg"
            radius="lg"
            bg="white"
            style={{ border: "1px solid #F0F0F0" }}
          >
            <Stack gap="xs">
              {/* Count + rows-per-page: side by side, wraps if needed */}
              <Group justify="space-between" align="center" wrap="wrap" gap="sm">
                <Text size="sm" c={MUTED_OLIVE}>
                  Showing{" "}
                  {filteredData.length === 0
                    ? 0
                    : Math.min((page - 1) * perPage + 1, filteredData.length)}
                  –{Math.min(page * perPage, filteredData.length)} of {filteredData.length} users
                </Text>
                <Select
                  size="xs"
                  radius="md"
                  value={rowsPerPage}
                  onChange={(val) => { setRowsPerPage(val || "10"); setPage(1); }}
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

              {/* Pagination: centered on mobile, right-aligned on desktop */}
              {totalPages > 1 && (
                <Group justify={{ base: "center", sm: "flex-end" }}>
                  <Pagination
                    total={totalPages}
                    value={page}
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