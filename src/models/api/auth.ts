export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token?: string;
  jwt?: string;
  accessToken?: string;
  refreshToken?: string;
  roles?: string[];
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface RegisterResponse {
  message: string;
}

export interface CurrentUserResponse {
  email: string;
  firstName: string;
  lastName: string;
}
