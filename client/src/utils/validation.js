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
    required: "Email or username is required",
    // Remove email pattern validation to allow username
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
    pattern: { 
      value: /^[a-zA-Z\s.'-]+$/, 
      message: "Please enter a valid name" 
    }
  },
  
  age: {
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
    validate: (value) => {
      if (!value) return true;
      const selectedDate = new Date(value);
      const today = new Date();
      return selectedDate <= today || "Birthday cannot be in the future";
    }
  },
  
  contactNumber: {
    pattern: { 
      value: /^[\d\s\-+()]+$/, 
      message: "Please enter a valid phone number" 
    }
  },
  
  sex: {},
  
  civilStatus: {},
  
  citizenship: {},
  
  spouse: {},
  
  cellphoneNumber: {
    pattern: { 
      value: /^[\d\s\-+()]+$/, 
      message: "Please enter a valid phone number" 
    }
  },
  
  presentAddress: {},
  
  telephoneNumber: {
    pattern: { 
      value: /^[\d\s\-+()]+$/, 
      message: "Please enter a valid phone number" 
    }
  },

  presentAddressTelephone: {
    pattern: { 
      value: /^[\d\s\-+()]+$/, 
      message: "Please enter a valid phone number" 
    }
  },

  permanentAddressTelephone: {
    pattern: { 
      value: /^[\d\s\-+()]+$/, 
      message: "Please enter a valid phone number" 
    }
  },
  
  permanentAddress: {},
  
  relatorName: {},
  
  relationshipToClient: {},
  
  // ============================================
  // FINANCIAL DETAILS VALIDATION
  // ============================================
  currentSourceOfIncome: {},
  
  monthlyIncome: {
    min: { 
      value: 0, 
      message: "Income cannot be negative" 
    },
    validate: (value) => {
      if (!value && value !== 0) return true;
      return !isNaN(value) || "Please enter a valid number";
    }
  },
  
  natureOfWork: {},
  
  employerName: {},
  
  employerAddress: {},
  
  employerTelephone: {
    pattern: { 
      value: /^[\d\s\-+()]+$/, 
      message: "Please enter a valid phone number" 
    }
  },
  
  spouseSourceOfIncome: {},
  
  spouseMonthlyIncome: {
    min: { 
      value: 0, 
      message: "Income cannot be negative" 
    }
  },
  
  spouseEmployerAddress: {},
  
  totalCombinedIncome: {
    min: { 
      value: 0, 
      message: "Income cannot be negative" 
    }
  },
  
  // ============================================
  // CASE DETAILS VALIDATION
  // ============================================
  partyRepresented: {},
  
  venue: {},
  
  caseNumber: {},
  
  presentStage: {},
  
  caseNature: {},
  
  courtDivision: {},
  
  courtAddress: {},
  
  courtPhoneNumber: {
    pattern: { 
      value: /^[\d\s\-+()]+$/, 
      message: "Please enter a valid phone number" 
    }
  },
  
  presidingOfficer: {},
  
  adverseParty: {},
  
  adversePartyAddress: {},
  
  adversePartyPhone: {
    pattern: { 
      value: /^[\d\s\-+()]+$/, 
      message: "Please enter a valid phone number" 
    }
  },

  adversePartyCounselAddress: {},
  
  adversePartyCounselPhone: {
    pattern: { 
      value: /^[\d\s\-+()]+$/, 
      message: "Please enter a valid phone number" 
    }
  }
};