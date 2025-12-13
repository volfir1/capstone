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
} from "@mantine/core";
import {
  IconEdit,
  IconTrash,
} from "@tabler/icons-react";
import { useState } from "react";
import { useUsers } from "@/hooks/admin/users";
import { filterUsers, getStatusColor } from "@/utils/userManagementUtils";
import { useSearch } from "@/utils/userManagementUtils";
import { Loaders } from "@/components/ui/Loader";
import UserSearchFilter from "@/components/search/userSearch";
import { PRIMARY_GOLD, PRIMARY_BROWN, MUTED_OLIVE, THEMED_LIGHT_BG, CHARCOAL, ACCENT_TAN } from '@/utils/constants';

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
    date: new Date(user.createdAt).toLocaleDateString("en-US", {
      month: "numeric",
      day: "numeric",
      year: "numeric"
    }),
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
      </Box>
    );
  }

  const rows = filteredData.map((row) => (
    <Table.Tr 
      key={row.id}
      style={{
        backgroundColor: 'white',
        transition: 'background-color 0.15s ease'
      }}
    >
      <Table.Td 
        fw={500} 
        style={{ 
          color: CHARCOAL,
          fontSize: '14px',
          padding: '16px 20px'
        }}
      >
        {row.name}
      </Table.Td>
      <Table.Td 
        style={{ 
          color: MUTED_OLIVE,
          fontSize: '14px',
          padding: '16px 20px'
        }}
      >
        {row.email}
      </Table.Td>
      <Table.Td style={{ padding: '16px 20px' }}>
        <Badge
          size="md"
          radius="sm"
          variant="light"
          style={{
            backgroundColor: row.role === 'admin' ? '#8B451315' : '#6B6B5A15',
            color: row.role === 'admin' ? PRIMARY_BROWN : MUTED_OLIVE,
            fontWeight: 600,
            fontSize: '11px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            padding: '6px 12px',
            height: 'auto'
          }}
        >
          {row.role}
        </Badge>
      </Table.Td>
      <Table.Td style={{ padding: '16px 20px' }}>
        <Badge
          size="md"
          radius="sm"
          variant="light"
          style={{
            backgroundColor: row.status === 'Active' ? '#9333ea15' : '#6b728015',
            color: row.status === 'Active' ? '#9333ea' : '#6b7280',
            fontWeight: 600,
            fontSize: '11px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            padding: '6px 12px',
            height: 'auto'
          }}
        >
          {row.status}
        </Badge>
      </Table.Td>
      <Table.Td 
        style={{ 
          color: MUTED_OLIVE,
          fontSize: '14px',
          padding: '16px 20px'
        }}
      >
        {row.date}
      </Table.Td>
      <Table.Td style={{ padding: '16px 20px' }}>
        <Group gap={8} justify="flex-end">
          <Tooltip label="Edit user" withArrow position="top">
            <ActionIcon 
              variant="subtle" 
              size="lg"
              radius="md"
              style={{ 
                color: PRIMARY_GOLD,
                transition: 'all 0.2s ease'
              }}
            >
              <IconEdit size={18} stroke={1.5} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Delete user" withArrow position="top">
            <ActionIcon 
              variant="subtle" 
              size="lg"
              radius="md"
              style={{ 
                color: '#dc2626',
                transition: 'all 0.2s ease'
              }}
              onClick={() => handleDelete(row.id)}
            >
              <IconTrash size={18} stroke={1.5} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <Stack gap={0} style={{ minHeight: '100vh', backgroundColor: '#FAFAFA' }}>
      {/* Header Section */}
      <Box 
        style={{ 
          backgroundColor: 'white',
          borderBottom: `1px solid #E5E5E5`,
          padding: '32px 40px'
        }}
      >
        <Title 
          order={2} 
          style={{ 
            color: CHARCOAL,
            fontSize: '28px',
            fontWeight: 600,
            marginBottom: '8px'
          }}
        >
          Users Management
        </Title>
        <Text 
          size="sm" 
          style={{ 
            color: MUTED_OLIVE,
            fontSize: '14px'
          }}
        >
          Manage and view all users in your system
        </Text>
      </Box>

      {/* Controls Section */}
      <Box style={{ padding: '24px 40px' }}>
        <Group justify="space-between" align="center">
          <UserSearchFilter
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ maxWidth: '400px' }}
          />
          
          <Select
            placeholder="Filter by status"
            data={["Active", "Inactive"]}
            value={statusFilter}
            onChange={setStatusFilter}
            clearable
            size="md"
            radius="md"
            w={200}
            styles={{
              input: {
                borderColor: '#E5E5E5',
                fontSize: '14px',
                height: '40px',
                '&:focus': {
                  borderColor: PRIMARY_GOLD
                }
              }
            }}
          />
        </Group>
      </Box>

      {/* Table Section */}
      <Box style={{ padding: '0 40px 32px 40px' }}>
        <Paper
          radius="lg"
          style={{ 
            backgroundColor: 'white',
            border: '1px solid #E5E5E5',
            overflow: 'hidden',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)'
          }}
        >
          <Table 
            horizontalSpacing="xl" 
            verticalSpacing="md"
            style={{
              borderCollapse: 'separate',
              borderSpacing: 0
            }}
          >
            <Table.Thead>
              <Table.Tr style={{ backgroundColor: THEMED_LIGHT_BG }}>
                <Table.Th 
                  style={{ 
                    color: CHARCOAL,
                    fontWeight: 600,
                    fontSize: '12px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    padding: '16px 20px',
                    borderBottom: `2px solid ${MUTED_OLIVE}30`
                  }}
                >
                  Name
                </Table.Th>
                <Table.Th 
                  style={{ 
                    color: CHARCOAL,
                    fontWeight: 600,
                    fontSize: '12px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    padding: '16px 20px',
                    borderBottom: `2px solid ${MUTED_OLIVE}30`
                  }}
                >
                  Email
                </Table.Th>
                <Table.Th 
                  style={{ 
                    color: CHARCOAL,
                    fontWeight: 600,
                    fontSize: '12px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    padding: '16px 20px',
                    borderBottom: `2px solid ${MUTED_OLIVE}30`
                  }}
                >
                  Role
                </Table.Th>
                <Table.Th 
                  style={{ 
                    color: CHARCOAL,
                    fontWeight: 600,
                    fontSize: '12px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    padding: '16px 20px',
                    borderBottom: `2px solid ${MUTED_OLIVE}30`
                  }}
                >
                  Status
                </Table.Th>
                <Table.Th 
                  style={{ 
                    color: CHARCOAL,
                    fontWeight: 600,
                    fontSize: '12px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    padding: '16px 20px',
                    borderBottom: `2px solid ${MUTED_OLIVE}30`
                  }}
                >
                  Date Joined
                </Table.Th>
                <Table.Th 
                  style={{ 
                    color: CHARCOAL,
                    fontWeight: 600,
                    fontSize: '12px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    padding: '16px 20px',
                    textAlign: 'right',
                    borderBottom: `2px solid ${MUTED_OLIVE}30`
                  }}
                >
                  Actions
                </Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {rows}
            </Table.Tbody>
          </Table>

          {filteredData.length === 0 && !isLoading && (
            <Box 
              ta="center" 
              py={60}
              style={{
                color: MUTED_OLIVE,
                fontSize: '14px'
              }}
            >
              No users found
            </Box>
          )}
        </Paper>
      </Box>

      {/* Footer Section */}
      <Box 
        style={{ 
          padding: '20px 40px',
          backgroundColor: 'white',
          borderTop: '1px solid #E5E5E5',
          marginTop: 'auto'
        }}
      >
        <Group justify="space-between">
          <Text 
            size="sm" 
            style={{ 
              color: MUTED_OLIVE,
              fontSize: '13px'
            }}
          >
            Showing {filteredData.length} of {tableData.length} users
          </Text>
          <Text 
            size="sm" 
            style={{ 
              color: MUTED_OLIVE,
              fontSize: '13px'
            }}
          >
            JustReach © 2024
          </Text>
        </Group>
      </Box>
    </Stack>
  );
}