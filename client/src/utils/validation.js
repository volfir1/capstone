// Signup validation rules
export const signupValidationRules = {
  firstName: {
    required: "First name is required",
    minLength: {
      value: 2,
      message: "First name must be at least 2 characters",
    },
    maxLength: {
      value: 50,
      message: "First name must not exceed 50 characters",
    },
    pattern: {
      value: /^[A-Za-z\s]+$/,
      message: "First name can only contain letters",
    },
  },
  
  lastName: {
    required: "Last name is required",
    minLength: {
      value: 2,
      message: "Last name must be at least 2 characters",
    },
    maxLength: {
      value: 50,
      message: "Last name must not exceed 50 characters",
    },
    pattern: {
      value: /^[A-Za-z\s]+$/,
      message: "Last name can only contain letters",
    },
  },
  
  username: {
    minLength: {
      value: 3,
      message: "Username must be at least 3 characters",
    },
    maxLength: {
      value: 20,
      message: "Username must not exceed 20 characters",
    },
    pattern: {
      value: /^[a-zA-Z0-9_]+$/,
      message: "Username can only contain letters, numbers, and underscores",
    },
  },
  
  email: {
    required: "Email is required",
    pattern: {
      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
      message: "Invalid email address",
    },
  },
  
  password: {
    required: "Password is required",
    minLength: {
      value: 6,
      message: "Password must be at least 6 characters",
    },
    pattern: {
      value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      message: "Password must contain uppercase, lowercase, and number",
    },
  },
  
  confirmPassword: (passwordValue) => ({
    required: "Please confirm your password",
    validate: (value) =>
      value === passwordValue || "Passwords do not match",
  }),
};

// Login validation rules (simpler than signup)
export const loginValidationRules = {
  email: {
    required: "Email is required",
    pattern: {
      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
      message: "Invalid email address",
    },
  },
  
  password: {
    required: "Password is required",
    minLength: {
      value: 6,
      message: "Password must be at least 6 characters",
    },
  },
};


export const caseValidationRules = {
  caseTitle: {
    required: "Case title is required",
    minLength: {
      value: 5,
      message: "Case title must be at least 5 characters",
    },
    maxLength: {
      value: 100,
      message: "Case title must not exceed 100 characters",
    },
    pattern: {
      value: /^[A-Za-z0-9\s\-.,&()]+$/,
      message: "Case title contains invalid characters",
    },
  },

  caseType: {
    required: "Please select a case type",
    validate: (value) => {
      if (!value || !value.id) {
        return "Please select a valid case type";
      }
      return true;
    },
  },

  shortDescription: {
    required: "Short description is required",
    minLength: {
      value: 20,
      message: "Short description must be at least 20 characters",
    },
    maxLength: {
      value: 300,
      message: "Short description must not exceed 300 characters",
    },
    validate: (value) => {
      if (!value || value.trim().length === 0) {
        return "Short description cannot be empty or contain only whitespace";
      }
      return true;
    },
  },

  detailedDescription: {
    required: "Detailed description is required",
    minLength: {
      value: 50,
      message: "Detailed description must be at least 50 characters",
    },
    maxLength: {
      value: 5000,
      message: "Detailed description must not exceed 5000 characters",
    },
    validate: (value) => {
      if (!value || value.trim().length === 0) {
        return "Detailed description cannot be empty or contain only whitespace";
      }
      return true;
    },
  },
};


// validation.js

export const validationRules = {
  // ============================================
  // PERSONAL DETAILS VALIDATION
  // ============================================
  name: {
    required: "Name is required",
    minLength: { 
      value: 2, 
      message: "Name must be at least 2 characters" 
    },
    pattern: { 
      value: /^[a-zA-Z\s.'-]+$/, 
      message: "Please enter a valid name" 
    }
  },
  
  age: {
    required: "Age is required",
    min: { 
      value: 1, 
      message: "Age must be at least 1" 
    },
    max: { 
      value: 150, 
      message: "Please enter a valid age" 
    }
  },
  
  birthday: {
    required: "Birthday is required",
    validate: (value) => {
      const selectedDate = new Date(value);
      const today = new Date();
      return selectedDate <= today || "Birthday cannot be in the future";
    }
  },
  
  contactNumber: {
    required: "Contact number is required",
    pattern: { 
      value: /^[\d\s\-+()]+$/, 
      message: "Please enter a valid phone number" 
    },
    minLength: {
      value: 7,
      message: "Contact number must be at least 7 digits"
    }
  },
  
  sex: {
    required: "Sex is required"
  },
  
  civilStatus: {
    required: "Civil status is required"
  },
  
  citizenship: {
    required: "Citizenship is required",
    minLength: {
      value: 2,
      message: "Citizenship must be at least 2 characters"
    }
  },
  
  spouse: {
    // Optional field
    minLength: {
      value: 2,
      message: "Spouse name must be at least 2 characters"
    }
  },
  
  cellphoneNumber: {
    pattern: { 
      value: /^[\d\s\-+()]+$/, 
      message: "Please enter a valid phone number" 
    }
  },
  
  presentAddress: {
    required: "Present address is required",
    minLength: { 
      value: 10, 
      message: "Please provide a complete address" 
    }
  },
  
  telephoneNumber: {
    pattern: { 
      value: /^[\d\s\-+()]+$/, 
      message: "Please enter a valid phone number" 
    }
  },
  
  permanentAddress: {
    required: "Permanent address is required",
    minLength: { 
      value: 10, 
      message: "Please provide a complete address" 
    }
  },
  
  relatorName: {
    minLength: {
      value: 2,
      message: "Relator name must be at least 2 characters"
    }
  },
  
  relationshipToClient: {
    minLength: {
      value: 2,
      message: "Relationship must be at least 2 characters"
    }
  },
  
  // ============================================
  // FINANCIAL DETAILS VALIDATION
  // ============================================
  currentSourceOfIncome: {
    required: "Current source of income is required",
    minLength: {
      value: 3,
      message: "Please provide more details"
    }
  },
  
  monthlyIncome: {
    required: "Monthly income is required",
    min: { 
      value: 0, 
      message: "Income cannot be negative" 
    },
    validate: (value) => {
      return !isNaN(value) || "Please enter a valid number";
    }
  },
  
  natureOfWork: {
    required: "Nature of work/business is required",
    minLength: {
      value: 3,
      message: "Please provide more details"
    }
  },
  
  employerName: {
    required: "Employer/Business owner's name is required",
    minLength: {
      value: 2,
      message: "Employer name must be at least 2 characters"
    }
  },
  
  employerAddress: {
    required: "Employer/Business address is required",
    minLength: {
      value: 10,
      message: "Please provide a complete address"
    }
  },
  
  employerTelephone: {
    pattern: { 
      value: /^[\d\s\-+()]+$/, 
      message: "Please enter a valid phone number" 
    }
  },
  
  spouseSourceOfIncome: {
    minLength: {
      value: 3,
      message: "Please provide more details"
    }
  },
  
  spouseMonthlyIncome: {
    min: { 
      value: 0, 
      message: "Income cannot be negative" 
    }
  },
  
  spouseEmployerAddress: {
    minLength: {
      value: 10,
      message: "Please provide a complete address"
    }
  },
  
  totalCombinedIncome: {
    min: { 
      value: 0, 
      message: "Income cannot be negative" 
    }
  },
  
  // ============================================
  // CASE DETAILS VALIDATION
  // ============================================
  partyRepresented: {
    required: "Party represented is required",
    minLength: {
      value: 3,
      message: "Please provide more details"
    }
  },
  
  venue: {
    required: "Venue/City is required",
    minLength: {
      value: 2,
      message: "Venue must be at least 2 characters"
    }
  },
  
  caseNumber: {
    required: "Case/Docket number is required",
    minLength: {
      value: 3,
      message: "Case number must be at least 3 characters"
    }
  },
  
  presentStage: {
    required: "Present stage of the case is required",
    minLength: {
      value: 3,
      message: "Please provide more details"
    }
  },
  
  caseNature: {
    required: "Nature of case is required",
    minLength: { 
      value: 10, 
      message: "Please provide more details about the case" 
    }
  },
  
  courtDivision: {
    required: "Court/Agency/Tribunal division is required",
    minLength: {
      value: 3,
      message: "Please provide complete information"
    }
  },
  
  courtAddress: {
    required: "Court/Agency/Tribunal address is required",
    minLength: {
      value: 10,
      message: "Please provide a complete address"
    }
  },
  
  courtPhoneNumber: {
    pattern: { 
      value: /^[\d\s\-+()]+$/, 
      message: "Please enter a valid phone number" 
    }
  },
  
  presidingOfficer: {
    required: "Presiding officer is required",
    minLength: {
      value: 3,
      message: "Please provide the officer's name"
    }
  },
  
  adverseParty: {
    minLength: {
      value: 2,
      message: "Party name must be at least 2 characters"
    }
  },
  
  adversePartyAddress: {
    minLength: {
      value: 10,
      message: "Please provide a complete address"
    }
  },
  
  adversePartyCounsel: {
    minLength: {
      value: 2,
      message: "Counsel name must be at least 2 characters"
    }
  },
  
  adversePartyCounselAddress: {
    minLength: {
      value: 10,
      message: "Please provide a complete address"
    }
  },
  
  adversePartyCounselPhone: {
    pattern: { 
      value: /^[\d\s\-+()]+$/, 
      message: "Please enter a valid phone number" 
    }
  }
};