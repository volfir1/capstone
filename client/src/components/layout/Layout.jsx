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
  UnstyledButton,
  Tooltip,
  Indicator,
  Stack,
  Divider,
} from "@mantine/core";
import {
  IconBell,
  IconSearch,
  IconLogout,
  IconUserCircle,
  IconChevronDown,
  IconScale,
  IconSettings,
  IconChevronRight,
  IconDashboard,
} from "@tabler/icons-react";
import { useAuth } from "../../context/authContext";
import { useNavigate } from "react-router";
import { doSignOut } from "@/firebase/auth";
import { 
  PRIMARY_GOLD, 
  PRIMARY_BROWN, 
  MUTED_OLIVE, 
  THEMED_LIGHT_BG, 
  CHARCOAL, 
  ACCENT_TAN 
} from "@/utils/constants";
import { 
  getNavigationByRole, 
  ROLE_DISPLAY, 
  PAGE_TITLES,
  getLayoutConfig 
} from "@/utils/navigation";

// Base Layout Component
const Layout = ({
  children,
  headerHeight = 70,
  navbarWidth = 280,
}) => {
  const [opened, setOpened] = useState(false);
  const navigate = useNavigate();
  const { userData } = useAuth();
  
  const currentPath = window.location.pathname;
  const actualUserRole = userData?.role || "client";
  
  // Determine which navigation to show based on current route
  let displayRole = actualUserRole;
  if (currentPath.startsWith('/admin')) {
    displayRole = 'admin';
  } else if (currentPath.startsWith('/attorney')) {
    displayRole = 'attorney';
  } else if (currentPath.startsWith('/user')) {
    displayRole = 'client';
  }
  
  // Get layout configuration for current page
  const layoutConfig = getLayoutConfig(currentPath);
  const showHeader = layoutConfig.showHeader;
  const showNavbar = layoutConfig.showNavbar;
  
  // Get navigation items based on display role (route-based)
  const navItems = getNavigationByRole(displayRole, currentPath);
  const pageTitle = PAGE_TITLES[displayRole] || PAGE_TITLES.client;
  const roleDisplay = ROLE_DISPLAY[displayRole] || ROLE_DISPLAY.client;

  const handleLogout = async () => {
    try {
      await doSignOut();
      navigate('/auth/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

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
      padding={0}
    >
      {showNavbar && (
        <AppShell.Navbar
          style={{
            backgroundColor: "white",
            borderRight: `1px solid #E8E8E8`,
            boxShadow: '2px 0 8px rgba(0, 0, 0, 0.02)',
          }}
        >
          {/* Navigation Section */}
          <AppShell.Section grow component={ScrollArea} px="lg" pt="xl">
            <Stack gap="xs">
              {navItems.map((item, index) => (
                <NavLink
                  key={index}
                  leftSection={
                    <Box 
                      style={{
                        width: 40,
                        height: 40,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '10px',
                        backgroundColor: item.active ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      }}
                    >
                      <item.icon size={22} stroke={2.5} />
                    </Box>
                  }
                  label={
                    <Text size="md" fw={item.active ? 600 : 500}>
                      {item.label}
                    </Text>
                  }
                  rightSection={
                    item.badge ? (
                      <Badge 
                        size="md" 
                        color={PRIMARY_BROWN} 
                        variant="filled"
                        style={{
                          fontWeight: 600,
                        }}
                      >
                        {item.badge}
                      </Badge>
                    ) : item.active ? (
                      <Box
                        style={{
                          width: 4,
                          height: 4,
                          borderRadius: '50%',
                          backgroundColor: 'white',
                        }}
                      />
                    ) : null
                  }
                  active={item.active}
                  onClick={() => {
                    setOpened(false);
                    if (item.path) navigate(item.path);
                    if (item.onClick) item.onClick();
                  }}
                  styles={{
                    root: {
                      borderRadius: "12px",
                      padding: '14px 16px',
                      marginBottom: '8px',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      border: 'none',
                      '&:hover': {
                        backgroundColor: item.active ? PRIMARY_BROWN : THEMED_LIGHT_BG,
                        transform: 'translateX(4px)',
                        boxShadow: item.active ? '0 4px 12px rgba(101, 67, 33, 0.3)' : '0 2px 8px rgba(0, 0, 0, 0.05)',
                      },
                      '&:active': {
                        transform: 'translateX(2px)',
                      },
                    },
                    label: {
                      color: item.active ? 'white' : CHARCOAL,
                      fontSize: '15px',
                    },
                    section: {
                      color: item.active ? 'white' : MUTED_OLIVE,
                    },
                  }}
                  style={{
                    backgroundColor: item.active ? PRIMARY_BROWN : "transparent",
                    boxShadow: item.active ? '0 2px 8px rgba(101, 67, 33, 0.2)' : 'none',
                  }}
                />
              ))}
            </Stack>
          </AppShell.Section>

          {/* Welcome Section at Bottom */}
          <Box 
            p="lg"
            style={{ 
              borderTop: `1px solid #F0F0F0`,
              backgroundColor: THEMED_LIGHT_BG,
            }}
          >
            <Box 
              p="md"
              style={{
                backgroundColor: 'white',
                borderRadius: '10px',
                border: `1px solid #E8E8E8`,
              }}
            >
              <Text size="lg" fw={700} c={CHARCOAL} mb={4}>
                {pageTitle}
              </Text>
              <Text size="xs" c={MUTED_OLIVE} fw={500} mb="md">
                Welcome back, {userData?.firstName}
              </Text>
              
              {/* Switch Dashboard for Attorney Roles */}
              {(actualUserRole === 'attorney' || actualUserRole === 'pao_lawyer' || actualUserRole === 'legal_volunteer') && (
                <UnstyledButton
                  onClick={() => {
                    const isOnAdminPage = currentPath.startsWith('/admin');
                    navigate(isOnAdminPage ? '/attorney' : '/admin');
                    setOpened(false);
                  }}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    backgroundColor: THEMED_LIGHT_BG,
                    border: `1px solid #E8E8E8`,
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                  styles={{
                    root: {
                      '&:hover': {
                        backgroundColor: PRIMARY_BROWN,
                        borderColor: PRIMARY_BROWN,
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 12px rgba(101, 67, 33, 0.2)',
                        '& .switch-text': {
                          color: 'white',
                        },
                        '& .switch-icon': {
                          color: 'white',
                        },
                      },
                    },
                  }}
                >
                  <Group gap={8}>
                    <Box
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: '6px',
                        backgroundColor: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <IconDashboard size={16} color={PRIMARY_BROWN} stroke={2} className="switch-icon" />
                    </Box>
                    <Text size="sm" fw={600} c={CHARCOAL} className="switch-text">
                      {currentPath.startsWith('/admin') ? 'Switch to Attorney' : 'Switch to Admin'}
                    </Text>
                  </Group>
                  <IconChevronRight size={16} color={MUTED_OLIVE} stroke={2} className="switch-icon" />
                </UnstyledButton>
              )}
            </Box>
          </Box>
        </AppShell.Navbar>
      )}

      {showHeader && (
        <AppShell.Header
          style={{
            backgroundColor: "white",
            borderBottom: `1px solid #F0F0F0`,
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
          }}
        >
          <Flex align="center" justify="space-between" h="100%" px="xl">
            <Group gap="lg">
              {showNavbar && (
                <Burger
                  opened={opened}
                  onClick={() => setOpened((o) => !o)}
                  hiddenFrom="sm"
                  size="sm"
                  color={PRIMARY_BROWN}
                />
              )}
              <Group gap="md">
                <Box
                  style={{
                    width: 42,
                    height: 42,
                    background: `linear-gradient(135deg, ${PRIMARY_BROWN} 0%, #5C4033 100%)`,
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 8px rgba(101, 67, 33, 0.15)',
                  }}
                >
                  <IconScale size={22} color="white" stroke={2} />
                </Box>
                <Box>
                  <Text size="lg" fw={700} c={PRIMARY_BROWN} lh={1.2}>
                    JustReach
                  </Text>
                  <Text size="xs" c={MUTED_OLIVE} fw={500} lh={1.2}>
                    Legal Services
                  </Text>
                </Box>
              </Group>
            </Group>

            <Group gap="sm">
              <Tooltip label="Search" position="bottom">
                <ActionIcon
                  size={44}
                  variant="subtle"
                  color={MUTED_OLIVE}
                  visibleFrom="sm"
                  radius="xl"
                  styles={{
                    root: {
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        backgroundColor: THEMED_LIGHT_BG,
                        transform: 'scale(1.05)',
                      },
                    },
                  }}
                >
                  <IconSearch size={20} />
                </ActionIcon>
              </Tooltip>
              
              <Tooltip label="Notifications" position="bottom">
                <Indicator 
                  color="red" 
                  size={8}
                  offset={5}
                  processing
                >
                  <ActionIcon 
                    size={44} 
                    variant="subtle" 
                    color={MUTED_OLIVE}
                    radius="xl"
                    styles={{
                      root: {
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          backgroundColor: THEMED_LIGHT_BG,
                          transform: 'scale(1.05)',
                        },
                      },
                    }}
                  >
                    <IconBell size={20} />
                  </ActionIcon>
                </Indicator>
              </Tooltip>

              <Menu shadow="lg" width={200} position="bottom-end">
                <Menu.Target>
                  <Tooltip label="Account" position="bottom">
                    <ActionIcon
                      size={44}
                      variant="subtle"
                      color={MUTED_OLIVE}
                      radius="xl"
                      styles={{
                        root: {
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            backgroundColor: THEMED_LIGHT_BG,
                            transform: 'scale(1.05)',
                          },
                        },
                      }}
                    >
                      <IconUserCircle size={22} />
                    </ActionIcon>
                  </Tooltip>
                </Menu.Target>

                <Menu.Dropdown style={{ borderRadius: '12px', border: `1px solid #E8E8E8` }}>
                  <Menu.Label style={{ fontSize: '11px', fontWeight: 600, color: MUTED_OLIVE, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Account
                  </Menu.Label>
                  <Menu.Item 
                    leftSection={<IconUserCircle size={18} />}
                    styles={{
                      item: {
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: 500,
                        padding: '10px 12px',
                        '&:hover': {
                          backgroundColor: THEMED_LIGHT_BG,
                        },
                      },
                    }}
                  >
                    View Profile
                  </Menu.Item>
                  <Menu.Item 
                    leftSection={<IconSettings size={18} />}
                    styles={{
                      item: {
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: 500,
                        padding: '10px 12px',
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
                    leftSection={<IconLogout size={18} />} 
                    color="red"
                    onClick={handleLogout}
                    styles={{
                      item: {
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: 500,
                        padding: '10px 12px',
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
        <Box style={{ minHeight: 'calc(100vh - 70px)' }}>
          {children}
        </Box>
      </AppShell.Main>
    </AppShell>
  );
};

export { Layout };