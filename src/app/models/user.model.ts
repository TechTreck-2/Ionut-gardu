// User model interfaces for authentication and user management
export interface User {
  id: number;
  username: string;
  email: string;
  confirmed?: boolean;
  blocked?: boolean;
  role?: UserRole;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserRole {
  id: number;
  name: string;
  description?: string;
  type?: string;
}

// Registration request interface
export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

// Login request interface  
export interface LoginRequest {
  identifier: string; // Can be username or email
  password: string;
}

// Authentication response interface
export interface AuthResponse {
  jwt: string;
  user: User;
}

// Registration error details
export interface RegistrationError {
  error: {
    status: number;
    name: string;
    message: string;
    details?: {
      errors?: Array<{
        path: string[];
        message: string;
        name: string;
      }>;
    };
  };
}

// User preferences/profile update interface
export interface UserUpdateRequest {
  username?: string;
  email?: string;
  // Add other updatable fields as needed
}

// Password reset interfaces
export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  code: string;
  password: string;
  passwordConfirmation: string;
}
