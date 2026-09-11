export interface CurrentUser {
  id: number;
  username: string;
  email: string;
  fullName: string;
  roles: string[];
  permissions: string[];
  /** Null = access to every branch (HQ / roaming staff). */
  homeBranchId: number | null;
  homeBranchName: string | null;
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
