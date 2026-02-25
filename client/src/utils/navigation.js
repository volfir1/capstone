// utils/navigationConfig.js

import {
  IconHome,
  IconSettings,
  IconDashboard,
  IconUsers,
  IconFiles,
  IconChartArea,
  IconShield,
  IconDatabase,
  IconClipboardText,
  IconUserPlus,
  IconUserCircle,
  IconBriefcase,
  IconBriefcase2,
  IconFolder,
  IconCalendar,
  IconMessage,
  IconBook,
  IconSchool,
  IconCheckbox,
  IconMessageCircle,
  IconScale,
  IconLocationSearch,
  IconChartDots,
  IconChartBar,
  IconClipboardCheck
} from "@tabler/icons-react";

export const NAVIGATION_CONFIG = {
  secretary: [
    { icon: IconDashboard, label: "Dashboard", path: '/admin', section: 'main' },
    { icon: IconUsers, label: "User Management", path: 'users', section: 'main' },
    { icon: IconBriefcase, label: "Finalized Cases", path: 'finalized', section: 'main' },
    { icon: IconClipboardCheck, label: "Assigned Cases", path: 'assigned-cases', section: 'main' },
    { icon: IconChartDots, label: "Appointments", path: 'clientformstatus', section: 'main' },
    { icon: IconChartBar, label: "Analytics", path: 'analytics', section: 'insights' },
    { icon: IconUserCircle, label: "Profile", path: 'profile', section: 'account' },
  ],
  
  attorney: [
    { icon: IconDashboard, label: "Dashboard", path: '/admin', section: 'main' },
    { icon: IconUsers, label: "User Management", path: 'users', section: 'main' },
    { icon: IconBriefcase, label: "Finalized Cases", path: 'finalized', section: 'main' },
    { icon: IconClipboardCheck, label: "Assigned Cases", path: 'assigned-cases', section: 'main' },
    { icon: IconChartDots, label: "Appointments", path: 'clientformstatus', section: 'main' },
    { icon: IconChartBar, label: "Analytics", path: 'analytics', section: 'insights' },
    { icon: IconUserCircle, label: "Profile", path: 'profile', section: 'account' },
  ],
  
  intern: [
    { icon: IconDashboard, label: "Dashboard", path: '/admin', section: 'main' },
    { icon: IconUsers, label: "User Management", path: 'users', section: 'main' },
    { icon: IconBriefcase, label: "Finalized Cases", path: 'finalized', section: 'main' },
    { icon: IconClipboardCheck, label: "Assigned Cases", path: 'assigned-cases', section: 'main' },
    { icon: IconChartDots, label: "Appointments", path: 'clientformstatus', section: 'main' },
    { icon: IconChartBar, label: "Analytics", path: 'analytics', section: 'insights' },
    { icon: IconUserCircle, label: "Profile", path: 'profile', section: 'account' },
  ],
  
  supervising_lawyer: [
    { icon: IconDashboard, label: "Dashboard", path: '/admin', section: 'main' },
    { icon: IconUsers, label: "User Management", path: 'users', section: 'main' },
    { icon: IconBriefcase, label: "Finalized Cases", path: 'finalized', section: 'main' },
    { icon: IconClipboardCheck, label: "Assigned Cases", path: 'assigned-cases', section: 'main' },
    { icon: IconChartDots, label: "Appointments", path: 'clientformstatus', section: 'main' },
    { icon: IconChartBar, label: "Analytics", path: 'analytics', section: 'insights' },
    { icon: IconUserCircle, label: "Profile", path: 'profile', section: 'account' },
  ],
  
  director: [
    { icon: IconDashboard, label: "Dashboard", path: '/admin', section: 'main' },
    { icon: IconUsers, label: "User Management", path: 'users', section: 'main' },
    { icon: IconBriefcase, label: "Finalized Cases", path: 'finalized', section: 'main' },
    { icon: IconClipboardCheck, label: "Assigned Cases", path: 'assigned-cases', section: 'main' },
    { icon: IconChartDots, label: "Appointments", path: 'clientformstatus', section: 'main' },
    { icon: IconChartBar, label: "Analytics", path: 'analytics', section: 'insights' },
    { icon: IconUserCircle, label: "Profile", path: 'profile', section: 'account' },
  ],
  
  client: [
    { icon: IconHome, label: "Home", path: "home", section: 'main' },
    { icon: IconBriefcase2, label: "Schedule Appointment", path: "appointment", section: 'main' },
    { icon: IconLocationSearch, label: "Track Appointment", path: "track", section: 'main' },
    { icon: IconUserCircle, label: "Profile", path: "profile", section: 'account' },
  ],
};

// Helper function to get navigation items by role
export const getNavigationByRole = (role, currentPath) => {
  const items = NAVIGATION_CONFIG[role] || NAVIGATION_CONFIG.client;
  
  // Map role to base path - all admin roles use 'admin' base path
  const rolePathMap = {
    secretary: 'admin',
    attorney: 'admin',
    intern: 'admin',
    supervising_lawyer: 'admin',
    director: 'admin',
    client: 'user'
  };
  
  const basePath = rolePathMap[role] || 'user';
  
  return items.map(item => {
    // Normalize paths for comparison
    const itemPath = item.path.startsWith('/') ? item.path : `/${basePath}/${item.path}`;
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
  client: "Client",
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
  client: "Client Portal",
};

// Layout configuration for specific pages
// NOTE: Chat routes disabled per project checklist. Keeping entries commented
// so they can be re-enabled later if needed.
export const LAYOUT_CONFIG = {
  // Pages with custom layout settings (no header/sidebar or custom)
  // '/user/chat': { showHeader: false, showNavbar: true },
  // '/admin/chat': { showHeader: false, showNavbar: true },
  // '/admin/chat/:caseId': { showHeader: false, showNavbar: false },

  // Add more custom pages here as needed
  // Example: '/user/profile': { showHeader: true, showNavbar: false },
};

// Helper function to get layout config for current path
export const getLayoutConfig = (pathname) => {
  // Check for exact match first
  if (LAYOUT_CONFIG[pathname]) {
    return LAYOUT_CONFIG[pathname];
  }
  
  // Check for pattern match (e.g., routes with params)
  for (const [pattern, config] of Object.entries(LAYOUT_CONFIG)) {
    if (pattern.includes(':')) {
      const regex = new RegExp('^' + pattern.replace(/:[^/]+/g, '[^/]+') + '$');
      if (regex.test(pathname)) {
        return config;
      }
    }
  }
  
  // Default: show both header and navbar
  return { showHeader: true, showNavbar: true };
};