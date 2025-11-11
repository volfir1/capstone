
export const CASE_TYPES = [
  { 
    id: 'civil', 
    label: 'Civil Case', 
    icon: 'document-text',
    description: 'Disputes between individuals or organizations'
  },
  { 
    id: 'criminal', 
    label: 'Criminal Case', 
    icon: 'shield',
    description: 'Cases involving criminal offenses'
  },
  { 
    id: 'family', 
    label: 'Family Law', 
    icon: 'people',
    description: 'Marriage, custody, and family matters'
  },
  { 
    id: 'labor', 
    label: 'Labor Case', 
    icon: 'briefcase',
    description: 'Employment and workplace disputes'
  },
  { 
    id: 'property', 
    label: 'Property Dispute', 
    icon: 'home',
    description: 'Real estate and property issues'
  },
  { 
    id: 'other', 
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