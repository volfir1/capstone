
export const CASE_TYPES = [
  { 
    id: 'Criminal Law', 
    label: 'Criminal Law', 
    icon: 'shield',
    description: 'Cases involving criminal offenses'
  },
  { 
    id: 'Civil Law', 
    label: 'Civil Law', 
    icon: 'document-text',
    description: 'Disputes between individuals or organizations'
  },
  { 
    id: 'Family Law', 
    label: 'Family Law', 
    icon: 'people',
    description: 'Marriage, custody, and family matters'
  },
  { 
    id: 'Labor Law', 
    label: 'Labor Law', 
    icon: 'briefcase',
    description: 'Employment and workplace disputes'
  },
  { 
    id: 'Commercial Law', 
    label: 'Commercial Law', 
    icon: 'business',
    description: 'Business and commercial disputes'
  },
  { 
    id: 'Tax Law', 
    label: 'Tax Law', 
    icon: 'calculator',
    description: 'Tax-related legal matters'
  },
  { 
    id: 'Immigration Law', 
    label: 'Immigration Law', 
    icon: 'airplane',
    description: 'Immigration and visa issues'
  },
  { 
    id: 'Land and Property Law', 
    label: 'Land and Property Law', 
    icon: 'home',
    description: 'Real estate and property issues'
  },
  { 
    id: 'Human Rights', 
    label: 'Human Rights', 
    icon: 'hand-right',
    description: 'Human rights violations'
  },
  { 
    id: 'Environmental Law', 
    label: 'Environmental Law', 
    icon: 'leaf',
    description: 'Environmental protection cases'
  },
  { 
    id: 'Agrarian Law', 
    label: 'Agrarian Law', 
    icon: 'nutrition',
    description: 'Agricultural land disputes'
  },
  { 
    id: 'Administrative Law', 
    label: 'Administrative Law', 
    icon: 'file-tray-full',
    description: 'Government and administrative matters'
  },
  { 
    id: 'Corporate Law', 
    label: 'Corporate Law', 
    icon: 'business',
    description: 'Corporate and company law'
  },
  { 
    id: 'Intellectual Property', 
    label: 'Intellectual Property', 
    icon: 'bulb',
    description: 'Patents, trademarks, copyrights'
  },
  { 
    id: 'Other', 
    label: 'Other', 
    icon: 'ellipsis-horizontal',
    description: 'Other legal matters'
  },
];

// Helper function to get case type by id
export const getCaseTypeById = (id) => {
  return CASE_TYPES.find(type => type.id === id);
};

// Helper function to get case type label
export const getCaseTypeLabel = (id) => {
  const caseType = getCaseTypeById(id);
  return caseType ? caseType.label : 'Unknown';
};