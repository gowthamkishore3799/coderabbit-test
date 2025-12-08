export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface UserInfo {
  email: string;
  firstName: string;
  lastName: string;
  userId: number;
  profileImageLink?: string;
}

export interface AuthResponse {
  token: string;
  user: UserInfo;
}

export interface ErrorResponse {
  message: string;
  errors?: Record<string, string[]>;
}
