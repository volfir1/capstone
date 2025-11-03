import React from "react";
import { useAuth } from "../../../context/authContext";
import { Button, Container, Title, Paper, Grid, Text, Group } from "@mantine/core";
import { IconLogout, IconUsers, IconSettings, IconChartBar } from "@tabler/icons-react";
import { doSignOut } from "../../../firebase/auth";
import { useNavigate } from "react-router";

export default function AdminDashboard() {
    const { userData, currentUser } = useAuth();
    const navigate = useNavigate();

    const handleSignout = async () => {
        try {
            await doSignOut();
            navigate("/login");
        } catch (error) {
            console.error("Sign out error", error);
        }
    };

    return (
        <Container size="lg" py="xl">
            {/* Header */}
            <Group justify="space-between" mb="xl">
                <div>
                    <Title order={1} c="#7E30E1">Admin Dashboard</Title>
                    <Text c="dimmed">Welcome back, {userData?.firstName} {userData?.lastName}</Text>
                </div>
                <Button 
                    leftSection={<IconLogout size={18} />}
                    variant="outline"
                    color="red"
                    onClick={handleSignout}
                >
                    Logout
                </Button>
            </Group>

            {/* Admin Stats Cards */}
            <Grid mb="xl">
                <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
                    <Paper shadow="sm" p="lg" radius="md" withBorder>
                        <Group>
                            <IconUsers size={24} color="#7E30E1" />
                            <div>
                                <Text size="xl" fw={700}>0</Text>
                                <Text size="sm" c="dimmed">Total Users</Text>
                            </div>
                        </Group>
                    </Paper>
                </Grid.Col>

                <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
                    <Paper shadow="sm" p="lg" radius="md" withBorder>
                        <Group>
                            <IconChartBar size={24} color="#7E30E1" />
                            <div>
                                <Text size="xl" fw={700}>0</Text>
                                <Text size="sm" c="dimmed">Active Sessions</Text>
                            </div>
                        </Group>
                    </Paper>
                </Grid.Col>

                <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
                    <Paper shadow="sm" p="lg" radius="md" withBorder>
                        <Group>
                            <IconSettings size={24} color="#7E30E1" />
                            <div>
                                <Text size="xl" fw={700}>0</Text>
                                <Text size="sm" c="dimmed">System Settings</Text>
                            </div>
                        </Group>
                    </Paper>
                </Grid.Col>
            </Grid>

            {/* Quick Actions */}
            <Paper shadow="sm" p="lg" radius="md" withBorder>
                <Title order={3} mb="md">Quick Actions</Title>
                <Group>
                    <Button 
                        leftSection={<IconUsers size={18} />}
                        variant="light"
                        color="#7E30E1"
                        onClick={() => navigate("/admin/users")}
                    >
                        Manage Users
                    </Button>
                    <Button 
                        leftSection={<IconSettings size={18} />}
                        variant="light"
                        color="#7E30E1"
                        onClick={() => navigate("/admin/settings")}
                    >
                        System Settings
                    </Button>
                </Group>
            </Paper>

            {/* Admin Info */}
            <Paper shadow="sm" p="lg" radius="md" withBorder mt="xl">
                <Title order={3} mb="md">Account Information</Title>
                <Text><strong>Name:</strong> {userData?.firstName} {userData?.lastName}</Text>
                <Text><strong>Email:</strong> {userData?.email}</Text>
                <Text><strong>Role:</strong> {userData?.role}</Text>
                <Text><strong>Verified:</strong> {userData?.isVerified ? 'Yes' : 'No'}</Text>
            </Paper>
        </Container>
    );
}