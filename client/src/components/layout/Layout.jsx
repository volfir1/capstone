import React, { useState } from "react";
import {
  AppShell,
  Burger,
  NavLink,
  ScrollArea,
  Group,
  ActionIcon,
  Text,
  Badge,
  Box,
  Flex,
  Menu,
  Tooltip,
  Stack,
  Divider,
  Avatar,
} from "@mantine/core";
import {
  IconLogout,
  IconUserCircle,
  IconScale,
} from "@tabler/icons-react";
import { useAuth } from "../../context/authContext";
import { useNavigate } from "react-router";
import { doSignOut } from "@/firebase/auth";
import { useNotifications } from "@/hooks/useNotifications";
import NotificationDropdown from "@/components/ui/NotificationDropdown";
import { 
  PRIMARY_GOLD, 
  PRIMARY_BROWN, 
  MUTED_OLIVE, 
  BG, 
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
  headerHeight = 60,
  navbarWidth = 260,
}) => {
  const [opened, setOpened] = useState(false);
  const navigate = useNavigate();
  const { userData } = useAuth();
  const {
    notifications: notifList,
    unreadCount,
    loading: notifLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh: refreshNotifications,
  } = useNotifications(navigate);
  
  const currentPath = window.location.pathname;
  const actualUserRole = userData?.role || "client";
  
  // Determine which navigation to show based on current route
  let displayRole = actualUserRole;
  if (currentPath.startsWith('/admin')) {
    // All admin roles use the same navigation
    displayRole = actualUserRole === 'secretary' || actualUserRole === 'attorney' || actualUserRole === 'intern' || actualUserRole === 'pao_lawyer' || actualUserRole === 'legal_volunteer' || actualUserRole === 'supervising_lawyer' || actualUserRole === 'director' ? actualUserRole : 'secretary';
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
      // Log logout activity before signing out
      try {
        const { default: apiClient } = await import('@config/api/apiClient');
        await apiClient.post('/activity-logs', {
          action: 'logout',
          userEmail: userData?.email || '',
          userName: userData?.displayName || userData?.fullName || `${userData?.firstName || ''} ${userData?.lastName || ''}`.trim() || '',
          userRole: userData?.role || '',
        });
      } catch (err) {
        console.error('Logout activity log error:', err);
      }
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
            <Stack gap={4}>
              {(() => {
                let lastSection = null;
                const sectionLabels = { main: 'Main', insights: 'Insights', account: 'Account' };
                return navItems.map((item, index) => {
                  const isNewSection = item.section && item.section !== lastSection;
                  lastSection = item.section;
                  return (
                    <React.Fragment key={index}>
                      {isNewSection && index > 0 && (
                        <Divider my={8} color="#ECECEC" />
                      )}
                      {isNewSection && (
                        <Text size="10px" fw={700} c={MUTED_OLIVE} tt="uppercase" lts={1.5} px="sm" mt={index > 0 ? 2 : 0} mb={6}>
                          {sectionLabels[item.section] || item.section}
                        </Text>
                      )}
                      <NavLink
                        leftSection={<item.icon size={20} stroke={2} />}
                        label={
                          <Text size="sm" fw={item.active ? 600 : 400}>
                            {item.label}
                          </Text>
                        }
                        rightSection={
                          item.badge ? (
                            <Badge size="sm" color={PRIMARY_BROWN} variant="filled" fw={600}>
                              {item.badge}
                            </Badge>
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
                            borderRadius: '0 8px 8px 0',
                            padding: '10px 16px',
                            marginBottom: '2px',
                            borderLeft: item.active
                              ? `3px solid ${PRIMARY_BROWN}`
                              : '3px solid transparent',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              backgroundColor: item.active ? '#F5F0EB' : '#FAFAFA',
                            },
                          },
                          label: {
                            color: item.active ? PRIMARY_BROWN : CHARCOAL,
                            fontSize: '14px',
                          },
                          section: {
                            color: item.active ? PRIMARY_BROWN : MUTED_OLIVE,
                          },
                        }}
                        style={{
                          backgroundColor: item.active ? '#F5F0EB' : 'transparent',
                        }}
                      />
                    </React.Fragment>
                  );
                });
              })()}
            </Stack>
          </AppShell.Section>

          {/* User Info Footer */}
          <Box 
            px="lg" 
            py="md"
            style={{ borderTop: '1px solid #F0F0F0' }}
          >
            <Group gap="sm" wrap="nowrap">
              <Avatar
                size={36}
                radius="xl"
                src={userData?.profileImage || null}
                style={{
                  border: `2px solid ${PRIMARY_GOLD}`,
                  background: PRIMARY_BROWN,
                  flexShrink: 0,
                }}
              >
                <Text size="sm" fw={700} c="white">
                  {userData?.firstName?.charAt(0) || '?'}
                </Text>
              </Avatar>
              <Box style={{ minWidth: 0 }}>
                <Text size="sm" fw={600} c={CHARCOAL} truncate>
                  {userData?.firstName} {userData?.lastName}
                </Text>
                <Text size="xs" c={MUTED_OLIVE} truncate>
                  {roleDisplay}
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
            borderBottom: '1px solid #ECECEC',
          }}
        >
          <Flex align="center" justify="space-between" h="100%" px="lg">
            <Group gap="md">
              {showNavbar && (
                <Burger
                  opened={opened}
                  onClick={() => setOpened((o) => !o)}
                  hiddenFrom="sm"
                  size="sm"
                  color={PRIMARY_BROWN}
                />
              )}
              <Group gap={10}>
                <Box
                  style={{
                    width: 34,
                    height: 34,
                    background: PRIMARY_BROWN,
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <IconScale size={18} color="white" stroke={2} />
                </Box>
                <Box>
                  <Text size="md" fw={700} c={PRIMARY_BROWN} lh={1.2}>
                    JustReach
                  </Text>
                  <Text size="10px" c={MUTED_OLIVE} fw={500} lh={1} tt="uppercase" lts={0.5}>
                    Legal Services
                  </Text>
                </Box>
              </Group>
            </Group>

            <Group gap={4}>
              <NotificationDropdown
                notifications={notifList}
                unreadCount={unreadCount}
                loading={notifLoading}
                onRead={markAsRead}
                onReadAll={markAllAsRead}
                onDelete={deleteNotification}
                onRefresh={refreshNotifications}
                onNavigate={(referenceId, type) => {
                  if (referenceId) {
                    navigate(`/admin/recommendation/${referenceId}`, {
                      state: { showClientInfo: true, isViewingExistingReview: true },
                    });
                  }
                }}
              />

              <Menu shadow="md" width={180} position="bottom-end">
                <Menu.Target>
                  <Tooltip label="Account" position="bottom">
                    <ActionIcon size={36} variant="subtle" color="gray" radius="xl" p={0}>
                      <Avatar
                        size={32}
                        radius="xl"
                        src={userData?.profileImage || null}
                        style={{ border: `2px solid ${PRIMARY_GOLD}`, background: ACCENT_TAN, cursor: 'pointer' }}
                      >
                        <Text size="xs" fw={700} c="white">
                          {userData?.firstName?.charAt(0) || '?'}
                        </Text>
                      </Avatar>
                    </ActionIcon>
                  </Tooltip>
                </Menu.Target>

                <Menu.Dropdown style={{ borderRadius: '10px', border: '1px solid #E8E8E8' }}>
                  <Menu.Label style={{ fontSize: '10px', fontWeight: 700, color: MUTED_OLIVE, textTransform: 'uppercase', letterSpacing: '1px' }}>
                    Account
                  </Menu.Label>
                  <Menu.Item
                    leftSection={<IconUserCircle size={16} />}
                    onClick={() => navigate(currentPath.startsWith('/admin') ? '/admin/profile' : '/user/profile')}
                    styles={{ item: { borderRadius: '6px', fontSize: '13px', padding: '8px 10px' } }}
                  >
                    Profile
                  </Menu.Item>
                  <Menu.Divider />
                  <Menu.Item
                    leftSection={<IconLogout size={16} />}
                    color="red"
                    onClick={handleLogout}
                    styles={{ item: { borderRadius: '6px', fontSize: '13px', padding: '8px 10px' } }}
                  >
                    Logout
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
            </Group>
          </Flex>
        </AppShell.Header>
      )}

      <AppShell.Main style={{ backgroundColor: BG }}>
        <Box style={{ minHeight: 'calc(100vh - 60px)' }}>
          {children}
        </Box>
      </AppShell.Main>
    </AppShell>
  );
};

export { Layout };