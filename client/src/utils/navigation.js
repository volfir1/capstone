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
  IconBriefcase2,
  IconFolder,
  IconCalendar,
  IconMessage,
  IconBook,
  IconSchool,
  IconCheckbox,
  IconMessageCircle,
  IconScale,
} from "@tabler/icons-react";

export const NAVIGATION_CONFIG = {
  admin: [
    { icon: IconDashboard, label: "Dashboard", path: '/admin' },
    { icon: IconUsers, label: "Users Management", badge: "12", path: 'users' },
    { icon: IconScale, label: "Manage Attorneys", path: 'attorneys' },
    { icon: IconBriefcase2, label: "Assign Case", path: 'assigncase' }, 
    { icon: IconFiles, label: "Recommendation for Action", path: 'recommendation' },
    { icon: IconUserCircle, label: "Profile", path: 'profile' },
  ],
  
  attorney: [
    { icon: IconDashboard, label: "Dashboard", path: '/attorney' },
    { icon: IconUserCircle, label: "Profile", path: 'profile' },
    { icon: IconFolder, label: "My Cases", badge: "8", path: 'cases' },
    { icon: IconBriefcase2, label: "Assigned Cases", path: 'assigned'  },
    { icon: IconCalendar, label: "Schedule", path: 'schedule' },
    { icon: IconMessageCircle, label: "Client Messages", path: 'chat' },
    { icon: IconClipboardText, label: "Case Reports", path: 'reports' },
    { icon: IconFiles, label: "Documents", path: 'documents' },
    { icon: IconSettings, label: "Settings", path: 'settings' },
  ],
  
  intern: [
    { icon: IconDashboard, label: "Dashboard", path: '/intern' },
    { icon: IconBook, label: "Learning Resources", path: '/intern/resources' },
    { icon: IconFolder, label: "Assigned Tasks", badge: "5", path: '/intern/tasks' },
    { icon: IconFiles, label: "Case Assistance", path: '/intern/cases' },
    { icon: IconCheckbox, label: "Training Modules", path: '/intern/training' },
    { icon: IconCalendar, label: "Schedule", path: '/intern/schedule' },
    { icon: IconMessage, label: "Messages", path: '/intern/messages' },
    { icon: IconSchool, label: "Mentorship", path: '/intern/mentorship' },
    { icon: IconUserCircle, label: "Profile", path: '/intern/profile' },
  ],
  
  client: [
    { icon: IconHome, label: "Home", path: "home" },
    { icon: IconBriefcase2, label: "Submit a Case", path: "submitcase" },
    { icon: IconFiles, label: "My Cases", path: "trackcase" },
    { icon: IconMessageCircle, label: "Chat with Attorney", path: "chat" },
    { icon: IconUserCircle, label: "Profile", path: "profile" },
  ],
};

// Helper function to get navigation items by role
// Helper function to get navigation items by role
export const getNavigationByRole = (role, currentPath) => {
  const items = NAVIGATION_CONFIG[role] || NAVIGATION_CONFIG.client;
  
  return items.map(item => {
    // Normalize paths for comparison
    const itemPath = item.path.startsWith('/') ? item.path : `/${role}/${item.path}`;
    const isActive = currentPath === itemPath || currentPath.startsWith(itemPath + '/');
    
    return {
      ...item,
      active: isActive
    };
  });
};

// Role display names
export const ROLE_DISPLAY = {
  admin: "Administrator",
  attorney: "Attorney",
  intern: "Legal Intern",
  client: "Client",
};

// Page titles by role
export const PAGE_TITLES = {
  admin: "Admin Dashboard",
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