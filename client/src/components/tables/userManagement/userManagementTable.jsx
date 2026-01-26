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
} from "@mantine/core";
import {
  IconDots,
  IconUsers,
  IconShield,
  IconMail,
  IconLock,
  IconLockOpen,
  IconRefresh,
} from "@tabler/icons-react";
import { useState } from "react";
import { useUsers } from "@/hooks/admin/users";
import { filterUsers } from "@/utils/userManagementUtils";
import { useSearch } from "@/utils/userManagementUtils";
import { Loaders } from "@/components/ui/Loader";
import UserSearchFilter from "@/components/search/userSearch";
import {
  PRIMARY_GOLD,
  PRIMARY_BROWN,
  MUTED_OLIVE,
  THEMED_LIGHT_BG,
  CHARCOAL,
  ACCENT_TAN,
} from "@/utils/constants";
import {
  updateUserRole,
  toggleUserStatus,
  sendPasswordReset,
} from "@/api/admin/userManagement";
import { notifications } from "@mantine/notifications";

export default function UserManagementTable() {
  const { users, isLoading, error, refetch } = useUsers();
  const { searchQuery, setSearchQuery } = useSearch();
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("user");

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
      notifications.show({
        title: "Success",
        message: `User role updated to ${selectedRole}`,
        color: "green",
      });
      setRoleModalOpened(false);
      refetch();
    } catch (error) {
      notifications.show({
        title: "Error",
        message: error.message || "Failed to update user role",
        color: "red",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendPasswordReset = async (email, name) => {
    try {
      await sendPasswordReset(email);
      notifications.show({
        title: "Success",
        message: `Password reset email sent to ${name}`,
        color: "green",
      });
    } catch (error) {
      notifications.show({
        title: "Error",
        message: error.message || "Failed to send password reset",
        color: "red",
      });
    }
  };

  const handleToggleStatus = async (userId, name, currentlyDisabled) => {
    const action = currentlyDisabled ? "enable" : "disable";
    try {
      await toggleUserStatus(userId, !currentlyDisabled);
      notifications.show({
        title: "Success",
        message: `${name}'s account has been ${action}d`,
        color: "green",
      });
      refetch();
    } catch (error) {
      notifications.show({
        title: "Error",
        message: error.message || `Failed to ${action} account`,
        color: "red",
      });
    }
  };

  const [roleModalOpened, setRoleModalOpened] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null);

  const tableData = users.map((user) => ({
    id: user._id,
    name: `${user.firstName} ${user.lastName}`,
    email: user.email,
    role: user.role,
    status:
      user.disabled || false
        ? "Inactive"
        : user.isVerified
          ? "Active"
          : "Inactive",
    disabled: user.disabled || false,
    date: new Date(user.createdAt).toLocaleDateString("en-US", {
      month: "numeric",
      day: "numeric",
      year: "numeric",
    }),
  }));

  // Filter by search query
  const searchFiltered = tableData.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter by role tab or inactive tab
  const filteredData = searchFiltered.filter((item) => {
    if (activeTab === "inactive") {
      return item.status === "Inactive";
    }
    return item.role === activeTab;
  });

  const handleDelete = (id) => {
    alert(`(Demo) Deleting user with ID: ${id}`);
  };

  if (isLoading) {
    return <Loaders />;
  }

  if (error) {
    return (
      <Box style={{ textAlign: "center", padding: "40px" }}>
        <Text c="red" fw={500}>
          Error: {error}
        </Text>
      </Box>
    );
  }

  const rows = filteredData.map((row) => (
    <Table.Tr
      key={row.id}
      style={{
        backgroundColor: row.disabled ? "#FEE2E2" : "white",
        borderBottom: "1px solid #F0F0F0",
        opacity: row.disabled ? 0.6 : 1,
      }}
    >
      <Table.Td
        fw={500}
        style={{
          color: CHARCOAL,
          fontSize: "14px",
          padding: "16px 20px",
        }}
      >
        {row.name}
      </Table.Td>
      <Table.Td
        style={{
          color: MUTED_OLIVE,
          fontSize: "14px",
          padding: "16px 20px",
        }}
      >
        {row.email}
      </Table.Td>
      <Table.Td style={{ padding: "16px 20px" }}>
        <Badge
          size="sm"
          radius="sm"
          style={{
            backgroundColor:
              row.role === "secretary" ? PRIMARY_BROWN : MUTED_OLIVE,
            color: "white",
            fontWeight: 600,
            textTransform: "capitalize",
          }}
        >
          {row.role}
        </Badge>
      </Table.Td>
      <Table.Td style={{ padding: "16px 20px" }}>
        <Badge
          size="sm"
          radius="sm"
          style={{
            backgroundColor:
              row.status === "Active" ? PRIMARY_GOLD : ACCENT_TAN,
            color: "white",
            fontWeight: 600,
          }}
        >
          {row.status}
        </Badge>
      </Table.Td>
      <Table.Td
        style={{
          color: MUTED_OLIVE,
          fontSize: "14px",
          padding: "16px 20px",
        }}
      >
        {row.date}
      </Table.Td>
      <Table.Td style={{ padding: "16px 20px" }}>
        <Group gap={8} justify="flex-end">
          <Menu shadow="md" width={220} position="bottom-end">
            <Menu.Target>
              <ActionIcon
                variant="subtle"
                size="lg"
                radius="md"
                color={PRIMARY_BROWN}
              >
                <IconDots size={18} stroke={1.5} />
              </ActionIcon>
            </Menu.Target>

            <Menu.Dropdown>
              <Menu.Label>User Actions</Menu.Label>

              <Menu.Item
                leftSection={<IconShield size={16} />}
                onClick={() => handleOpenRoleModal(row)}
              >
                Change Role
              </Menu.Item>

              <Menu.Item
                leftSection={<IconMail size={16} />}
                onClick={() => handleSendPasswordReset(row.email, row.name)}
              >
                Send Password Reset
              </Menu.Item>

              <Menu.Divider />

              <Menu.Item
                leftSection={
                  row.disabled ? (
                    <IconLockOpen size={16} />
                  ) : (
                    <IconLock size={16} />
                  )
                }
                color={row.disabled ? "green" : "red"}
                onClick={() =>
                  handleToggleStatus(row.id, row.name, row.disabled)
                }
              >
                {row.disabled ? "Enable Account" : "Disable Account"}
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
        opened={roleModalOpened}
        onClose={() => setRoleModalOpened(false)}
        title="Change User Role"
        centered
      >
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
            <Button
              variant="outline"
              onClick={() => setRoleModalOpened(false)}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleChangeRole}
              loading={actionLoading}
              style={{ backgroundColor: PRIMARY_BROWN }}
            >
              Update Role
            </Button>
          </Group>
        </Stack>
      </Modal>

      <Box bg={THEMED_LIGHT_BG} mih="100vh" py="xl">
        <style>
          {`
          ::-webkit-scrollbar {
            width: 8px;
          }
          ::-webkit-scrollbar-track {
            background: transparent;
          }
          ::-webkit-scrollbar-thumb {
            background: ${MUTED_OLIVE};
            border-radius: 4px;
          }
          ::-webkit-scrollbar-thumb:hover {
            background: ${PRIMARY_BROWN};
          }
          * {
            scrollbar-width: thin;
            scrollbar-color: ${MUTED_OLIVE} transparent;
          }
        `}
        </style>
        <Container size="xl">
          {/* Header Section */}
          <Paper
            shadow="xs"
            p="xl"
            mb="xl"
            radius="lg"
            style={{
              background: PRIMARY_BROWN,
              border: "none",
            }}
          >
            <Group gap="md" align="center">
              <Box
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: "12px",
                  background: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <IconUsers size={24} color={PRIMARY_BROWN} stroke={2.5} />
              </Box>
              <Box>
                <Title order={2} c="white" mb={4}>
                  Users Management
                </Title>
                <Text c="rgba(255, 255, 255, 0.9)" size="sm" fw={500}>
                  Manage and view all users in your system
                </Text>
              </Box>
            </Group>
          </Paper>

          {/* Controls Section */}
          <Paper shadow="xs" p="lg" mb="lg" radius="lg" bg="white">
            <Stack gap="md">
              <Group justify="space-between">
                <Box style={{ maxWidth: "400px" }}>
                  <UserSearchFilter
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </Box>

                <Tooltip label="Refresh users">
                  <ActionIcon
                    size="lg"
                    radius="md"
                    variant="light"
                    color={PRIMARY_BROWN}
                    onClick={() => refetch()}
                    loading={isLoading}
                  >
                    <IconRefresh size={18} stroke={1.5} />
                  </ActionIcon>
                </Tooltip>
              </Group>

              <Tabs value={activeTab} onChange={setActiveTab}>
                <Tabs.List>
                  <Tabs.Tab
                    value="user"
                    style={{
                      color: activeTab === "user" ? PRIMARY_BROWN : MUTED_OLIVE,
                      fontWeight: activeTab === "user" ? 600 : 400,
                    }}
                  >
                    Clients ({tableData.filter((u) => u.role === "user").length}
                    )
                  </Tabs.Tab>
                  <Tabs.Tab
                    value="secretary"
                    style={{
                      color:
                        activeTab === "secretary" ? PRIMARY_BROWN : MUTED_OLIVE,
                      fontWeight: activeTab === "secretary" ? 600 : 400,
                    }}
                  >
                    Secretaries (
                    {tableData.filter((u) => u.role === "secretary").length})
                  </Tabs.Tab>
                  <Tabs.Tab
                    value="intern"
                    style={{
                      color:
                        activeTab === "intern" ? PRIMARY_BROWN : MUTED_OLIVE,
                      fontWeight: activeTab === "intern" ? 600 : 400,
                    }}
                  >
                    Interns (
                    {tableData.filter((u) => u.role === "intern").length})
                  </Tabs.Tab>
                  <Tabs.Tab
                    value="director"
                    style={{
                      color:
                        activeTab === "director" ? PRIMARY_BROWN : MUTED_OLIVE,
                      fontWeight: activeTab === "director" ? 600 : 400,
                    }}
                  >
                    Directors (
                    {tableData.filter((u) => u.role === "director").length})
                  </Tabs.Tab>
                  <Tabs.Tab
                    value="supervising_lawyer"
                    style={{
                      color:
                        activeTab === "supervising_lawyer" ? PRIMARY_BROWN : MUTED_OLIVE,
                      fontWeight: activeTab === "supervising_lawyer" ? 600 : 400,
                    }}
                  >
                    Supervising Lawyers (
                    {tableData.filter((u) => u.role === "supervising_lawyer").length})
                  </Tabs.Tab>
                  <Tabs.Tab
                    value="inactive"
                    style={{
                      color:
                        activeTab === "inactive" ? PRIMARY_BROWN : MUTED_OLIVE,
                      fontWeight: activeTab === "inactive" ? 600 : 400,
                    }}
                  >
                    Inactive (
                    {tableData.filter((u) => u.status === "Inactive").length})
                  </Tabs.Tab>
                </Tabs.List>
              </Tabs>
            </Stack>
          </Paper>

          {/* Table Section */}
          <Paper
            shadow="xs"
            radius="lg"
            style={{
              backgroundColor: "white",
              border: "1px solid #F0F0F0",
              overflow: "hidden",
            }}
          >
            <Box style={{ overflowX: "auto" }}>
              <Table>
                <Table.Thead>
                  <Table.Tr style={{ backgroundColor: THEMED_LIGHT_BG }}>
                    <Table.Th
                      style={{
                        color: CHARCOAL,
                        fontWeight: 600,
                        fontSize: "12px",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                        padding: "16px 20px",
                        borderBottom: "1px solid #F0F0F0",
                      }}
                    >
                      Name
                    </Table.Th>
                    <Table.Th
                      style={{
                        color: CHARCOAL,
                        fontWeight: 600,
                        fontSize: "12px",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                        padding: "16px 20px",
                        borderBottom: "1px solid #F0F0F0",
                      }}
                    >
                      Email
                    </Table.Th>
                    <Table.Th
                      style={{
                        color: CHARCOAL,
                        fontWeight: 600,
                        fontSize: "12px",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                        padding: "16px 20px",
                        borderBottom: "1px solid #F0F0F0",
                      }}
                    >
                      Role
                    </Table.Th>
                    <Table.Th
                      style={{
                        color: CHARCOAL,
                        fontWeight: 600,
                        fontSize: "12px",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                        padding: "16px 20px",
                        borderBottom: "1px solid #F0F0F0",
                      }}
                    >
                      Status
                    </Table.Th>
                    <Table.Th
                      style={{
                        color: CHARCOAL,
                        fontWeight: 600,
                        fontSize: "12px",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                        padding: "16px 20px",
                        borderBottom: "1px solid #F0F0F0",
                      }}
                    >
                      Date Joined
                    </Table.Th>
                    <Table.Th
                      style={{
                        color: CHARCOAL,
                        fontWeight: 600,
                        fontSize: "12px",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                        padding: "16px 20px",
                        textAlign: "right",
                        borderBottom: "1px solid #F0F0F0",
                      }}
                    >
                      Actions
                    </Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>{rows}</Table.Tbody>
              </Table>
            </Box>

            {filteredData.length === 0 && !isLoading && (
              <Box
                ta="center"
                py={60}
                style={{
                  color: MUTED_OLIVE,
                  fontSize: "14px",
                }}
              >
                No users found
              </Box>
            )}
          </Paper>

          {/* Footer Section */}
          <Paper shadow="xs" p="md" mt="lg" radius="lg" bg="white">
            <Group justify="space-between">
              <Text size="sm" c={MUTED_OLIVE}>
                Showing {filteredData.length} of {tableData.length} users
              </Text>
              <Text size="sm" c={MUTED_OLIVE}>
                JustReach © 2024
              </Text>
            </Group>
          </Paper>
        </Container>
      </Box>
    </>
  );
}
