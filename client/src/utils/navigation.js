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
    { icon: IconUsers, label: "Users Management", badge: "12", path: 'users' },
    { icon: IconScale, label: "Manage Attorneys", path: 'attorneys' },
    { icon: IconBriefcase2, label: "Assign Case", path: 'assigncase' },
    { icon: IconFiles, label: "Recommendation for Action", path: 'recommendation' },
    // { icon: IconClipboardText, label: "Case Record", path: 'caserecord' },
    { icon: IconBriefcase, label: "Finalized Cases", path: 'finalized' },
    { icon: IconUserCircle, label: "Profile", path: 'profile' },
    { icon: IconChartDots, label: "Client Appointment Status", path: 'clientstats' },
  ],
  
  attorney: [
    { icon: IconDashboard, label: "Dashboard", path: '/attorney' },
    { icon: IconUserCircle, label: "Profile", path: 'profile' },
    { icon: IconFolder, label: "My Cases", badge: "8", path: 'cases' },
    { icon: IconBriefcase2, label: "Assigned Cases", path: 'assigned'  },
    { icon: IconCalendar, label: "Schedule", path: 'schedule' },
    { icon: IconMessageCircle, label: "Client Messages", path: 'chat' },
    // { icon: IconClipboardText, label: "Case Record", path: 'caserecord' },
    { icon: IconBriefcase, label: "Finalized Cases", path: 'finalized' },
    { icon: IconChartDots, label: "Client Appointment Status", path: 'clientstats' },
  ],
  
  intern: [
    { icon: IconDashboard, label: "Dashboard", path: '/intern' },
    { icon: IconFiles, label: "Recommendation for Action", path: 'recommendation' },
    // { icon: IconClipboardText, label: "Case Record", path: 'caserecord' },
    { icon: IconBriefcase, label: "Finalized Cases", path: 'finalized' },
    { icon: IconUserCircle, label: "Profile", path: 'profile' },
    { icon: IconChartDots, label: "Client Appointment Status", path: 'clientstats' },
  ],
  
  client: [
    { icon: IconHome, label: "Home", path: "home" },
    { icon: IconBriefcase2, label: "Schedule appointment", path: "appointment" },
    { icon: IconLocationSearch, label: "Track Appointment", path: "track" },
    { icon: IconMessageCircle, label: "Chat with Attorney", path: "chat" },
    { icon: IconUserCircle, label: "Profile", path: "profile" },
  ],
};

// Helper function to get navigation items by role
export const getNavigationByRole = (role, currentPath) => {
  const items = NAVIGATION_CONFIG[role] || NAVIGATION_CONFIG.client;
  
  // Map role to base path
  const rolePathMap = {
    secretary: 'admin',
    attorney: 'attorney',
    intern: 'intern',
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
};

// Page titles by role
export const PAGE_TITLES = {
  secretary: "Admin Dashboard",
  attorney: "Attorney Portal",
  intern: "Intern Portal",
  client: "Client Portal",
};

// Layout configuration for specific pages
export const LAYOUT_CONFIG = {
  // Pages with custom layout settings (no header/sidebar or custom)
  '/user/chat': { showHeader: false, showNavbar: true },
  '/attorney/chat': { showHeader: false, showNavbar: true },
  '/attorney/chat/:caseId': { showHeader: false, showNavbar: false },
  
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