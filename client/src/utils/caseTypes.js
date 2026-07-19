// utils/caseTypes.js

import { 
  IconShield, 
  IconFiles, 
  IconBriefcase2, 
  IconUsers, 
  IconBuildingEstate, 
  IconCalculator,
  IconPlane,
  IconHome,
  IconDots,
  IconLeaf,
  IconHandStop
} from '@tabler/icons-react';

export const CASE_TYPES = [
  { 
    id: 'criminal', 
    label: 'Criminal Law', 
    icon: IconShield,
    description: 'Cases involving criminal offenses'
  },
  { 
    id: 'civil', 
    label: 'Civil Law', 
    icon: IconFiles,
    description: 'Disputes between individuals or organizations'
  },
  { 
    id: 'family', 
    label: 'Family Law', 
    icon: IconUsers,
    description: 'Marriage, custody, and family matters'
  },
  { 
    id: 'labor', 
    label: 'Labor Law', 
    icon: IconBriefcase2,
    description: 'Employment and workplace disputes'
  },
  { 
    id: 'commercial', 
    label: 'Commercial Law', 
    icon: IconBuildingEstate,
    description: 'Business and commercial disputes'
  },
  { 
    id: 'tax', 
    label: 'Tax Law', 
    icon: IconCalculator,
    description: 'Tax-related legal matters'
  },
  { 
    id: 'immigration', 
    label: 'Immigration Law', 
    icon: IconPlane,
    description: 'Immigration and visa issues'
  },
  { 
    id: 'property', 
    label: 'Land and Property Law', 
    icon: IconHome,
    description: 'Real estate and property issues'
  },
  { 
    id: 'human_rights', 
    label: 'Human Rights', 
    icon: IconHandStop,
    description: 'Human rights violations'
  },
  { 
    id: 'environmental', 
    label: 'Environmental Law', 
    icon: IconLeaf,
    description: 'Environmental protection cases'
  },
  { 
    id: 'other', 
    label: 'Other', 
    icon: IconDots,
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

// Helper function to get case type icon component
export const getCaseTypeIcon = (id) => {
  const caseType = getCaseTypeById(id);
  return caseType ? caseType.icon : IconDots;
};

// Helper function to get case type description
export const getCaseTypeDescription = (id) => {
  const caseType = getCaseTypeById(id);
  return caseType ? caseType.description : 'Unknown case type';
};