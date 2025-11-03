// validationRules.js - Form validation rules

export const validationRules = {
  firstName: {
    required: "First name is required",
    maxLength: {
      value: 20,
      message: "First name must be less than 20 characters"
    }
  },

  lastName: {
    required: "Last name is required",
    maxLength: {
      value: 20,
      message: "Last name must be less than 20 characters"
    }
  },

  username: {
    required: "Username is required",
    maxLength: {
      value: 20,
      message: "Username must be less than 20 characters"
    },
    pattern: {
      value: /^[a-zA-Z0-9_]+$/,
      message: "Username can only contain letters, numbers, and underscores"
    }
  },

  email: {
    required: "Email is required",
    pattern: {
      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
      message: "Invalid email address"
    }
  },

  password: {
    required: "Password is required",
    minLength: {
      value: 8,
      message: "Password must be at least 8 characters"
    },
    pattern: {
      value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      message: "Password must contain uppercase, lowercase, number and special character"
    }
  },

  confirmPassword: {
    required: "Please confirm your password",
    validate: (value, formValues) => 
      value === formValues.password || "Passwords don't match"
  },

  // Login specific validations (simpler than signup)
  loginEmail: {
    required: "Email is required",
    pattern: {
      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
      message: "Invalid email address"
    }
  },

  loginPassword: {
    required: "Password is required",
    minLength: {
      value: 6,
      message: "Password must be at least 6 characters"
    }
  }
};

export default validationRules;