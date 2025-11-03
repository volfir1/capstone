import React from "react";
import { useAuth } from "@/context/authContext";
import { Button, Container, Title, Paper, Grid, Text, Group, Avatar, Stack } from "@mantine/core";
import { IconLogout, IconUser, IconSettings, IconBell, IconShieldCheck } from "@tabler/icons-react";
import { doSignOut } from "@/firebase/auth";
import { Navigate, useNavigate } from "react-router";
import { Loaders } from "@/components/ui/Loader";

const Home = () => {
    const { userData, userLoggedIn, loading } = useAuth();
    const navigate = useNavigate();

    console.log('Home component render:', { loading, userLoggedIn, hasUserData: !!userData });

    const handleSignout = async () => {
        try {
            await doSignOut();
            navigate("/login");
        } catch (error) {
            console.error("Sign out error", error);
        }
    };

    // Show loader while auth is checking OR while userData is being fetched
    if (loading) {
        console.log('Showing loader: loading is true');
        return <Loaders height={window.innerHeight - 100} />;
    }

    if (!userLoggedIn) {
        console.log('Not logged in, redirecting to login');
        return <Navigate to="/login" replace={true} />
    }

    if (!userData) {
        console.log('Showing loader: userData is null');
        return <Loaders height={window.innerHeight - 100} />;
    }

    console.log('Rendering Home page with userData:', userData);

    return (
        <Container size="lg" py="xl">
            {/* Header */}
            <Group justify="space-between" mb="xl">
                <div>
                    <Title order={1} c="#7E30E1">Welcome Back!</Title>
                    <Text c="dimmed">Hello {userData.firstName} {userData.lastName}, have a great day!</Text>
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

            {/* User Profile Card */}
            <Paper shadow="sm" p="xl" radius="md" withBorder mb="xl">
                <Group>
                    <Avatar 
                        size="lg" 
                        color="#7E30E1"
                        radius="xl"
                    >
                        {userData.firstName?.charAt(0)}{userData.lastName?.charAt(0)}
                    </Avatar>
                    <div>
                        <Title order={2}>{userData.firstName} {userData.lastName}</Title>
                        <Text c="dimmed">{userData.email}</Text>
                        <Group gap="xs" mt="xs">
                            <IconShieldCheck 
                                size={16} 
                                color={userData.isVerified ? "green" : "red"} 
                            />
                            <Text size="sm" c={userData.isVerified ? "green" : "red"}>
                                {userData.isVerified ? 'Verified Account' : 'Unverified Account'}
                            </Text>
                        </Group>
                    </div>
                </Group>
            </Paper>

            {/* Quick Stats */}
            <Grid mb="xl">
                <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
                    <Paper shadow="sm" p="lg" radius="md" withBorder>
                        <Group>
                            <IconUser size={24} color="#7E30E1" />
                            <div>
                                <Text size="xl" fw={700}>Active</Text>
                                <Text size="sm" c="dimmed">Account Status</Text>
                            </div>
                        </Group>
                    </Paper>
                </Grid.Col>

                <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
                    <Paper shadow="sm" p="lg" radius="md" withBorder>
                        <Group>
                            <IconBell size={24} color="#7E30E1" />
                            <div>
                                <Text size="xl" fw={700}>0</Text>
                                <Text size="sm" c="dimmed">Notifications</Text>
                            </div>
                        </Group>
                    </Paper>
                </Grid.Col>

                <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
                    <Paper shadow="sm" p="lg" radius="md" withBorder>
                        <Group>
                            <IconSettings size={24} color="#7E30E1" />
                            <div>
                                <Text size="xl" fw={700}>View</Text>
                                <Text size="sm" c="dimmed">Settings</Text>
                            </div>
                        </Group>
                    </Paper>
                </Grid.Col>
            </Grid>

            {/* Quick Actions */}
            <Paper shadow="sm" p="lg" radius="md" withBorder mb="xl">
                <Title order={3} mb="md">Quick Actions</Title>
                <Group>
                    <Button 
                        leftSection={<IconUser size={18} />}
                        variant="light"
                        color="#7E30E1"
                        onClick={() => navigate("/user/profile")}
                    >
                        Edit Profile
                    </Button>
                    <Button 
                        leftSection={<IconSettings size={18} />}
                        variant="light"
                        color="#7E30E1"
                        onClick={() => navigate("/user/settings")}
                    >
                        Account Settings
                    </Button>
                </Group>
            </Paper>

            {/* Account Information */}
            <Paper shadow="sm" p="lg" radius="md" withBorder>
                <Title order={3} mb="md">Account Details</Title>
                <Stack gap="xs">
                    <Group justify="space-between">
                        <Text fw={500}>Full Name:</Text>
                        <Text>{userData.firstName} {userData.lastName}</Text>
                    </Group>
                    <Group justify="space-between">
                        <Text fw={500}>Email:</Text>
                        <Text>{userData.email}</Text>
                    </Group>
                    <Group justify="space-between">
                        <Text fw={500}>Username:</Text>
                        <Text>{userData.username}</Text>
                    </Group>
                    <Group justify="space-between">
                        <Text fw={500}>Account Type:</Text>
                        <Text transform="capitalize">{userData.role}</Text>
                    </Group>
                    <Group justify="space-between">
                        <Text fw={500}>Member Since:</Text>
                        <Text>{new Date(userData.createdAt).toLocaleDateString()}</Text>
                    </Group>
                </Stack>
            </Paper>
        </Container>
    );
};

export default Home;