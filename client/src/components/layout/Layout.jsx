import React, { useState } from "react";
import {
  AppShell,
  Burger,
  NavLink,
  ScrollArea,
  Group,
  ActionIcon,
  Container,
  Text,
  Badge,
  Box,
  Flex,
  Avatar,
  Menu,
  Divider,
} from "@mantine/core";
import {
  IconHome,
  IconUser,
  IconSettings,
  IconBell,
  IconSearch,
  IconDashboard,
  IconUsers,
  IconFiles,
  IconChartArea,
  IconShield,
  IconDatabase,
  IconClipboardText,
  IconUserPlus,
  IconLogout,
  IconUserCircle,
  IconChevronDown,
  IconShoppingCart,
  IconHeart,
  IconHistory,
  IconCreditCard,
  IconHelp,
} from "@tabler/icons-react";
import { useAuth } from "../../context/authContext";
import { useNavigate } from "react-router";



// Base Layout Component
const Layout = ({
  children,
  showHeader = true,
  showNavbar = true,
  headerHeight = 60,
  navbarWidth = 260,
}) => {
  const [opened, setOpened] = useState(false);
  const navigate = useNavigate()
  const { userData } = useAuth();

  // Define navigation items based on user role
  const getNavItems = () => {
    const currentPath = window.location.pathname
    if (userData?.role === "admin") {
      const adminItems = [
        { icon: IconDashboard, label: "Dashboard", active: true, path: '/admin' },
        { icon: IconUsers, label: "Users Management", badge: "12", path:'/admin/users' },
        { icon: IconShield, label: "Roles & Permissions" },
        { icon: IconDatabase, label: "Database" },
        { icon: IconClipboardText, label: "Reports" },
        { icon: IconChartArea, label: "Analytics", badge: "New" },
        { icon: IconUserPlus, label: "Add Users" },
        { icon: IconFiles, label: "Content Management" },
        { icon: IconSettings, label: "System Settings" },
      ];
       return adminItems.map(item => ({
      ...item,
      active: currentPath === item.path
    }));
    } else {
      const userItems = [
        { icon: IconHome, label: "Home", active: true },
        { icon: IconUser, label: "Profile" },
        { icon: IconShoppingCart, label: "My Orders", badge: "3" },
        { icon: IconHeart, label: "Wishlist" },
        { icon: IconHistory, label: "Order History" },
        { icon: IconCreditCard, label: "Payment Methods" },
        { icon: IconBell, label: "Notifications" },
        { icon: IconHelp, label: "Help & Support" },
        { icon: IconSettings, label: "Settings" },
      ];

       return userItems.map(item => ({
      ...item,
      active: currentPath === item.path
    }));
    }
  };

  // Get page title based on user role
  const getPageTitle = () => {
    return userData?.role === "admin" ? "Admin Dashboard" : "My Account";
  };

  const navItems = getNavItems();
  const pageTitle = getPageTitle();

  return (
    <AppShell
      header={showHeader ? { height: headerHeight } : undefined}
      navbar={
        showNavbar
          ? {
              width: { base: navbarWidth },
              breakpoint: "sm",
              collapsed: { mobile: !opened },
            }
          : undefined
      }
      padding="md"
    >
      {showNavbar && (
        <AppShell.Navbar
          style={{
            backgroundColor: "#fafafa",
            borderRight: "1px solid #e9ecef",
          }}
        >
          {/* Navbar Header */}
          <Box p="md" pb="sm">
            <Text size="lg" fw={600} c="#7E30E1">
              Just
              <Text component="span" c="#E26EE5">
                Reach
              </Text>
            </Text>
          </Box>

          <AppShell.Section grow>
            <ScrollArea px="sm">
              {navItems.map((item, index) => (
                <NavLink
                  key={index}
                  leftSection={<item.icon size={18} stroke={1.5} />}
                  label={item.label}
                  rightSection={
                    item.badge && (
                      <Badge size="xs" color="#7E30E1" variant="filled">
                        {item.badge}
                      </Badge>
                    )
                  }
                  active={item.active}
                  onClick={() => {
                    setOpened(false);
                    if (item.path) navigate(item.path)
                    if (item.onClick) item.onClick();
                  
                  }}
                  mb="xs"
                  style={{
                    borderRadius: "8px",
                    fontWeight: 500,
                    backgroundColor: item.active ? "#7E30E1" : "transparent",
                    color: item.active ? "white" : "#495057",
                  }}
                />
              ))}
            </ScrollArea>
          </AppShell.Section>

          {/* User Profile Section */}
          <Box p="md" pt="sm">
            <Divider mb="sm" />
            <Group>
              <Avatar size="sm" color="#7E30E1" name={userData?.firstName}>
                {userData?.firstName?.charAt(0)}
                {userData?.lastName?.charAt(0)}
              </Avatar>
              <Box style={{ flex: 1 }}>
                <Text size="sm" fw={500}>
                  {userData?.firstName} {userData?.lastName}
                </Text>
                <Text size="xs" c="dimmed">
                  {userData?.role}
                </Text>
              </Box>
            </Group>
          </Box>
        </AppShell.Navbar>
      )}

      {showHeader && (
        <AppShell.Header
          style={{
            backgroundColor: "white",
            borderBottom: "1px solid #e9ecef",
          }}
        >
          <Flex align="center" justify="space-between" h="100%" px="md">
            <Group>
              {showNavbar && (
                <Burger
                  opened={opened}
                  onClick={() => setOpened((o) => !o)}
                  hiddenFrom="sm"
                  size="sm"
                  color="#7E30E1"
                />
              )}

              <Text fw={600} size="lg" c="dark">
                {pageTitle}
              </Text>
            </Group>

            <Group gap="xs">
              <ActionIcon
                size="lg"
                variant="subtle"
                color="gray"
                visibleFrom="sm"
              >
                <IconSearch size={18} />
              </ActionIcon>

              <ActionIcon size="lg" variant="subtle" color="gray">
                <IconBell size={18} />
              </ActionIcon>

              <Menu shadow="md" width={200}>
                <Menu.Target>
                  <Group style={{ cursor: "pointer" }} gap="xs">
                    <Avatar
                      size="sm"
                      color="#7E30E1"
                      name={userData?.firstName}
                    >
                      {userData?.firstName?.charAt(0)}
                      {userData?.lastName?.charAt(0)}
                    </Avatar>
                    <Box visibleFrom="sm">
                      <Text size="sm" fw={500}>
                        {userData?.firstName} {userData?.lastName}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {userData?.email}
                      </Text>
                    </Box>
                    <IconChevronDown size={14} />
                  </Group>
                </Menu.Target>

                <Menu.Dropdown>
                  <Menu.Item leftSection={<IconUserCircle size={14} />}>
                    Profile
                  </Menu.Item>
                  <Menu.Item leftSection={<IconSettings size={14} />}>
                    Settings
                  </Menu.Item>
                  <Menu.Divider />
                  <Menu.Item leftSection={<IconLogout size={14} />} color="red">
                    Logout
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
            </Group>
          </Flex>
        </AppShell.Header>
      )}

      <AppShell.Main>
        <Container fluid>{children}</Container>
      </AppShell.Main>
    </AppShell>
  );
};

export { Layout };
