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
  IconChartDots
} from "@tabler/icons-react";

export const NAVIGATION_CONFIG = {
  secretary: [
    { icon: IconDashboard, label: "Dashboard", path: '/admin' },
    { icon: IconUsers, label: "Users Management", path: 'users' },
    // { icon: IconFiles, label: "Recommendation for Action", path: 'recommendation' },
    { icon: IconBriefcase, label: "Finalized Cases", path: 'finalized' },
    { icon: IconChartDots, label: "Client Appointment Status", path: 'clientformstatus' },
    { icon: IconUserCircle, label: "Profile", path: 'profile' },
  ],
  
  attorney: [
    { icon: IconDashboard, label: "Dashboard", path: '/admin' },
    { icon: IconUsers, label: "Users Management", path: 'users' },
    // { icon: IconFiles, label: "Recommendation for Action", path: 'recommendation' },
    { icon: IconBriefcase, label: "Finalized Cases", path: 'finalized' },
    { icon: IconChartDots, label: "Client Appointment Status", path: 'clientformstatus' },
    { icon: IconUserCircle, label: "Profile", path: 'profile' },
  ],
  
  intern: [
    { icon: IconDashboard, label: "Dashboard", path: '/admin' },
    { icon: IconUsers, label: "Users Management", path: 'users' },
    // { icon: IconFiles, label: "Recommendation for Action", path: 'recommendation' },
    { icon: IconBriefcase, label: "Finalized Cases", path: 'finalized' },
    { icon: IconChartDots, label: "Client Appointment Status", path: 'clientformstatus' },
    { icon: IconUserCircle, label: "Profile", path: 'profile' },
  ],
  
  supervising_lawyer: [
    { icon: IconDashboard, label: "Dashboard", path: '/admin' },
    { icon: IconUsers, label: "Users Management", path: 'users' },
    { icon: IconBriefcase, label: "Finalized Cases", path: 'finalized' },
    { icon: IconChartDots, label: "Client Appointment Status", path: 'clientformstatus' },
    { icon: IconUserCircle, label: "Profile", path: 'profile' },
  ],
  
  director: [
    { icon: IconDashboard, label: "Dashboard", path: '/admin' },
    { icon: IconUsers, label: "Users Management", path: 'users' },
    { icon: IconBriefcase, label: "Finalized Cases", path: 'finalized' },
    { icon: IconChartDots, label: "Client Appointment Status", path: 'clientformstatus' },
    { icon: IconUserCircle, label: "Profile", path: 'profile' },
  ],
  
  client: [
    { icon: IconHome, label: "Home", path: "home" },
    { icon: IconBriefcase2, label: "Schedule appointment", path: "appointment" },
    { icon: IconLocationSearch, label: "Track Appointment", path: "track" },
    { icon: IconUserCircle, label: "Profile", path: "profile" },
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
export const LAYOUT_CONFIG = {
  // Pages with custom layout settings (no header/sidebar or custom)
  '/user/chat': { showHeader: false, showNavbar: true },
  '/admin/chat': { showHeader: false, showNavbar: true },
  '/admin/chat/:caseId': { showHeader: false, showNavbar: false },
  
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