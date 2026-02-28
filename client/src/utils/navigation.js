// utils/navigationConfig.js

import {
  IconDashboard,
  IconUsers,
  IconChartBar,
  IconUserCircle,
  IconBriefcase,
  IconChartDots,
  IconClipboardCheck
} from "@tabler/icons-react";

const ADMIN_NAV = [
  { icon: IconDashboard, label: "Dashboard", path: '/admin', section: 'main' },
  { icon: IconUsers, label: "User Management", path: 'users', section: 'main' },
  { icon: IconBriefcase, label: "Finalized Cases", path: 'finalized', section: 'main' },
  { icon: IconClipboardCheck, label: "Assigned Cases", path: 'assigned-cases', section: 'main' },
  { icon: IconChartDots, label: "Appointments", path: 'clientformstatus', section: 'main' },
  { icon: IconChartBar, label: "Analytics", path: 'analytics', section: 'insights' },
  { icon: IconUserCircle, label: "Profile", path: 'profile', section: 'account' },
];

export const NAVIGATION_CONFIG = {
  secretary: ADMIN_NAV,
  attorney: ADMIN_NAV,
  intern: ADMIN_NAV,
  supervising_lawyer: ADMIN_NAV,
  director: ADMIN_NAV,
};

// Helper function to get navigation items by role
export const getNavigationByRole = (role, currentPath) => {
  const items = NAVIGATION_CONFIG[role] || ADMIN_NAV;

  return items.map(item => {
    const itemPath = item.path.startsWith('/') ? item.path : `/admin/${item.path}`;
    const isActive = currentPath === itemPath || currentPath.startsWith(itemPath + '/');

    return {
      ...item,
      path: itemPath,
      active: isActive
    };
  });
};

// Role display names
export const ROLE_DISPLAY = {
  secretary: "Secretary",
  attorney: "Attorney",
  intern: "Legal Intern",
  director: "Director",
  supervising_lawyer: "Supervising Lawyer",
};

// Page titles by role
export const PAGE_TITLES = {
  secretary: "Admin Dashboard",
  attorney: "Attorney Portal",
  intern: "Intern Portal",
  supervising_lawyer: "Supervising Lawyer Portal",
  director: "Director Portal",
};