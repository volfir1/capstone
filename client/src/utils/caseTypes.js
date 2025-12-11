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

export const CASE_OPTIONS = [
    // Existing Types
    { id: 'criminal', label: 'Criminal Law', icon: IconShield },
    { id: 'civil', label: 'Civil Law', icon: IconFiles },
    { id: 'labor', label: 'Labor Law', icon: IconBriefcase2 },
    
    // Types from UI Prototype Image
    { id: 'family', label: 'Family Law', icon: IconUsers }, // Icon for groups/family
    { id: 'commercial', label: 'Commercial Law', icon: IconBuildingEstate }, // Icon for large business/buildings
    { id: 'tax', label: 'Tax Law', icon: IconCalculator }, // Icon for calculation/finance
    { id: 'immigration', label: 'Immigration Law', icon: IconPlane }, // Icon for travel/flight
    { id: 'property', label: 'Land and Property Law', icon: IconHome }, // Icon for home/real estate

    // Types suggested by remaining UI slots (based on standard legal fields)
    { id: 'human_rights', label: 'Human Rights', icon: IconHandStop }, // Icon for stop/rights
    { id: 'environmental', label: 'Environmental Law', icon: IconLeaf }, // Icon for nature/green
    
    // The "Other" option for miscellaneous cases
    { id: 'other', label: 'Other', icon: IconDots }, // Icon for ellipses/more options
];