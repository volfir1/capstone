import { useState } from "react";
import {
  AppShell, Burger, NavLink, ScrollArea,
  Group, ActionIcon, Text, Badge, Box,
  Flex, Menu, Tooltip, Stack, Divider, Avatar,
} from "@mantine/core";
import { IconLogout, IconUserCircle } from "@tabler/icons-react";
import { useAuth } from "../../context/authContext";
import { useNavigate } from "react-router";
import { doSignOut } from "@/firebase/auth";
import { useNotifications } from "@/hooks/useNotifications";
import NotificationDropdown from "@/components/ui/NotificationDropdown";
import { PRIMARY_GOLD, PRIMARY_BROWN, MUTED_OLIVE, BG, CHARCOAL, ACCENT_TAN } from "@/utils/constants";
import { getNavigationByRole, ROLE_DISPLAY } from "@/utils/navigation";

const SECTION_LABELS = { main: 'Main', insights: 'Insights', account: 'Account' };
const KNOWN_ROLES = new Set(['secretary', 'supervising_lawyer', 'director', 'intern']);
const MENU_ITEM_STYLES = { item: { borderRadius: '6px', fontSize: '13px', padding: '8px 10px' } };

const UserAvatar = ({ src, firstName, size = 36, border = `2px solid ${PRIMARY_GOLD}`, bg = PRIMARY_BROWN }) => (
  <Avatar size={size} radius="xl" src={src || null} style={{ border, background: bg, flexShrink: 0 }}>
    <Text size={size <= 32 ? "xs" : "sm"} fw={700} c="white">
      {firstName?.charAt(0) || '?'}
    </Text>
  </Avatar>
);

const Layout = ({ children, headerHeight = 60, navbarWidth = 260 }) => {
  const [opened, setOpened] = useState(false);
  const navigate = useNavigate();
  const { userData } = useAuth();
  const {
    notifications: notifList, unreadCount, loading: notifLoading,
    markAsRead, markAllAsRead, deleteNotification,
    deleteAllNotifications, refresh: refreshNotifications,
  } = useNotifications(navigate);

  const currentPath = window.location.pathname;
  const role = KNOWN_ROLES.has(userData?.role) ? userData.role : 'secretary';
  const roleDisplay = ROLE_DISPLAY[role] || ROLE_DISPLAY.secretary;
  const navItems = getNavigationByRole(role, currentPath);

  const handleLogout = async () => {
    try {
      try {
        const { default: apiClient } = await import('@config/api/apiClient');
        await apiClient.post('/activity-logs', {
          action: 'logout',
          userEmail: userData?.email || '',
          userName: userData?.displayName || userData?.fullName || `${userData?.firstName || ''} ${userData?.lastName || ''}`.trim() || '',
          userRole: role,
        });
      } catch (err) {
        console.error('Logout activity log error:', err);
      }
      await doSignOut();
      navigate('/auth/admin');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleNavNotification = (referenceId, type) => {
    if (type === 'case_assigned') {
      navigate('/admin/assigned-cases');
    } else if (type === 'appointment_created' || type === 'appointment_updated') {
      // Always go to appointment list so admin can review pending appointments
      navigate('/admin/clientformstatus');
    } else if (type === 'review_pending' && referenceId) {
      navigate(`/admin/recommendation/${referenceId}`, {
        state: { showClientInfo: true, isViewingExistingReview: true },
      });
    } else if (referenceId) {
      navigate(`/admin/recommendation/${referenceId}`, {
        state: { showClientInfo: true, isViewingExistingReview: true },
      });
    }
  };

  return (
    <AppShell
      header={{ height: headerHeight }}
      navbar={{ width: { base: navbarWidth }, breakpoint: "sm", collapsed: { mobile: !opened } }}
      padding={0}
    >
      <AppShell.Navbar style={{ backgroundColor: "white", borderRight: `1px solid #E8E8E8`, boxShadow: '2px 0 8px rgba(0,0,0,0.02)' }}>
        <AppShell.Section grow component={ScrollArea} px="lg" pt="xl">
          <Stack gap={4}>
            {(() => {
              let lastSection = null;
              return navItems.map((item, index) => {
                const isNewSection = item.section && item.section !== lastSection;
                lastSection = item.section;
                return (
                  <div key={item.path}>
                    {isNewSection && index > 0 && <Divider my={8} color="#ECECEC" />}
                    {isNewSection && (
                      <Text size="10px" fw={700} c={MUTED_OLIVE} tt="uppercase" lts={1.5} px="sm" mt={index > 0 ? 2 : 0} mb={6}>
                        {SECTION_LABELS[item.section] || item.section}
                      </Text>
                    )}
                    <NavLink
                      leftSection={<item.icon size={20} stroke={2} />}
                      label={<Text size="sm" fw={item.active ? 600 : 400}>{item.label}</Text>}
                      rightSection={item.badge ? <Badge size="sm" color={PRIMARY_BROWN} variant="filled" fw={600}>{item.badge}</Badge> : null}
                      active={item.active}
                      onClick={() => { setOpened(false); item.path && navigate(item.path); item.onClick?.(); }}
                      styles={{
                        root: {
                          borderRadius: '0 8px 8px 0',
                          padding: '10px 16px',
                          marginBottom: '2px',
                          borderLeft: item.active ? `3px solid ${PRIMARY_BROWN}` : '3px solid transparent',
                          transition: 'all 0.2s ease',
                          '&:hover': { backgroundColor: item.active ? '#F5F0EB' : '#FAFAFA' },
                        },
                        label: { color: item.active ? PRIMARY_BROWN : CHARCOAL, fontSize: '14px' },
                        section: { color: item.active ? PRIMARY_BROWN : MUTED_OLIVE },
                      }}
                      style={{ backgroundColor: item.active ? '#F5F0EB' : 'transparent' }}
                    />
                  </div>
                );
              });
            })()}
          </Stack>
        </AppShell.Section>

        <Box px="lg" py="md" style={{ borderTop: '1px solid #F0F0F0' }}>
          <Group gap="sm" wrap="nowrap">
            <UserAvatar src={userData?.profileImage} firstName={userData?.firstName} />
            <Box style={{ minWidth: 0 }}>
              <Text size="sm" fw={600} c={CHARCOAL} truncate>{userData?.firstName} {userData?.lastName}</Text>
              <Text size="xs" c={MUTED_OLIVE} truncate>{roleDisplay}</Text>
            </Box>
          </Group>
        </Box>
      </AppShell.Navbar>

      <AppShell.Header style={{ backgroundColor: "white", borderBottom: '1px solid #ECECEC' }}>
        <Flex align="center" justify="space-between" h="100%" px="lg">
          <Group gap="md">
            <Burger opened={opened} onClick={() => setOpened(o => !o)} hiddenFrom="sm" size="sm" color={PRIMARY_BROWN} />
            <Group gap={10}>
              <img src="/sola_logo.png" alt="SOLA Logo" style={{ width: 34, height: 34, objectFit: 'contain' }} />
              <Box>
                <Text size="md" fw={700} c={PRIMARY_BROWN} lh={1.2}>SOLA</Text>
                <Text size="10px" c={MUTED_OLIVE} fw={500} lh={1} tt="uppercase" lts={0.5}>Sebastinian Office of Legal Aid</Text>
              </Box>
            </Group>
          </Group>

          <Group gap={4}>
            <NotificationDropdown
              notifications={notifList} unreadCount={unreadCount} loading={notifLoading}
              onRead={markAsRead} onReadAll={markAllAsRead}
              onDelete={deleteNotification} onClearAll={deleteAllNotifications}
              onRefresh={refreshNotifications} onNavigate={handleNavNotification}
            />
            <Menu shadow="md" width={180} position="bottom-end">
              <Menu.Target>
                <Tooltip label="Account" position="bottom">
                  <ActionIcon size={36} variant="subtle" color="gray" radius="xl" p={0}>
                    <UserAvatar src={userData?.profileImage} firstName={userData?.firstName} size={32} bg={ACCENT_TAN} />
                  </ActionIcon>
                </Tooltip>
              </Menu.Target>
              <Menu.Dropdown style={{ borderRadius: '10px', border: '1px solid #E8E8E8' }}>
                <Menu.Label style={{ fontSize: '10px', fontWeight: 700, color: MUTED_OLIVE, textTransform: 'uppercase', letterSpacing: '1px' }}>
                  Account
                </Menu.Label>
                <Menu.Item leftSection={<IconUserCircle size={16} />} onClick={() => navigate('/admin/profile')} styles={MENU_ITEM_STYLES}>
                  Profile
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item leftSection={<IconLogout size={16} />} color="red" onClick={handleLogout} styles={MENU_ITEM_STYLES}>
                  Logout
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
        </Flex>
      </AppShell.Header>

      <AppShell.Main style={{ backgroundColor: BG }}>
        <Box style={{ minHeight: 'calc(100vh - 60px)' }}>{children}</Box>
      </AppShell.Main>
    </AppShell>
  );
};

export { Layout };