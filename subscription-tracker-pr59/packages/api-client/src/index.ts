import type {
  AuthResponse,
  ErrorResponse,
  LoginRequest,
  RegisterRequest,
} from './types';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost/api';

const handleResponse = async <T>(
  response: Response,
): Promise<T> => {
  if (!response.ok) {
    const error: ErrorResponse = await response.json().catch(() => ({
      message: 'An error occurred',
    }));
    throw new Error(error.message || 'An error occurred');
  }
  return response.json();
};

export const login = async (
  credentials: LoginRequest,
): Promise<AuthResponse> => {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  });

  return handleResponse<AuthResponse>(response);
};

export const register = async (
  data: RegisterRequest,
): Promise<AuthResponse> => {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  return handleResponse<AuthResponse>(response);
};
