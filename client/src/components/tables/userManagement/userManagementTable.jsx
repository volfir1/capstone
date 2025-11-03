import {
  Table,
  Paper,
  Group,
  Select,
  Button,
  Stack,
  Text,
  Box,
  Badge,
  ActionIcon,
  Tooltip,
} from "@mantine/core";
import {
  IconEdit,
  IconTrash,
  IconPlus,
} from "@tabler/icons-react";
import { useState } from "react";
import { useUsers } from "@/hooks/admin/users";
import { filterUsers, getStatusColor } from "@/utils/userManagementUtils";
import { useSearch } from "@/utils/userManagementUtils";
import { Loaders } from "@/components/ui/Loader";
import  UserSearchFilter  from "@/components/search/userSearch";

export default function UserManagementTable() {
  const { users, isLoading, error, refetch } = useUsers();
  const { searchQuery, setSearchQuery } = useSearch();
  const [statusFilter, setStatusFilter] = useState(null);

  const tableData = users.map((user) => ({
    id: user._id,
    name: `${user.firstName} ${user.lastName}`,
    email: user.email,
    role: user.role,
    status: user.isVerified ? "Active" : "Inactive",
    date: new Date(user.createdAt).toLocaleDateString("en-PH"),
  }));

  const filteredData = filterUsers(tableData, searchQuery, statusFilter);

  const handleDelete = (id) => {
    alert(`(Demo) Deleting user with ID: ${id}`);
  };

  if (isLoading) {
    return <Loaders />;
  }

  if (error) {
    return (
      <Box style={{ textAlign: 'center', padding: '40px' }}>
        <Text c="red" fw={500}>Error: {error}</Text>
        <Button onClick={refetch} mt="md" variant="default">
          Try Again
        </Button>
      </Box>
    );
  }

  const rows = filteredData.map((row) => (
  <Table.Tr key={row.id}>
    <Table.Td fw={500}>{row.name}</Table.Td>
    <Table.Td c="dimmed">{row.email}</Table.Td>
    <Table.Td>
      <Badge
        variant="light"
        color={row.role === 'admin' ? 'blue' : 'gray'}
        size="sm"
      >
        {row.role}
      </Badge>
    </Table.Td>
    <Table.Td>
      <Badge
        variant="light"
        color={getStatusColor(row.status)}
        size="sm"
      >
        {row.status}
      </Badge>
    </Table.Td>
    <Table.Td c="dimmed">{row.date}</Table.Td>
    <Table.Td>
      <Group gap={4} justify="flex-end">
        <Tooltip label="Edit user">
          <ActionIcon variant="subtle" color="blue" size="sm">
            <IconEdit size={16} />
          </ActionIcon>
        </Tooltip>
        <Tooltip label="Delete user">
          <ActionIcon 
            variant="subtle" 
            color="red" 
            size="sm"
            onClick={() => handleDelete(row.id)}
          >
            <IconTrash size={16} />
          </ActionIcon>
        </Tooltip>
      </Group>
    </Table.Td>
  </Table.Tr>
));

  return (
    <Stack gap="lg">
      <Group justify="space-between">
        {/* 2. The old TextInput is replaced with your reusable UserSearch component */}
        <UserSearchFilter
          value={searchQuery} 
          onChange={(e) => setSearchQuery(e.target.value)} 
        />
        
        <Group gap="md">
          <Select
            placeholder="Filter by status"
            data={["Active", "Inactive"]}
            value={statusFilter}
            onChange={setStatusFilter}
            clearable
            w={180}
            radius="md"
            size="sm"
          />
         
        </Group>
      </Group>

      <Paper
        radius="md"
        p="md"
        style={{ backgroundColor: "white", border: "1px solid #E0E0E0" }}
      >
        <Table striped highlightOnHover>
          <Table.Thead style={{ backgroundColor: "#F5F5F5" }}>
            <Table.Tr>
              <Table.Th fw={600} c="#666">Name</Table.Th>
              <Table.Th fw={600} c="#666">Email</Table.Th>
              <Table.Th fw={600} c="#666">Role</Table.Th>
              <Table.Th fw={600} c="#666">Status</Table.Th>
              <Table.Th fw={600} c="#666">Date Joined</Table.Th>
              <Table.Th fw={600} c="#666" ta="right">Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>{rows}</Table.Tbody>
        </Table>
        {filteredData.length === 0 && !isLoading && (
          <Box ta="center" py="xl" c="dimmed">
            No users found
          </Box>
        )}
      </Paper>

      <Group justify="space-between" c="dimmed" size="sm">
        <Box>
          Showing {filteredData.length} of {tableData.length} users
        </Box>
        <Box>
          JustReach © 2024
        </Box>
      </Group>
    </Stack>
  );
}