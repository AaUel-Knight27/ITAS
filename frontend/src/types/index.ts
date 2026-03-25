export interface Role {
  name: string;
  description?: string;
}

export interface User {
  id: number | string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string | null;
  status: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface JwtResponse {
  token: string;
  tokenType: string;
  expiresIn: number;
}

export interface ApiError {
  status: number;
  message: string;
  timestamp?: string;
  error?: string;
  details?: Record<string, string>;
}

export * from "./course";
export * from "./enrollment";
export * from "./quiz";
export * from "./content";
