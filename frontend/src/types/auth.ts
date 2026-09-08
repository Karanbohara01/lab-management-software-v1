export interface CurrentUser {
  id: number;
  username: string;
  email: string;
  fullName: string;
  roles: string[];
  permissions: string[];
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresInSeconds: number;
  user: CurrentUser;
}

export interface LoginRequest {
  username: string;
  password: string;
}
