import React from 'react';
import {
  Popover,
  ActionIcon,
  Indicator,
  ScrollArea,
  Stack,
  Text,
  Group,
  Box,
  Button,
  Divider,
  Tooltip,
  CloseButton,
  Center,
  Loader,
} from '@mantine/core';
import {
  IconBell,
  IconBriefcase,
  IconCalendarEvent,
  IconGavel,
  IconCheckbox,
  IconAlertCircle,
  IconChecks,
} from '@tabler/icons-react';
import { PRIMARY_GOLD, PRIMARY_BROWN, MUTED_OLIVE, CHARCOAL, ACCENT_TAN } from '@utils/constants';
import { notifications as mantineNotifications } from '@mantine/notifications';
import { IconTrash } from '@tabler/icons-react';

// ── Icon + color map by notification type ──
const TYPE_CONFIG = {
  case_assigned:       { icon: IconBriefcase,     color: '#3B82F6' },
  new_case:            { icon: IconBriefcase,     color: '#8B5CF6' },
  appointment_created: { icon: IconCalendarEvent, color: '#10B981' },
  appointment_updated: { icon: IconCalendarEvent, color: '#F59E0B' },
  case_accepted:       { icon: IconGavel,         color: '#10B981' },
  case_rejected:       { icon: IconAlertCircle,   color: '#EF4444' },
  review_pending:      { icon: IconCheckbox,      color: '#F97316' },
  review_returned:     { icon: IconAlertCircle,   color: '#EF4444' },
  review_resubmitted:  { icon: IconCheckbox,      color: '#3B82F6' },
  account_verified:    { icon: IconChecks,        color: '#10B981' },
  general:             { icon: IconBell,          color: ACCENT_TAN },
};

function timeAgo(dateStr) {
  const seconds = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (seconds < 60) return 'Just now';
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function NotificationItem({ notification, onRead, onDelete, onNavigate }) {
  const config = TYPE_CONFIG[notification.type] || TYPE_CONFIG.general;
  const Icon = config.icon;

  return (
    <Box
      onClick={() => {
        if (!notification.read) onRead(notification._id);
        if (onNavigate && notification.referenceId) {
          onNavigate(notification.referenceId, notification.type);
        }
      }}
      style={{
        padding: '12px 16px',
        background: notification.read ? 'transparent' : '#FDFAF5',
        cursor: (onNavigate && notification.referenceId) ? 'pointer' : (notification.read ? 'default' : 'pointer'),
        borderLeft: notification.read ? '3px solid transparent' : `3px solid ${config.color}`,
        transition: 'background 0.15s',
        position: 'relative',
        '&:hover': { background: '#FAFAFA' },
      }}
    >
      <Group align="flex-start" wrap="nowrap" gap={12}>
        <Box
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: `${config.color}15`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            marginTop: 2,
          }}
        >
          <Icon size={16} color={config.color} stroke={2} />
        </Box>

        <Box style={{ flex: 1, minWidth: 0 }}>
          <Group justify="space-between" wrap="nowrap" gap={4}>
            <Text size="xs" fw={notification.read ? 500 : 700} c={CHARCOAL} truncate>
              {notification.title}
            </Text>
            <CloseButton
              size="xs"
              variant="subtle"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(notification._id);
              }}
              style={{ flexShrink: 0, opacity: 0.5 }}
            />
          </Group>
          <Text size="xs" c={MUTED_OLIVE} lineClamp={2} lh={1.4} mt={2}>
            {notification.message}
          </Text>
          <Text size="10px" c="#B0B0B0" mt={4}>
            {timeAgo(notification.createdAt)}
          </Text>
        </Box>
      </Group>

      {!notification.read && (
        <Box
          style={{
            position: 'absolute',
            top: 12,
            right: 38,
            width: 7,
            height: 7,
            borderRadius: '50%',
            background: config.color,
          }}
        />
      )}
    </Box>
  );
}

export default function NotificationDropdown({
  notifications,
  unreadCount,
  loading,
  onRead,
  onReadAll,
  onClearAll,
  onDelete,
  onRefresh,
  onNavigate,
}) {
  const [opened, setOpened] = React.useState(false);

  const handleOpen = () => {
    setOpened(true);
    // Always fetch fresh data when dropdown opens
    if (onRefresh) onRefresh();
  };

  const handleClearAll = async () => {
    if (onClearAll) {
      await onClearAll();
      mantineNotifications.show({
        title: 'Cleared',
        message: 'All notifications have been deleted.',
        color: 'green',
        autoClose: 3000,
      });
    }
  };

  return (
    <Popover
      width={380}
      position="bottom-end"
      shadow="lg"
      radius="lg"
      offset={8}
      opened={opened}
      onChange={setOpened}
    >
      <Popover.Target>
        <Tooltip label="Notifications" position="bottom">
          <Indicator
            color="red"
            size={unreadCount > 0 ? 16 : 0}
            offset={4}
            label={unreadCount > 99 ? '99+' : unreadCount}
            disabled={unreadCount === 0}
          >
            <ActionIcon size={36} variant="subtle" color="gray" radius="xl" onClick={handleOpen}>
              <IconBell size={18} />
            </ActionIcon>
          </Indicator>
        </Tooltip>
      </Popover.Target>

      <Popover.Dropdown
        p={0}
        style={{
          border: '1px solid #ECECEC',
          borderRadius: 12,
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <Group justify="space-between" px="md" py="sm" style={{ borderBottom: '1px solid #F0F0F0' }}>
          <Group gap={6}>
            <Text size="sm" fw={700} c={CHARCOAL}>
              Notifications
            </Text>
            {unreadCount > 0 && (
              <Box
                style={{
                  background: PRIMARY_BROWN,
                  color: 'white',
                  borderRadius: 10,
                  padding: '1px 8px',
                  fontSize: 11,
                  fontWeight: 700,
                }}
              >
                {unreadCount}
              </Box>
            )}
          </Group>
          {unreadCount > 0 && (
            <Button
              variant="subtle"
              size="compact-xs"
              color={PRIMARY_BROWN}
              onClick={onReadAll}
              style={{ fontSize: 11 }}
            >
              Mark all read
            </Button>
          )}
          {notifications && notifications.length > 0 && (
            <Button
              variant="subtle"
              size="compact-xs"
              color="red"
              leftSection={<IconTrash size={12} />}
              onClick={handleClearAll}
              style={{ fontSize: 11 }}
            >
              Clear All
            </Button>
          )}
        </Group>

        {/* Body */}
        <ScrollArea.Autosize mah={400}>
          {loading && notifications.length === 0 ? (
            <Center py="xl">
              <Loader size="sm" color={PRIMARY_BROWN} />
            </Center>
          ) : notifications.length === 0 ? (
            <Center py={40}>
              <Stack align="center" gap={8}>
                <IconBell size={32} color="#D5D5D5" stroke={1.5} />
                <Text size="sm" c="#B0B0B0">
                  No notifications yet
                </Text>
              </Stack>
            </Center>
          ) : (
            <Stack gap={0}>
              {notifications.map((n, i) => (
                <React.Fragment key={n._id}>
                  {i > 0 && <Divider color="#F5F5F5" />}
                  <NotificationItem
                    notification={n}
                    onRead={onRead}
                    onDelete={onDelete}
                    onNavigate={(referenceId, type) => {
                      setOpened(false);
                      if (onNavigate) onNavigate(referenceId, type);
                    }}
                  />
                </React.Fragment>
              ))}
            </Stack>
          )}
        </ScrollArea.Autosize>
      </Popover.Dropdown>
    </Popover>
  );
}
