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
} from "@mantine/core";
import {
  IconEdit,
  IconTrash,
  IconUsers,
} from "@tabler/icons-react";
import { useState } from "react";
import { useUsers } from "@/hooks/admin/users";
import { filterUsers } from "@/utils/userManagementUtils";
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
        borderBottom: '1px solid #F0F0F0'
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
          size="sm"
          radius="sm"
          style={{
            backgroundColor: row.role === 'secretary' ? PRIMARY_BROWN : MUTED_OLIVE,
            color: 'white',
            fontWeight: 600,
            textTransform: 'capitalize',
          }}
        >
          {row.role}
        </Badge>
      </Table.Td>
      <Table.Td style={{ padding: '16px 20px' }}>
        <Badge
          size="sm"
          radius="sm"
          style={{
            backgroundColor: row.status === 'Active' ? PRIMARY_GOLD : ACCENT_TAN,
            color: 'white',
            fontWeight: 600,
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
              color={PRIMARY_BROWN}
            >
              <IconEdit size={18} stroke={1.5} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Delete user" withArrow position="top">
            <ActionIcon 
              variant="subtle" 
              size="lg"
              radius="md"
              color="red"
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
            border: 'none',
          }}
        >
          <Group gap="md" align="center">
            <Box
              style={{
                width: 48,
                height: 48,
                borderRadius: '12px',
                background: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
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
          <Group justify="space-between" align="center">
            <Box style={{ flex: 1, maxWidth: '400px' }}>
              <UserSearchFilter
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </Box>
            
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
                  borderColor: '#E0E0E0',
                  '&:focus': {
                    borderColor: PRIMARY_BROWN
                  }
                }
              }}
            />
          </Group>
        </Paper>

        {/* Table Section */}
        <Paper
          shadow="xs"
          radius="lg"
          style={{ 
            backgroundColor: 'white',
            border: '1px solid #F0F0F0',
            overflow: 'hidden',
          }}
        >
          <Box style={{ overflowX: 'auto' }}>
            <Table>
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
                      borderBottom: '1px solid #F0F0F0'
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
                      borderBottom: '1px solid #F0F0F0'
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
                      borderBottom: '1px solid #F0F0F0'
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
                      borderBottom: '1px solid #F0F0F0'
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
                      borderBottom: '1px solid #F0F0F0'
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
                      borderBottom: '1px solid #F0F0F0'
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
          </Box>
          
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

        {/* Footer Section */}
        <Paper shadow="xs" p="md" mt="lg" radius="lg" bg="white">
          <Group justify="space-between">
            <Text 
              size="sm" 
              c={MUTED_OLIVE}
            >
              Showing {filteredData.length} of {tableData.length} users
            </Text>
            <Text 
              size="sm" 
              c={MUTED_OLIVE}
            >
              JustReach © 2024
            </Text>
          </Group>
        </Paper>
      </Container>
    </Box>
  );
}