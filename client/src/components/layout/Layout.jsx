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
  Image,
} from "@mantine/core";
import {
  IconHome,
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
  IconBriefcase2,
  IconScale,
} from "@tabler/icons-react";
import { useAuth } from "../../context/authContext";
import { useNavigate } from "react-router";
import { 
  PRIMARY_GOLD, 
  PRIMARY_BROWN, 
  MUTED_OLIVE, 
  THEMED_LIGHT_BG, 
  CHARCOAL, 
  ACCENT_TAN 
} from "@/utils/constants";

// Base Layout Component
const Layout = ({
  children,
  showHeader = true,
  showNavbar = true,
  headerHeight = 60,
  navbarWidth = 260,
}) => {
  const [opened, setOpened] = useState(false);
  const navigate = useNavigate();
  const { userData } = useAuth();

  // Define navigation items based on user role
  const getNavItems = () => {
    const currentPath = window.location.pathname;
    if (userData?.role === "admin") {
      const adminItems = [
        { icon: IconDashboard, label: "Dashboard", path: '/admin' },
        { icon: IconUsers, label: "Users Management", badge: "12", path: '/admin/users' },
        { icon: IconShield, label: "Roles & Permissions", path: '/admin/roles' },
        { icon: IconDatabase, label: "Database", path: '/admin/database' },
        { icon: IconClipboardText, label: "Reports", path: '/admin/reports' },
        { icon: IconChartArea, label: "Analytics", badge: "New", path: '/admin/analytics' },
        { icon: IconUserPlus, label: "Add Users", path: '/admin/add-users' },
        { icon: IconFiles, label: "Content Management", path: '/admin/content' },
        { icon: IconSettings, label: "System Settings", path: '/admin/settings' },
      ];
      return adminItems.map(item => ({
        ...item,
        active: currentPath === item.path
      }));
    } else {
      const userItems = [
        { icon: IconHome, label: "Home", path: "home" },
        { icon: IconBriefcase2, label: "Submit a Case", path: "submitcase" },
        { icon: IconFiles, label: "My Cases", path: "/cases" },
        { icon: IconUserCircle, label: "Profile", path: "/profile" },
      ];
      return userItems.map(item => ({
        ...item,
        active: currentPath === item.path
      }));
    }
  };

  // Get page title based on user role
  const getPageTitle = () => {
    return userData?.role === "admin" ? "Admin Dashboard" : "Client Portal";
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
            backgroundColor: "white",
            borderRight: `1px solid ${ACCENT_TAN}`,
          }}
        >
          {/* Navbar Header with Logo */}
          <Box 
            p="lg" 
            pb="md"
            style={{ 
              borderBottom: `2px solid ${THEMED_LIGHT_BG}`,
            }}
          >
            <Group gap="sm">
              {/* Logo Placeholder - Replace with your actual logo */}
              <Box
                style={{
                  width: 40,
                  height: 40,
                  backgroundColor: PRIMARY_BROWN,
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <IconScale size={24} color="white" />
              </Box>
              <Box>
                <Text size="lg" fw={700} c={PRIMARY_BROWN} lh={1.2}>
                  JustReach
                </Text>
                <Text size="xs" c={MUTED_OLIVE} lh={1.2}>
                  Legal Services
                </Text>
              </Box>
            </Group>
          </Box>

          <AppShell.Section grow>
            <ScrollArea px="md" py="md">
              {navItems.map((item, index) => (
                <NavLink
                  key={index}
                  leftSection={<item.icon size={20} stroke={1.5} />}
                  label={item.label}
                  rightSection={
                    item.badge && (
                      <Badge size="xs" color={PRIMARY_GOLD} variant="filled">
                        {item.badge}
                      </Badge>
                    )
                  }
                  active={item.active}
                  onClick={() => {
                    setOpened(false);
                    if (item.path) navigate(item.path);
                    if (item.onClick) item.onClick();
                  }}
                  mb="xs"
                  styles={{
                    root: {
                      borderRadius: "8px",
                      fontWeight: 500,
                      padding: '10px 12px',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        backgroundColor: item.active ? PRIMARY_BROWN : THEMED_LIGHT_BG,
                      },
                    },
                    label: {
                      color: item.active ? 'white' : CHARCOAL,
                    },
                    section: {
                      color: item.active ? 'white' : MUTED_OLIVE,
                    },
                  }}
                  style={{
                    backgroundColor: item.active ? PRIMARY_BROWN : "transparent",
                  }}
                />
              ))}
            </ScrollArea>
          </AppShell.Section>

          {/* User Profile Section */}
          <Box 
            p="md" 
            pt="sm"
            style={{ 
              borderTop: `2px solid ${THEMED_LIGHT_BG}`,
            }}
          >
            <Group gap="sm">
              <Avatar 
                size="md" 
                color={PRIMARY_BROWN}
                style={{
                  border: `2px solid ${PRIMARY_GOLD}`,
                }}
              >
                {userData?.firstName?.charAt(0)}
                {userData?.lastName?.charAt(0)}
              </Avatar>
              <Box style={{ flex: 1 }}>
                <Text size="sm" fw={600} c={CHARCOAL}>
                  {userData?.firstName} {userData?.lastName}
                </Text>
                <Text size="xs" c={MUTED_OLIVE} tt="capitalize">
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
            borderBottom: `2px solid ${THEMED_LIGHT_BG}`,
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
                  color={PRIMARY_BROWN}
                />
              )}
              <Text fw={600} size="lg" c={CHARCOAL}>
                {pageTitle}
              </Text>
            </Group>

            <Group gap="xs">
              <ActionIcon
                size="lg"
                variant="subtle"
                color={MUTED_OLIVE}
                visibleFrom="sm"
                styles={{
                  root: {
                    '&:hover': {
                      backgroundColor: THEMED_LIGHT_BG,
                    },
                  },
                }}
              >
                <IconSearch size={20} />
              </ActionIcon>
              
              <ActionIcon 
                size="lg" 
                variant="subtle" 
                color={MUTED_OLIVE}
                styles={{
                  root: {
                    '&:hover': {
                      backgroundColor: THEMED_LIGHT_BG,
                    },
                  },
                }}
              >
                <IconBell size={20} />
              </ActionIcon>

              <Menu shadow="md" width={220}>
                <Menu.Target>
                  <Group 
                    style={{ 
                      cursor: "pointer",
                      padding: '4px 8px',
                      borderRadius: '8px',
                      transition: 'background-color 0.2s ease',
                    }}
                    gap="xs"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = THEMED_LIGHT_BG;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <Avatar
                      size="sm"
                      color={PRIMARY_BROWN}
                      style={{
                        border: `2px solid ${PRIMARY_GOLD}`,
                      }}
                    >
                      {userData?.firstName?.charAt(0)}
                      {userData?.lastName?.charAt(0)}
                    </Avatar>
                    <Box visibleFrom="sm">
                      <Text size="sm" fw={600} c={CHARCOAL}>
                        {userData?.firstName} {userData?.lastName}
                      </Text>
                      <Text size="xs" c={MUTED_OLIVE}>
                        {userData?.email}
                      </Text>
                    </Box>
                    <IconChevronDown size={16} color={MUTED_OLIVE} />
                  </Group>
                </Menu.Target>

                <Menu.Dropdown>
                  <Menu.Item 
                    leftSection={<IconUserCircle size={16} />}
                    styles={{
                      item: {
                        '&:hover': {
                          backgroundColor: THEMED_LIGHT_BG,
                        },
                      },
                    }}
                  >
                    Profile
                  </Menu.Item>
                  <Menu.Item 
                    leftSection={<IconSettings size={16} />}
                    styles={{
                      item: {
                        '&:hover': {
                          backgroundColor: THEMED_LIGHT_BG,
                        },
                      },
                    }}
                  >
                    Settings
                  </Menu.Item>
                  <Menu.Divider />
                  <Menu.Item 
                    leftSection={<IconLogout size={16} />} 
                    color="red"
                    styles={{
                      item: {
                        '&:hover': {
                          backgroundColor: '#fee',
                        },
                      },
                    }}
                  >
                    Logout
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
            </Group>
          </Flex>
        </AppShell.Header>
      )}

      <AppShell.Main style={{ backgroundColor: THEMED_LIGHT_BG }}>
        <Container fluid>{children}</Container>
      </AppShell.Main>
    </AppShell>
  );
};

export { Layout };