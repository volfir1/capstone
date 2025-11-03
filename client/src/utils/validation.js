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